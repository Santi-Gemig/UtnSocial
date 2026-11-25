import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'resumir',
})
export class ResumirPipe implements PipeTransform {
    transform(texto?: string | null, maxCaracteres = 45): string {
        if (!texto) return '';
        const limpio = texto.trim();
        if (limpio.length <= maxCaracteres) return limpio;
        return `${limpio.slice(0, maxCaracteres).trimEnd()}...`;
    }
}