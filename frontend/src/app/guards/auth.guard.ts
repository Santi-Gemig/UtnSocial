import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Guard de rutas: solo se puede acceder a la aplicación estando logueado (token válido y no vencido)
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn() && !authService.estaTokenVencido()) {
        return true;
    }

    // Limpia cualquier sesión vencida o incompleta y manda al login
    authService.cerrarSesionLocal();
    return router.createUrlTree(['/login']);
};
