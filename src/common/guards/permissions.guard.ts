import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HAS_PERMISSION_KEY } from '../decorators/has-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredPermissions = this.reflector.getAllAndOverride<string[]>(HAS_PERMISSION_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredPermissions || requiredPermissions.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user || !user.permisosGlobales) {
			throw new ForbiddenException('No tienes permisos suficientes');
		}

		const userPermissions = Array.isArray(user.permisosGlobales) ? user.permisosGlobales : [];
		const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

		if (!hasPermission) {
			throw new ForbiddenException(`Permiso requerido: ${requiredPermissions.join(' | ')}`);
		}

		return true;
	}
}
