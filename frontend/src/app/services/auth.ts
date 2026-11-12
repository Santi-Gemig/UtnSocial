import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

    // URL base del backend NestJS (configurada en environment.ts como en clase 11)
    private readonly apiUrl = `${environment.apiUrl}/auth`;

    // Signals reactivos para el estado de la sesión
    currentUser = signal<Usuario | null>(this.obtenerUsuarioGuardado());
    token = signal<string | null>(localStorage.getItem('token'));

    // Computed: sabe si está logueado automáticamente
    isLoggedIn = computed(() => !!this.currentUser());

    // 1. Registro
    registro(datos: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/registro`, datos).pipe(
            tap((res) => this.guardarSesion(res.token, res.usuario))
        );
    }

    // 2. Login
    login(credenciales: { identificador: string; password: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
            tap((res) => this.guardarSesion(res.token, res.usuario))
        );
    }

    // 3. Cerrar sesión
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        this.token.set(null);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    // Helpers internos
    private guardarSesion(token: string, usuario: Usuario): void {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.token.set(token);
        this.currentUser.set(usuario);
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