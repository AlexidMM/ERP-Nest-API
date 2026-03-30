import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddGroupMemberDto } from '../common/dtos/add-group-member.dto';
import { CreateGroupDto } from '../common/dtos/create-group.dto';

@Injectable()
export class GroupsService {
	constructor(private readonly prisma: PrismaService) {}

	private getGroupDelegate(): {
		create: (args: unknown) => Promise<Record<string, unknown>>;
		findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
	} {
		const prismaDynamic = this.prisma as unknown as Record<string, unknown>;
		const delegate = prismaDynamic.grupo as
			| {
					create: (args: unknown) => Promise<Record<string, unknown>>;
					findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
			  }
			| undefined;

		if (!delegate) {
			throw new BadRequestException(
				'No existe modelo de grupos en Prisma. Ejecuta: npx prisma generate',
			);
		}

		return delegate;
	}

	private getGroupMemberDelegate(): {
		create: (args: unknown) => Promise<Record<string, unknown>>;
		findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
		findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
	} {
		const prismaDynamic = this.prisma as unknown as Record<string, unknown>;
		const delegate = prismaDynamic.grupoMiembro as
			| {
					create: (args: unknown) => Promise<Record<string, unknown>>;
					findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
					findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
			  }
			| undefined;

		if (!delegate) {
			throw new BadRequestException(
				'No existe modelo de grupo_miembros en Prisma. Ejecuta: npx prisma generate',
			);
		}

		return delegate;
	}

	private getUserDelegate(): {
		findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
	} {
		const prismaDynamic = this.prisma as unknown as Record<string, unknown>;
		const delegate = prismaDynamic.usuario as
			| {
					findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
			  }
			| undefined;

		if (!delegate) {
			throw new BadRequestException('No existe modelo de usuarios en Prisma. Ejecuta: npx prisma generate');
		}

		return delegate;
	}

	async createGroup(dto: CreateGroupDto, creatorId: string) {
		if (!creatorId) {
			throw new BadRequestException('No se pudo identificar al usuario autenticado');
		}

		const groups = this.getGroupDelegate();
		const members = this.getGroupMemberDelegate();
		const users = this.getUserDelegate();

		const creator = await users.findUnique({ where: { id: creatorId } });
		if (!creator) {
			throw new BadRequestException('El creador no existe en la base de datos');
		}

		const group = await groups.create({
			data: {
				nombre: dto.nombre.trim(),
				descripcion: dto.descripcion?.trim() || null,
				nivel: dto.nivel?.trim() || null,
				creadorId: creatorId,
			},
		});

		await members.create({
			data: {
				grupoId: String(group.id),
				usuarioId: creatorId,
			},
		});

		return group;
	}

	async addMember(groupId: string, dto: AddGroupMemberDto) {
		const groups = this.getGroupDelegate();
		const members = this.getGroupMemberDelegate();
		const users = this.getUserDelegate();

		const group = await groups.findUnique({ where: { id: groupId } });
		if (!group) {
			throw new BadRequestException('El grupo no existe');
		}

		const user = await users.findUnique({ where: { id: dto.usuarioId } });
		if (!user) {
			throw new BadRequestException('El usuario no existe');
		}

		const existingMembership = await members.findFirst({
			where: {
				grupoId: groupId,
				usuarioId: dto.usuarioId,
			},
		});

		if (existingMembership) {
			throw new BadRequestException('El usuario ya pertenece a ese grupo');
		}

		return members.create({
			data: {
				grupoId: groupId,
				usuarioId: dto.usuarioId,
			},
		});
	}

	async listMembers(groupId: string) {
		const members = this.getGroupMemberDelegate();
		return members.findMany({
			where: { grupoId: groupId },
			orderBy: { fechaUnido: 'desc' },
		});
	}
}
