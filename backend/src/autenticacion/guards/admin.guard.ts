import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || user.perfil !== 'administrador') {
            throw new ForbiddenException(
                'Acceso denegado: se requieren permisos de administrador',
            );
        }

        return true;
    }
}