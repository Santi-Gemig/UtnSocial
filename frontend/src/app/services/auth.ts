import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
    _id?: string;
    nombre: string;
    apellido: string;
    correo: string;
    username: string;
    fecha_nacimiento: string;
    descripcion?: string;
    foto_perfil_url?: string;
    perfil: 'usuario' | 'administrador';
}

export interface AuthResponse {
    mensaje: string;
    usuario: Usuario;
    token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);


    private readonly apiUrl = `${environment.apiUrl}/auth`;


    currentUser = signal<Usuario | null>(this.obtenerUsuarioGuardado());
    token = signal<string | null>(localStorage.getItem('token'));


    isLoggedIn = computed(() => !!this.currentUser());


    mostrarModalSesion = signal<boolean>(false);
    extendiendoSesion = signal<boolean>(false);
    private sesionTimer?: ReturnType<typeof setTimeout>;
    private readonly CINCO_MIN_MS = 5 * 60 * 1000;

    private getAuthHeaders(): HttpHeaders {
        const tokenActual = localStorage.getItem('token');
        if (tokenActual !== this.token()) {
            this.token.set(tokenActual);
        }
        return new HttpHeaders({
            Authorization: `Bearer ${tokenActual || ''}`,
        });
    }

    private decodificarPayload(token: string): { exp?: number } | null {
        try {
            const partes = token.split('.');
            if (partes.length !== 3) return null;
            const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
            return JSON.parse(atob(padded));
        } catch {
            return null;
        }
    }

    estaTokenVencido(): boolean {
        const tokenActual = localStorage.getItem('token');
        if (tokenActual !== this.token()) {
            this.token.set(tokenActual);
        }
        if (!tokenActual) return true;
        const payload = this.decodificarPayload(tokenActual);
        if (!payload || typeof payload.exp !== 'number') return true;
        return Date.now() >= payload.exp * 1000;
    }

    cerrarModalSesion(): void {
        this.mostrarModalSesion.set(false);
    }

    // Registro
    registro(datos: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/registro`, datos).pipe(
            tap((res) => this.guardarSesion(res.token, res.usuario))
        );
    }

    //  Login
    login(credenciales: { identificador: string; password: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
            tap((res) => this.guardarSesion(res.token, res.usuario))
        );
    }

    // Validar token al iniciar la app (POST /auth/autorizar)
    autorizar(): Observable<{ mensaje: string; usuario: Usuario }> {
        return this.http
            .post<{ mensaje: string; usuario: Usuario }>(
                `${this.apiUrl}/autorizar`,
                {},
                { headers: this.getAuthHeaders() },
            )
            .pipe(
                tap((res) => {
                    this.guardarSesion(this.token()!, res.usuario);
                }),
            );
    }

    //  Refrescar token por 15 minutos nuevos (POST /auth/refrescar)
    refrescarToken(): Observable<{ mensaje: string; token: string }> {
        return this.http
            .post<{ mensaje: string; token: string }>(
                `${this.apiUrl}/refrescar`,
                {},
                { headers: this.getAuthHeaders() },
            )
            .pipe(
                tap((res) => {
                    localStorage.setItem('token', res.token);
                    this.token.set(res.token);
                    this.mostrarModalSesion.set(false);
                    this.iniciarContadorSesion();
                }),
            );
    }


    confirmarExtenderSesion(): void {
        if (this.extendiendoSesion()) return;
        this.extendiendoSesion.set(true);
        this.refrescarToken().subscribe({
            next: () => {
                this.extendiendoSesion.set(false);
            },
            error: () => {
                this.extendiendoSesion.set(false);
                this.logout();
            },
        });
    }

    //  Actualizar perfil propio (solo usuario logueado vía JWT)
    actualizarPerfil(datos: FormData): Observable<{ mensaje: string; usuario: Usuario }> {
        return this.http
            .patch<{ mensaje: string; usuario: Usuario }>(
                `${environment.apiUrl}/usuarios/mi-perfil`,
                datos,
                { headers: this.getAuthHeaders() },
            )
            .pipe(tap((res) => this.guardarSesion(this.token()!, res.usuario)));
    }

    // 6. Cerrar sesión
    logout(): void {
        this.detenerContadorSesion();
        this.mostrarModalSesion.set(false);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        this.token.set(null);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    // Inicia o reinicia el contador según la expiración real del JWT (avisa 5 min antes)
    iniciarContadorSesion(): void {
        this.detenerContadorSesion();
        const tokenActual = localStorage.getItem('token');
        if (!tokenActual) return;

        const payload = this.decodificarPayload(tokenActual);
        if (!payload || typeof payload.exp !== 'number') return;

        const tiempoRestanteMs = payload.exp * 1000 - Date.now();
        if (tiempoRestanteMs <= 0) return;

        if (tiempoRestanteMs > this.CINCO_MIN_MS) {
            const esperaMs = tiempoRestanteMs - this.CINCO_MIN_MS;
            this.sesionTimer = setTimeout(() => {
                if (this.isLoggedIn() && !this.estaTokenVencido()) {
                    this.mostrarModalSesion.set(true);
                }
            }, esperaMs);
        }
    }

    detenerContadorSesion(): void {
        if (this.sesionTimer) {
            clearTimeout(this.sesionTimer);
            this.sesionTimer = undefined;
        }
    }

    // Helpers internos
    private guardarSesion(token: string, usuario: Usuario): void {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.token.set(token);
        this.currentUser.set(usuario);
        this.iniciarContadorSesion();
    }

    private obtenerUsuarioGuardado(): Usuario | null {
        const raw = localStorage.getItem('usuario');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}