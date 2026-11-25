import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicacionesPorUsuarioItem {
    usuarioId: string;
    username: string;
    nombre: string;
    cantidad: number;
}

export interface ComentariosEnTiempoItem {
    fecha: string;
    cantidad: number;
}

export interface ComentariosPorPublicacionItem {
    publicacionId: string;
    titulo: string;
    cantidad: number;
}

export interface EstadisticasResponse<T> {
    desde: string;
    hasta: string;
    total?: number;
    datos: T[];
}

@Injectable({
    providedIn: 'root',
})
export class EstadisticasService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/estadisticas`;

    private buildParams(desde?: string, hasta?: string): HttpParams {
        let params = new HttpParams();
        if (desde) params = params.set('desde', desde);
        if (hasta) params = params.set('hasta', hasta);
        return params;
    }

    publicacionesPorUsuario(
        desde?: string,
        hasta?: string,
    ): Observable<EstadisticasResponse<PublicacionesPorUsuarioItem>> {
        return this.http.get<EstadisticasResponse<PublicacionesPorUsuarioItem>>(
            `${this.apiUrl}/publicaciones-por-usuario`,
            { params: this.buildParams(desde, hasta) },
        );
    }

    comentariosEnTiempo(
        desde?: string,
        hasta?: string,
    ): Observable<EstadisticasResponse<ComentariosEnTiempoItem>> {
        return this.http.get<EstadisticasResponse<ComentariosEnTiempoItem>>(
            `${this.apiUrl}/comentarios-en-tiempo`,
            { params: this.buildParams(desde, hasta) },
        );
    }

    comentariosPorPublicacion(
        desde?: string,
        hasta?: string,
    ): Observable<EstadisticasResponse<ComentariosPorPublicacionItem>> {
        return this.http.get<EstadisticasResponse<ComentariosPorPublicacionItem>>(
            `${this.apiUrl}/comentarios-por-publicacion`,
            { params: this.buildParams(desde, hasta) },
        );
    }
}