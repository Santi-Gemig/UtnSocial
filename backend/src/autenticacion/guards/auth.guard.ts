import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extraerTokenDeCabecera(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado o sesión cerrada');
        }

        try {
            // Verificar y decodificar el payload del token
            // (usa el mismo secreto con el que se registró el JwtModule)
            const payload = await this.jwtService.verifyAsync(token);

            // Adjuntar los datos del usuario a la request para que los lea el Controller
            (request as any)['user'] = payload;
        } catch {
            throw new UnauthorizedException('Token inválido o expirado. Vuelve a iniciar sesión.');
        }

        return true;
    }

    // Extrae el token del formato "Bearer <token>"
    private extraerTokenDeCabecera(request: Request): string | undefined {
        const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
        return tipo === 'Bearer' ? token : undefined;
    }
}
