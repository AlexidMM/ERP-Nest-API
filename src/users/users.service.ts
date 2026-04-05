import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../common/dtos/create-user.dto';

export interface PublicUser {
	id: string;
	usuario: string;
	email: string;
	nombreCompleto: string;
	direccion: string | null;
	telefono: string | null;
	fechaNacimiento: Date;
	permisosGlobales: string[];
	ultimoLogin: Date | null;
	status: string;
	creadoEn: Date;
	actualizadoEn: Date;
}

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	private getUserDelegate(): {
		findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
		create: (args: unknown) => Promise<Record<string, unknown>>;
		update: (args: unknown) => Promise<Record<string, unknown>>;
		delete: (args: unknown) => Promise<Record<string, unknown>>;
	} {
		const prismaDynamic = this.prisma as unknown as Record<string, unknown>;
		const delegate = (prismaDynamic.usuario ?? prismaDynamic.user) as
			| {
					findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
					create: (args: unknown) => Promise<Record<string, unknown>>;
					update: (args: unknown) => Promise<Record<string, unknown>>;
					delete: (args: unknown) => Promise<Record<string, unknown>>;
			  }
			| undefined;

		if (!delegate) {
			throw new BadRequestException(
				'No existe modelo de usuarios en Prisma. Ejecuta: npx prisma db pull ; npx prisma generate',
			);
		}

		return delegate;
	}

	async createUser(dto: CreateUserDto): Promise<PublicUser> {
		const users = this.getUserDelegate();
		this.validateAdult(dto.fechaNacimiento);
		const normalizedPhone = String(dto.telefono ?? '').trim();

		const existingByEmail = await users.findUnique({
			where: { email: dto.email.toLowerCase().trim() },
		});

		if (existingByEmail) {
			throw new BadRequestException('El email ya existe');
		}

		const existingByUsername = await users.findUnique({
			where: { usuario: dto.usuario.trim().toLowerCase() },
		});

		if (existingByUsername) {
			throw new BadRequestException('El usuario ya existe');
		}

		if (normalizedPhone.length > 0) {
			const phoneRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
				SELECT id
				FROM usuarios
				WHERE telefono = ${normalizedPhone}
				LIMIT 1
			`;

			if (phoneRows.length > 0) {
				throw new BadRequestException('El telefono ya existe');
			}
		}

		const hashedPassword = await bcrypt.hash(dto.password, 10);

		const created = await users.create({
			data: {
				usuario: dto.usuario.trim().toLowerCase(),
				email: dto.email.trim().toLowerCase(),
				passwordHash: hashedPassword,
				nombreCompleto: dto.nombreCompleto.trim(),
				direccion: dto.direccion?.trim() || null,
				telefono: normalizedPhone || null,
				fechaNacimiento: new Date(dto.fechaNacimiento),
				permisosGlobales: dto.permisosGlobales ?? [],
			},
		});

		return this.toPublicUser(created);
	}

	async findByEmail(email: string) {
		const normalizedEmail = email.toLowerCase().trim();
		const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
			SELECT *
			FROM usuarios
			WHERE LOWER(email) = ${normalizedEmail}
			LIMIT 1
		`;

		return rows[0] ?? null;
	}

	async findById(userId: string) {
		const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
			SELECT *
			FROM usuarios
			WHERE id = ${userId}::uuid
			LIMIT 1
		`;

		return rows[0] ?? null;
	}

	async findPublicById(userId: string): Promise<PublicUser> {
		const user = await this.findById(userId);
		if (!user || this.isDeactivated(user)) {
			throw new NotFoundException('Usuario no encontrado');
		}

		return this.toPublicUser(user);
	}

	async findAll(): Promise<PublicUser[]> {
		const allUsers = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
			SELECT *
			FROM usuarios
			WHERE COALESCE(status, 'activo') <> 'desactivado'
			ORDER BY creado_en DESC
		`;
		return allUsers.map((user) => this.toPublicUser(user));
	}

	async findEffectivePermissions(userId: string): Promise<string[]> {
		const user = await this.findPublicById(userId);

		const rows = await this.prisma.$queryRaw<Array<{ nombre: string }>>`
			SELECT DISTINCT p.nombre
			FROM grupo_usuarios_permisos gup
			JOIN grupos g ON g.id = gup.grupo_id
			JOIN usuarios u ON u.id = gup.usuario_id
			JOIN permisos p ON p.id = gup.permiso_id
			WHERE gup.usuario_id = ${userId}::uuid
			AND COALESCE(g.status, 'activo') <> 'desactivado'
			AND COALESCE(u.status, 'activo') <> 'desactivado'
		`;

		const groupPermissions = rows
			.map((row) => String(row.nombre ?? '').trim().toLowerCase())
			.filter((permission) => permission.length > 0);

		const globalPermissions = (user.permisosGlobales ?? [])
			.map((permission) => String(permission ?? '').trim().toLowerCase())
			.filter((permission) => permission.length > 0);

		return Array.from(new Set([...globalPermissions, ...groupPermissions]));
	}

	async updateUser(userId: string, updates: Record<string, unknown>): Promise<PublicUser> {
		const users = this.getUserDelegate();
		const currentUser = await this.findById(userId);
		if (!currentUser) {
			throw new NotFoundException('Usuario no encontrado');
		}

		const dataToUpdate: Record<string, unknown> = { actualizadoEn: new Date() };

		if (updates.fechaNacimiento) {
			this.validateAdult(String(updates.fechaNacimiento));
			dataToUpdate.fechaNacimiento = new Date(String(updates.fechaNacimiento));
		}

		if (updates.usuario) {
			const nextUsername = String(updates.usuario).trim().toLowerCase();
			const currentUsername = String(currentUser.usuario ?? '').trim().toLowerCase();
			if (nextUsername !== currentUsername) {
				const existingByUsername = await users.findUnique({ where: { usuario: nextUsername } });
				if (existingByUsername) {
					throw new BadRequestException('El usuario ya existe');
				}
			}

			dataToUpdate.usuario = nextUsername;
		}

		if (updates.email) {
			const nextEmail = String(updates.email).trim().toLowerCase();
			const currentEmail = String(currentUser.email ?? '').trim().toLowerCase();
			if (nextEmail !== currentEmail) {
				const existingByEmail = await users.findUnique({ where: { email: nextEmail } });
				if (existingByEmail) {
					throw new BadRequestException('El email ya existe');
				}
			}

			dataToUpdate.email = nextEmail;
		}

		if (updates.telefono !== undefined) {
			const normalizedPhone = String(updates.telefono ?? '').trim();
			if (normalizedPhone.length > 0) {
				const phoneRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
					SELECT id
					FROM usuarios
					WHERE telefono = ${normalizedPhone}
					AND id <> ${userId}::uuid
					LIMIT 1
				`;

				if (phoneRows.length > 0) {
					throw new BadRequestException('El telefono ya existe');
				}
			}

			dataToUpdate.telefono = normalizedPhone || null;
		}

		if (updates.nombreCompleto !== undefined) {
			dataToUpdate.nombreCompleto = String(updates.nombreCompleto ?? '').trim();
		}

		if (updates.direccion !== undefined) {
			dataToUpdate.direccion = String(updates.direccion ?? '').trim() || null;
		}

		if (Array.isArray(updates.permisosGlobales)) {
			dataToUpdate.permisosGlobales = updates.permisosGlobales;
		}

		if (updates.password) {
			dataToUpdate.passwordHash = await bcrypt.hash(String(updates.password), 10);
		}

		const updated = await users.update({
			where: { id: userId },
			data: dataToUpdate,
		});

		return this.toPublicUser(updated);
	}

	async deleteUser(userId: string): Promise<void> {
		const user = await this.findById(userId);
		if (!user || this.isDeactivated(user)) {
			throw new NotFoundException('Usuario no encontrado');
		}

		const normalizedEmail = String(user.email ?? '').trim().toLowerCase();
		if (normalizedEmail === 'admin@erp.com') {
			throw new BadRequestException('No se puede eliminar la cuenta de administrador principal');
		}

		await this.prisma.$executeRaw`
			UPDATE usuarios
			SET status = 'desactivado', actualizado_en = CURRENT_TIMESTAMP
			WHERE id = ${userId}::uuid
		`;
	}

	async touchLastLogin(userId: string): Promise<void> {
		const users = this.getUserDelegate();
		await users.update({
			where: { id: userId },
			data: { ultimoLogin: new Date() },
		});
	}

	async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
		const users = this.getUserDelegate();
		await users.update({
			where: { id: userId },
			data: { passwordHash },
		});
	}

	async updateProfile(userId: string, updates: Record<string, unknown>): Promise<PublicUser> {
		const users = this.getUserDelegate();
		const dataToUpdate: Record<string, unknown> = { actualizadoEn: new Date() };

		if (updates.nombreCompleto) {
			dataToUpdate.nombreCompleto = String(updates.nombreCompleto).trim();
		}
		if (updates.direccion) {
			dataToUpdate.direccion = String(updates.direccion).trim();
		}
		if (updates.telefono) {
			dataToUpdate.telefono = String(updates.telefono).trim();
		}

		const updated = await users.update({
			where: { id: userId },
			data: dataToUpdate,
		});

		return this.toPublicUser(updated);
	}

	async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
		const user = await this.findById(userId);
		if (!user) {
			throw new NotFoundException('Usuario no encontrado');
		}

		const storedPasswordHash =
			typeof user.passwordHash === 'string'
				? user.passwordHash
				: typeof user.password === 'string'
					? user.password
					: '';

		const looksHashed = storedPasswordHash.startsWith('$2a$') || storedPasswordHash.startsWith('$2b$') || storedPasswordHash.startsWith('$2y$');
		const isCurrentPasswordValid = looksHashed
			? await bcrypt.compare(currentPassword, storedPasswordHash)
			: currentPassword === storedPasswordHash;

		if (!isCurrentPasswordValid) {
			throw new BadRequestException('La contraseña actual es incorrecta');
		}

		const hashedNewPassword = await bcrypt.hash(newPassword, 10);
		await this.updatePasswordHash(userId, hashedNewPassword);
	}

	toPublicUser(user: Record<string, unknown>): PublicUser {
		return {
			id: String(user.id),
			usuario: String(user.usuario ?? user.username ?? ''),
			email: String(user.email ?? ''),
			nombreCompleto: String(user.nombreCompleto ?? user.fullName ?? ''),
			direccion:
				(user.direccion as string | null | undefined) ??
				(user.direccion_text as string | null | undefined) ??
				(user.address as string | null | undefined) ??
				null,
			telefono:
				(user.telefono as string | null | undefined) ??
				(user.phone as string | null | undefined) ??
				null,
			fechaNacimiento:
				(user.fechaNacimiento as Date | undefined) ??
				(user.fecha_nacimiento as Date | undefined) ??
				(user.birthDate as Date | undefined) ??
				new Date('1970-01-01'),
			permisosGlobales: (user.permisosGlobales as string[] | undefined) ?? [],
			ultimoLogin:
				(user.ultimoLogin as Date | null | undefined) ??
				(user.ultimo_login as Date | null | undefined) ??
				(user.lastLogin as Date | null | undefined) ??
				null,
			status: String(user.status ?? 'activo'),
			creadoEn:
				(user.creadoEn as Date | undefined) ??
				(user.creado_en as Date | undefined) ??
				(user.createdAt as Date | undefined) ??
				new Date(),
			actualizadoEn:
				(user.actualizadoEn as Date | undefined) ??
				(user.actualizado_en as Date | undefined) ??
				(user.updatedAt as Date | undefined) ??
				new Date(),
		};
	}

	private isDeactivated(user: Record<string, unknown>): boolean {
		return String(user.status ?? 'activo').trim().toLowerCase() === 'desactivado';
	}

	private validateAdult(dateValue: string): void {
		const birthDate = new Date(dateValue);
		if (Number.isNaN(birthDate.getTime())) {
			throw new BadRequestException('fechaNacimiento invalida');
		}

		const currentDate = new Date();
		let age = currentDate.getFullYear() - birthDate.getFullYear();
		const monthDiff = currentDate.getMonth() - birthDate.getMonth();
		const dayDiff = currentDate.getDate() - birthDate.getDate();

		if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
			age--;
		}

		if (age < 18) {
			throw new BadRequestException('Solo se permiten usuarios mayores de edad');
		}
	}
}
