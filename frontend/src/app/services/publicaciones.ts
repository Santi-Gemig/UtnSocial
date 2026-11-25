import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

export interface ComentarioItem {
    _id: string;
    publicacion_id: string;
    usuario_id: {
        _id: string;
        nombre: string;
        apellido: string;
        username: string;
        foto_perfil_url?: string;
        perfil: string;
    };
    mensaje: string;
    modificado: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface ListarComentariosResponse {
    total: number;
    limit: number;
    offset: number;
    comentarios: ComentarioItem[];
}

@Injectable({
    providedIn: 'root',
})
export class PublicacionesService {
    private http = inject(HttpClient);

    private readonly apiUrl = `${environment.apiUrl}/publicaciones`;

    //  Listar con paginación, orden y filtro
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

    //  Obtener una publicación individual por ID (Sprint #3)
    obtenerPorId(id: string): Observable<PublicacionItem> {
        return this.http.get<PublicacionItem>(`${this.apiUrl}/${id}`);
    }

    //  Crear nueva publicación usando FormData (multipart/form-data como en clase 11)
    crear(datos: { titulo: string; descripcion: string; imagen?: File | null }): Observable<PublicacionItem> {
        const formData = new FormData();
        formData.append('titulo', datos.titulo);
        formData.append('descripcion', datos.descripcion);
        if (datos.imagen) {
            formData.append('imagen', datos.imagen);
        }
        return this.http.post<PublicacionItem>(this.apiUrl, formData);
    }

    //  Dar "Me gusta"
    darLike(id: string): Observable<{ mensaje: string; totalLikes: number }> {
        return this.http.post<{ mensaje: string; totalLikes: number }>(
            `${this.apiUrl}/${id}/like`,
            {},
        );
    }

    //  Sacar "Me gusta"
    quitarLike(id: string): Observable<{ mensaje: string; totalLikes: number }> {
        return this.http.delete<{ mensaje: string; totalLikes: number }>(
            `${this.apiUrl}/${id}/like`,
        );
    }

    // Eliminar publicación (baja lógica)
    eliminar(id: string): Observable<{ mensaje: string }> {
        return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
    }

    // Listar comentarios paginados de una publicación (Sprint #3)
    listarComentarios(
        publicacionId: string,
        limit = 5,
        offset = 0,
    ): Observable<ListarComentariosResponse> {
        return this.http.get<ListarComentariosResponse>(
            `${this.apiUrl}/${publicacionId}/comentarios?limit=${limit}&offset=${offset}`,
        );
    }

    //  Crear un comentario en una publicación (Sprint #3)
    crearComentario(
        publicacionId: string,
        mensaje: string,
    ): Observable<ComentarioItem> {
        return this.http.post<ComentarioItem>(
            `${this.apiUrl}/${publicacionId}/comentarios`,
            { mensaje },
        );
    }

    // Editar un comentario propio — marca modificado: true (Sprint #3)
    editarComentario(
        publicacionId: string,
        comentarioId: string,
        mensaje: string,
    ): Observable<ComentarioItem> {
        return this.http.put<ComentarioItem>(
            `${this.apiUrl}/${publicacionId}/comentarios/${comentarioId}`,
            { mensaje },
        );
    }
}