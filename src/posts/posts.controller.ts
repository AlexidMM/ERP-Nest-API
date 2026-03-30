import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePostDto } from '../common/dtos/create-post.dto';
import { PostsService } from './posts.service';

interface AuthenticatedRequest {
	user?: {
		id?: string;
	};
}

@ApiTags('posts')
@Controller('posts')
export class PostsController {
	constructor(private readonly postsService: PostsService) {}

	@Get()
	@ApiOperation({ summary: 'Listar posts' })
	findAll() {
		return this.postsService.findAll();
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Crear post (requiere JWT)' })
	create(@Body() dto: CreatePostDto, @Req() req: AuthenticatedRequest) {
		return this.postsService.create(dto, req.user?.id ?? '');
	}
}
