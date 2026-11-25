import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'tiempoRelativo',
})
export class TiempoRelativoPipe implements PipeTransform {
    transform(valor?: string | Date | null): string {
        if (!valor) return '';
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) return '';

        const diffSeg = Math.floor((Date.now() - fecha.getTime()) / 1000);
        if (diffSeg < 60) return 'Ahora';

        const diffMin = Math.floor(diffSeg / 60);
        if (diffMin < 60) return `Hace ${diffMin} min`;

        const diffHoras = Math.floor(diffMin / 60);
        if (diffHoras < 24) return `Hace ${diffHoras} h`;

        const diffDias = Math.floor(diffHoras / 24);
        if (diffDias < 7) return `Hace ${diffDias} d`;

        return fecha.toLocaleDateString('es-AR');
    }
}