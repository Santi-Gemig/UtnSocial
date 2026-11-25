import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
    ComentariosEnTiempoItem,
    ComentariosPorPublicacionItem,
    EstadisticasService,
    PublicacionesPorUsuarioItem,
} from '../../services/estadisticas';
import { ResumirPipe } from '../../pipes/resumir.pipe';
import { ResaltarCardDirective } from '../../directives/resaltar-card.directive';

const PALETA = [
    '#6366f1',
    '#a855f7',
    '#38bdf8',
    '#ec4899',
    '#14b8a6',
    '#f59e0b',
    '#8b5cf6',
    '#0ea5e9',
    '#10b981',
    '#f43f5e',
];

@Component({
    selector: 'app-dashboard-estadisticas',
    imports: [CommonModule, FormsModule, ResumirPipe, ResaltarCardDirective],
    templateUrl: './dashboard-estadisticas.html',
    styleUrl: './dashboard-estadisticas.css',
})
export class DashboardEstadisticas implements OnInit {
    private estadisticasService = inject(EstadisticasService);

    // Rango de fechas (por defecto últimos 30 días)
    desde = signal<string>(this.formatearFechaInput(new Date(Date.now() - 30 * 86400000)));
    hasta = signal<string>(this.formatearFechaInput(new Date()));

    cargando = signal<boolean>(true);
    errorMensaje = signal<string | null>(null);

    // Datos crudos desde MongoDB
    pubPorUsuario = signal<PublicacionesPorUsuarioItem[]>([]);
    comentariosTiempo = signal<ComentariosEnTiempoItem[]>([]);
    totalComentariosPeriodo = signal<number>(0);
    comentariosPorPub = signal<ComentariosPorPublicacionItem[]>([]);

    // Hover interactivo para tooltips
    puntoHover = signal<{ fecha: string; cantidad: number; x: number; y: number } | null>(null);
    porcionHover = signal<number | null>(null);

    // Gráfico de BARRAS: publicaciones por usuario
    barrasData = computed(() => {
        const lista = this.pubPorUsuario();
        const max = Math.max(...lista.map((x) => x.cantidad), 1);
        return lista.map((item, idx) => ({
            ...item,
            porcentajeAltura: Math.max((item.cantidad / max) * 100, 6),
            color: PALETA[idx % PALETA.length],
        }));
    });

    //  Gráfico de LÍNEAS (SVG 520x220): comentarios realizados por día
    lineasData = computed(() => {
        const lista = this.comentariosTiempo();
        const padL = 38;
        const padR = 20;
        const padT = 22;
        const padB = 34;
        const w = 520 - padL - padR;
        const h = 220 - padT - padB;
        const baseY = padT + h;
        const max = Math.max(...lista.map((d) => d.cantidad), 1);

        const pasoEtiqueta = lista.length > 8 ? Math.ceil(lista.length / 7) : 1;
        const puntos = lista.map((d, i) => {
            const x = lista.length === 1 ? padL + w / 2 : padL + (i / (lista.length - 1)) * w;
            const y = baseY - (d.cantidad / max) * h;
            const mostrarEtiqueta =
                lista.length <= 8 || i === 0 || i === lista.length - 1 || i % pasoEtiqueta === 0;
            return {
                fecha: d.fecha,
                fechaCorta: d.fecha.slice(5), // MM-DD
                cantidad: d.cantidad,
                x,
                y,
                mostrarEtiqueta,
            };
        });

        const polylinePoints = puntos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const areaPoints =
            puntos.length >= 2
                ? `${puntos[0].x.toFixed(1)},${baseY} ${polylinePoints} ${puntos[puntos.length - 1].x.toFixed(1)},${baseY}`
                : '';

        return {
            puntos,
            polylinePoints,
            areaPoints,
            max,
            mid: Math.round(max / 2),
            baseY,
            padL,
            rightX: 520 - padR,
            midY: padT + h / 2,
            topY: padT,
        };
    });

    // Gráfico de TORTA / DONA (SVG r=70): comentarios por publicación
    tortaData = computed(() => {
        const lista = this.comentariosPorPub();
        const radio = 70;
        const circunferencia = 2 * Math.PI * radio;
        const total = lista.reduce((acc, item) => acc + item.cantidad, 0);

        if (total === 0) {
            return { total: 0, porciones: [] as any[] };
        }

        let acumulado = 0;
        const porciones = lista.map((item, idx) => {
            const fraccion = item.cantidad / total;
            const largo = fraccion * circunferencia;
            const dasharray = `${largo.toFixed(2)} ${(circunferencia - largo).toFixed(2)}`;
            const dashoffset = (-acumulado).toFixed(2);
            acumulado += largo;

            return {
                ...item,
                porcentaje: Math.round(fraccion * 100),
                color: PALETA[idx % PALETA.length],
                dasharray,
                dashoffset,
            };
        });

        return { total, porciones };
    });

    ngOnInit(): void {
        this.cargarEstadisticas();
    }

    private formatearFechaInput(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    aplicarPreset(dias: number): void {
        const hoy = new Date();
        const inicio = new Date(hoy.getTime() - dias * 86400000);
        this.desde.set(this.formatearFechaInput(inicio));
        this.hasta.set(this.formatearFechaInput(hoy));
        this.cargarEstadisticas();
    }

    cargarEstadisticas(): void {
        this.errorMensaje.set(null);

        if (this.desde() && this.hasta() && this.desde() > this.hasta()) {
            this.errorMensaje.set('La fecha "Desde" no puede ser mayor que "Hasta".');
            return;
        }

        this.cargando.set(true);
        this.puntoHover.set(null);
        this.porcionHover.set(null);

        forkJoin({
            pubUser: this.estadisticasService.publicacionesPorUsuario(this.desde(), this.hasta()),
            comTiempo: this.estadisticasService.comentariosEnTiempo(this.desde(), this.hasta()),
            comPub: this.estadisticasService.comentariosPorPublicacion(this.desde(), this.hasta()),
        }).subscribe({
            next: ({ pubUser, comTiempo, comPub }) => {
                this.pubPorUsuario.set(pubUser.datos || []);
                this.comentariosTiempo.set(comTiempo.datos || []);
                this.totalComentariosPeriodo.set(comTiempo.total ?? 0);
                this.comentariosPorPub.set(comPub.datos || []);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                if (err.status === 401) return;
                const msg = err.error?.message || 'Error al cargar las estadísticas.';
                this.errorMensaje.set(Array.isArray(msg) ? msg.join(', ') : msg);
            },
        });
    }
}