import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../common/dtos/login.dto';
import { RegisterDto } from '../common/dtos/register.dto';
import { AUTH_USERS_JSON_SCHEMA } from '../common/json-schemas/auth-users.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Registro de usuario' })
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	@ApiOperation({ summary: 'Inicio de sesion con email y password' })
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Get('json-schema')
	@ApiOperation({ summary: 'JSON Schema para auth y users' })
	getJsonSchema() {
		return AUTH_USERS_JSON_SCHEMA;
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Perfil del usuario autenticado' })
	me(@Req() request: { user?: { id?: string } }) {
		return this.authService.validateUser(String(request.user?.id ?? ''));
	}

	@Post('logout')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Cerrar sesion (frontend debe eliminar token)' })
	logout() {
		return this.authService.logout();
	}

	@Post('refresh')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Renovar token antes de expirar' })
	refresh(@Req() request: { user?: { id?: string } }) {
		return this.authService.refreshToken(String(request.user?.id ?? ''));
	}
}
