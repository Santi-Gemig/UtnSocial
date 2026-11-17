import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    // Interceptor para manejar errores 401
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const urlActual = router.url;
            const esRutaAuth =
                urlActual.startsWith('/login') ||
                urlActual.startsWith('/registro') ||
                urlActual.startsWith('/cargando') ||
                req.url.includes('/auth/login');

            if (error.status === 401 && !esRutaAuth) {
                authService.logout();
            }
            return throwError(() => error);
        }),
    );
};
