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
    private readonly TIEMPO_AVISO_MS = 10 * 60 * 1000;

    private getAuthHeaders(): HttpHeaders {
        return new HttpHeaders({
            Authorization: `Bearer ${this.token() || ''}`,
        });
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

    // Inicia o reinicia el contador de 10 minutos
    iniciarContadorSesion(): void {
        this.detenerContadorSesion();
        if (!this.token()) return;
        this.sesionTimer = setTimeout(() => {
            if (this.isLoggedIn()) {
                this.mostrarModalSesion.set(true);
            }
        }, this.TIEMPO_AVISO_MS);
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