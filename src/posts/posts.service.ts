import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from '../common/dtos/create-post.dto';

@Injectable()
export class PostsService {
	constructor(private readonly prisma: PrismaService) {}

	private getPostDelegate(): {
		findMany: (args?: unknown) => Promise<Record<string, unknown>[]>;
		create: (args: unknown) => Promise<Record<string, unknown>>;
	} {
		const prismaDynamic = this.prisma as unknown as Record<string, unknown>;
		const delegate = (prismaDynamic.post ?? prismaDynamic.posts) as
			| {
					findMany: (args?: unknown) => Promise<Record<string, unknown>[]>;
					create: (args: unknown) => Promise<Record<string, unknown>>;
			  }
			| undefined;

		if (!delegate) {
			throw new BadRequestException(
				'No existe modelo de posts en Prisma. Ejecuta: npx prisma db pull ; npx prisma generate',
			);
		}

		return delegate;
	}

	async findAll() {
		const posts = this.getPostDelegate();

		try {
			return await posts.findMany({ orderBy: { creadoEn: 'desc' } });
		} catch {
			return posts.findMany({ orderBy: { createdAt: 'desc' } });
		}
	}

	async create(dto: CreatePostDto, authorId: string) {
		if (!authorId) {
			throw new BadRequestException('No se pudo identificar al usuario autenticado');
		}

		const posts = this.getPostDelegate();

		try {
			return await posts.create({
				data: {
					titulo: dto.titulo.trim(),
					contenido: dto.contenido.trim(),
					resumen: dto.resumen?.trim() || null,
					autorId: authorId,
				},
			});
		} catch {
			return posts.create({
				data: {
					title: dto.titulo.trim(),
					content: dto.contenido.trim(),
					summary: dto.resumen?.trim() || null,
					authorId,
				},
			});
		}
	}
}
