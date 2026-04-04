import { BadRequestException, Injectable } from '@nestjs/common';
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
	} {
		const prismaDynamic = this.prisma as unknown as Record<string, unknown>;
		const delegate = (prismaDynamic.usuario ?? prismaDynamic.user) as
			| {
					findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
					create: (args: unknown) => Promise<Record<string, unknown>>;
					update: (args: unknown) => Promise<Record<string, unknown>>;
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

		const hashedPassword = await bcrypt.hash(dto.password, 10);

		const created = await users.create({
			data: {
				usuario: dto.usuario.trim().toLowerCase(),
				email: dto.email.trim().toLowerCase(),
				passwordHash: hashedPassword,
				nombreCompleto: dto.nombreCompleto.trim(),
				direccion: dto.direccion?.trim() || null,
				telefono: dto.telefono?.trim() || null,
				fechaNacimiento: new Date(dto.fechaNacimiento),
				permisosGlobales: dto.permisosGlobales ?? [],
			},
		});

		return this.toPublicUser(created);
	}

	async findByEmail(email: string) {
		const users = this.getUserDelegate();
		return users.findUnique({
			where: { email: email.toLowerCase().trim() },
		});
	}

	async findById(userId: string) {
		const users = this.getUserDelegate();
		return users.findUnique({ where: { id: userId } });
	}

	async findAll(): Promise<PublicUser[]> {
		const users = this.getUserDelegate();
		const allUsers = await (users as unknown as { findMany: (args: unknown) => Promise<Record<string, unknown>[]> }).findMany?.({}) ?? [];
		return allUsers.map((user) => this.toPublicUser(user));
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

	toPublicUser(user: Record<string, unknown>): PublicUser {
		return {
			id: String(user.id),
			usuario: String(user.usuario ?? user.username ?? ''),
			email: String(user.email ?? ''),
			nombreCompleto: String(user.nombreCompleto ?? user.fullName ?? ''),
			direccion: (user.direccion as string | null | undefined) ?? (user.address as string | null | undefined) ?? null,
			telefono: (user.telefono as string | null | undefined) ?? (user.phone as string | null | undefined) ?? null,
			fechaNacimiento:
				(user.fechaNacimiento as Date | undefined) ??
				(user.birthDate as Date | undefined) ??
				new Date('1970-01-01'),
			permisosGlobales: (user.permisosGlobales as string[] | undefined) ?? [],
			ultimoLogin:
				(user.ultimoLogin as Date | null | undefined) ??
				(user.lastLogin as Date | null | undefined) ??
				null,
			creadoEn:
				(user.creadoEn as Date | undefined) ??
				(user.createdAt as Date | undefined) ??
				new Date(),
			actualizadoEn:
				(user.actualizadoEn as Date | undefined) ??
				(user.updatedAt as Date | undefined) ??
				new Date(),
		};
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
