import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

export interface PublicacionItem {
    _id: string;
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    usuario_id: {
        _id: string;
        nombre: string;
        apellido: string;
        username: string;
        foto_perfil_url?: string;
        perfil: string;
    };
    likes: string[];
    activo: boolean;
    createdAt: string;
}

export interface ListarPublicacionesResponse {
    total: number;
    limit: number;
    offset: number;
    publicaciones: PublicacionItem[];
}

@Injectable({
    providedIn: 'root',
})
export class PublicacionesService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private readonly apiUrl = `${environment.apiUrl}/publicaciones`;

    // Helper para armar la cabecera con el token JWT
    private getHeaders(): HttpHeaders {
        const token = this.authService.token();
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });
    }

    // 1. Listar con paginación, orden y filtro
    listar(params: {
        orden?: 'fecha' | 'likes';
        usuarioId?: string;
        limit?: number;
        offset?: number;
    }): Observable<ListarPublicacionesResponse> {
        let url = `${this.apiUrl}?limit=${params.limit || 10}&offset=${params.offset || 0}`;
        if (params.orden) url += `&orden=${params.orden}`;
        if (params.usuarioId) url += `&usuarioId=${params.usuarioId}`;

        return this.http.get<ListarPublicacionesResponse>(url);
    }

    // 2. Crear nueva publicación usando FormData (multipart/form-data como en clase 11)
    crear(datos: { titulo: string; descripcion: string; imagen?: File | null }): Observable<PublicacionItem> {
        const formData = new FormData();
        formData.append('titulo', datos.titulo);
        formData.append('descripcion', datos.descripcion);
        if (datos.imagen) {
            formData.append('imagen', datos.imagen);
        }
        // No se establece Content-Type: el navegador agrega el boundary automáticamente
        return this.http.post<PublicacionItem>(this.apiUrl, formData, { headers: this.getHeaders() });
    }

    // 3. Dar "Me gusta"
    darLike(id: string): Observable<{ mensaje: string; totalLikes: number }> {
        return this.http.post<{ mensaje: string; totalLikes: number }>(
            `${this.apiUrl}/${id}/like`,
            {},
            { headers: this.getHeaders() }
        );
    }

    // 4. Quitar "Me gusta"
    quitarLike(id: string): Observable<{ mensaje: string; totalLikes: number }> {
        return this.http.delete<{ mensaje: string; totalLikes: number }>(
            `${this.apiUrl}/${id}/like`,
            { headers: this.getHeaders() }
        );
    }

    // 5. Eliminar publicación (baja lógica)
    eliminar(id: string): Observable<{ mensaje: string }> {
        return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`, {
            headers: this.getHeaders(),
        });
    }
}
