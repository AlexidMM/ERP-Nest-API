import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../common/dtos/login.dto';
import { RegisterDto } from '../common/dtos/register.dto';
import { AUTH_USERS_JSON_SCHEMA } from '../common/json-schemas/auth-users.schema';
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
}
