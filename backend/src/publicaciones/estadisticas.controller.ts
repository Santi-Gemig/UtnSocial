import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../autenticacion/guards/auth.guard';
import { AdminGuard } from '../autenticacion/guards/admin.guard';
import { EstadisticasService } from './estadisticas.service';

@UseGuards(AuthGuard, AdminGuard)
@Controller('estadisticas')
export class EstadisticasController {
    constructor(private readonly estadisticasService: EstadisticasService) { }

    @Get('publicaciones-por-usuario')
    async publicacionesPorUsuario(
        @Query('desde') desde?: string,
        @Query('hasta') hasta?: string,
    ) {
        return this.estadisticasService.publicacionesPorUsuario(desde, hasta);
    }

    @Get('comentarios-en-tiempo')
    async comentariosEnTiempo(
        @Query('desde') desde?: string,
        @Query('hasta') hasta?: string,
    ) {
        return this.estadisticasService.comentariosEnTiempo(desde, hasta);
    }

    @Get('comentarios-por-publicacion')
    async comentariosPorPublicacion(
        @Query('desde') desde?: string,
        @Query('hasta') hasta?: string,
    ) {
        return this.estadisticasService.comentariosPorPublicacion(desde, hasta);
    }
}