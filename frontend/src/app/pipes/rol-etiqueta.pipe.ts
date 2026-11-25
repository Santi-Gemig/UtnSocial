import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'rolEtiqueta',
})
export class RolEtiquetaPipe implements PipeTransform {
    transform(perfil?: string | null): string {
        if (perfil === 'administrador') return 'Administrador';
        if (perfil === 'usuario') return 'Usuario';
        return 'Sin rol';
    }
}