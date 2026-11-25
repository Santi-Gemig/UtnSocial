import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const esApiPropia = req.url.startsWith(`${environment.apiUrl}/`);
    const esEndpointPublico =
        req.url.includes('/auth/login') || req.url.includes('/auth/registro');

    // Adjunta el token a todas las peticiones autenticadas hacia nuestra API
    const token = localStorage.getItem('token');
    if (token && esApiPropia && !esEndpointPublico && !req.headers.has('Authorization')) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    // Interceptor para manejar errores 401
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const urlActual = router.url;
            const esRutaAuth =
                urlActual.startsWith('/login') ||
                urlActual.startsWith('/registro') ||
                urlActual.startsWith('/cargando') ||
                esEndpointPublico;

            if (error.status === 401 && !esRutaAuth) {
                authService.logout();
            }
            return throwError(() => error);
        }),
    );
};
