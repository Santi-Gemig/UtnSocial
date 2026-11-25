import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Guard de rutas para administradores: requiere sesión válida y perfil "administrador"
export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn() || authService.estaTokenVencido()) {
        authService.cerrarSesionLocal();
        return router.createUrlTree(['/login']);
    }

    if (authService.currentUser()?.perfil !== 'administrador') {
        return router.createUrlTree(['/publicaciones']);
    }

    return true;
};