import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../common/dtos/create-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Crear un usuario (ruta protegida con JWT)' })
	create(@Body() dto: CreateUserDto) {
		return this.usersService.createUser(dto);
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Listar todos los usuarios' })
	async findAll() {
		return this.usersService.findAll();
	}
}
