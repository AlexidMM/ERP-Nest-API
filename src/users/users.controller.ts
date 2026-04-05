import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../common/dtos/create-user.dto';
import { UpdateProfileDto } from '../common/dtos/update-profile.dto';
import { ChangePasswordDto } from '../common/dtos/change-password.dto';
import { UpdateUserDto } from '../common/dtos/update-user.dto';
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

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Actualizar usuario por id' })
	async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return this.usersService.updateUser(id, dto as Record<string, unknown>);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Eliminar usuario por id' })
	async remove(@Param('id') id: string) {
		await this.usersService.deleteUser(id);
		return {
			message: 'Usuario eliminado correctamente',
		};
	}

	@Get(':id/permissions')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Obtener permisos efectivos del usuario (globales + grupos)' })
	async permissions(@Param('id') id: string) {
		const user = await this.usersService.findPublicById(id);
		const effectivePermissions = await this.usersService.findEffectivePermissions(id);
		return {
			usuarioId: user.id,
			permisosGlobales: effectivePermissions,
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
