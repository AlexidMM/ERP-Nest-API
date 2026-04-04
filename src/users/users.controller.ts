import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../common/dtos/create-user.dto';
import { UpdateProfileDto } from '../common/dtos/update-profile.dto';
import { ChangePasswordDto } from '../common/dtos/change-password.dto';
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

	@Get(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Obtener usuario por id' })
	async findOne(@Param('id') id: string) {
		return this.usersService.findPublicById(id);
	}

	@Get(':id/permissions')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Obtener permisos globales del usuario' })
	async permissions(@Param('id') id: string) {
		const user = await this.usersService.findPublicById(id);
		return {
			usuarioId: user.id,
			permisosGlobales: user.permisosGlobales,
		};
	}

	@Put('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
	async updateProfile(@Req() request: { user?: { id?: string } }, @Body() dto: UpdateProfileDto) {
		const userId = String(request.user?.id ?? '');
		return this.usersService.updateProfile(userId, dto as Record<string, unknown>);
	}

	@Put('me/password')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
	async changePassword(@Req() request: { user?: { id?: string } }, @Body() dto: ChangePasswordDto) {
		const userId = String(request.user?.id ?? '');
		await this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
		return {
			message: 'Contraseña actualizada correctamente',
		};
	}
}
