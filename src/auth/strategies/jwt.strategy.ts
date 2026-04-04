import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly authService: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET || 'dev-jwt-secret',
		});
	}

	async validate(payload: { sub: string; email?: string; usuario?: string; permisosGlobales?: string[] }) {
		const user = await this.authService.validateUser(payload.sub);
		if (user) {
			// Enrich user context with permissions from payload or from service
			user.permisosGlobales = payload.permisosGlobales ?? user.permisosGlobales ?? [];
		}
		return user;
	}
}
