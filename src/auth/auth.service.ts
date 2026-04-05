import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../common/dtos/login.dto';
import { RegisterDto } from '../common/dtos/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async register(dto: RegisterDto) {
		const user = await this.usersService.createUser({
			...dto,
			permisosGlobales: [],
		});

		const effectivePermissions = await this.usersService.findEffectivePermissions(user.id);
		const accessToken = await this.signToken(user.id, user.email, user.usuario, effectivePermissions);

		return {
			accessToken,
			user: {
				...user,
				permisosGlobales: effectivePermissions,
			},
		};
	}

	async login(dto: LoginDto) {
		const user = await this.usersService.findByEmail(dto.email);
		if (!user) {
			throw new UnauthorizedException('Credenciales invalidas');
		}

		const userStatus = String(user.status ?? 'activo').trim().toLowerCase();
		if (userStatus === 'desactivado') {
			throw new UnauthorizedException('Tu cuenta se encuentra desactivada');
		}

		const userId = String(user.id ?? '');
		const userEmail = String(user.email ?? '');
		const username = String(user.usuario ?? user.username ?? '');
		const effectivePermissions = await this.usersService.findEffectivePermissions(userId);

		const storedPasswordHash =
			typeof user.passwordHash === 'string'
				? user.passwordHash
				: typeof user.password_hash === 'string'
					? user.password_hash
				: typeof user.password === 'string'
					? user.password
					: '';

		const looksHashed = storedPasswordHash.startsWith('$2a$') || storedPasswordHash.startsWith('$2b$') || storedPasswordHash.startsWith('$2y$');
		const isPasswordValid = looksHashed
			? await bcrypt.compare(dto.password, storedPasswordHash)
			: dto.password === storedPasswordHash;
		if (!isPasswordValid) {
			throw new UnauthorizedException('Credenciales invalidas');
		}

		if (!looksHashed && storedPasswordHash) {
			const migratedHash = await bcrypt.hash(dto.password, 10);
			await this.usersService.updatePasswordHash(userId, migratedHash);
		}

		await this.usersService.touchLastLogin(userId);

		const accessToken = await this.signToken(userId, userEmail, username, effectivePermissions);

		return {
			accessToken,
			user: {
				...this.usersService.toPublicUser({
				...user,
				ultimoLogin: new Date(),
				}),
				permisosGlobales: effectivePermissions,
			},
		};
	}

	async validateUser(userId: string) {
		const user = await this.usersService.findById(userId);
		if (!user) {
			throw new UnauthorizedException('Usuario no encontrado');
		}

		const userStatus = String(user.status ?? 'activo').trim().toLowerCase();
		if (userStatus === 'desactivado') {
			throw new UnauthorizedException('Tu cuenta se encuentra desactivada');
		}

		return this.usersService.toPublicUser(user);
	}

	async logout() {
		// Token stateless: logout es efectivo cuando frontend borra el token
		return {
			message: 'Sesion cerrada correctamente',
		};
	}

	async refreshToken(userId: string) {
		const user = await this.usersService.findById(userId);
		if (!user) {
			throw new UnauthorizedException('Usuario no encontrado');
		}

		const userStatus = String(user.status ?? 'activo').trim().toLowerCase();
		if (userStatus === 'desactivado') {
			throw new UnauthorizedException('Tu cuenta se encuentra desactivada');
		}

		const userEmail = String(user.email ?? '');
		const username = String(user.usuario ?? user.username ?? '');
		const effectivePermissions = await this.usersService.findEffectivePermissions(userId);
		const accessToken = await this.signToken(userId, userEmail, username, effectivePermissions);

		return {
			accessToken,
		};
	}

	private async signToken(sub: string, email: string, usuario: string, permisosGlobales: string[] = []): Promise<string> {
		return this.jwtService.signAsync({ sub, email, usuario, permisosGlobales });
	}
}
