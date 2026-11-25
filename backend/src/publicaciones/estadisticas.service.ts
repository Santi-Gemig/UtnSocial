import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema';

@Injectable()
export class EstadisticasService {
    constructor(
        @InjectModel(Publicacion.name)
        private readonly publicacionModel: Model<PublicacionDocument>,
        @InjectModel(Comentario.name)
        private readonly comentarioModel: Model<ComentarioDocument>,
    ) { }

    // Helper: convierte y valida las fechas ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    private obtenerRangoFechas(desde?: string, hasta?: string) {
        const hoy = new Date();
        const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

        const fechaDesde = desde
            ? new Date(desde.length === 10 ? `${desde}T00:00:00.000-03:00` : desde)
            : hace30Dias;

        const fechaHasta = hasta
            ? new Date(hasta.length === 10 ? `${hasta}T23:59:59.999-03:00` : hasta)
            : hoy;

        if (Number.isNaN(fechaDesde.getTime())) {
            throw new BadRequestException('La fecha "desde" no es válida');
        }
        if (Number.isNaN(fechaHasta.getTime())) {
            throw new BadRequestException('La fecha "hasta" no es válida');
        }
        if (fechaDesde > fechaHasta) {
            throw new BadRequestException(
                'La fecha "desde" no puede ser mayor que la fecha "hasta"',
            );
        }

        return { fechaDesde, fechaHasta };
    }

    // 1. Publicaciones realizadas por cada usuario en un lapso de tiempo
    async publicacionesPorUsuario(desde?: string, hasta?: string) {
        const { fechaDesde, fechaHasta } = this.obtenerRangoFechas(desde, hasta);

        const datos = await this.publicacionModel.aggregate([
            {
                $match: {
                    activo: true,
                    createdAt: { $gte: fechaDesde, $lte: fechaHasta },
                },
            },
            {
                $group: {
                    _id: '$usuario_id',
                    cantidad: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'usuario',
                },
            },
            { $unwind: '$usuario' },
            {
                $project: {
                    _id: 0,
                    usuarioId: '$_id',
                    username: '$usuario.username',
                    nombre: { $concat: ['$usuario.nombre', ' ', '$usuario.apellido'] },
                    cantidad: 1,
                },
            },
            { $sort: { cantidad: -1 } },
        ]);

        return {
            desde: fechaDesde,
            hasta: fechaHasta,
            datos,
        };
    }

    // 2. Comentarios realizados por día en un lapso de tiempo
    async comentariosEnTiempo(desde?: string, hasta?: string) {
        const { fechaDesde, fechaHasta } = this.obtenerRangoFechas(desde, hasta);

        const datos = await this.comentarioModel.aggregate([
            {
                $match: {
                    activo: true,
                    createdAt: { $gte: fechaDesde, $lte: fechaHasta },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                            timezone: 'America/Argentina/Buenos_Aires',
                        },
                    },
                    cantidad: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    fecha: '$_id',
                    cantidad: 1,
                },
            },
            { $sort: { fecha: 1 } },
        ]);

        const total = datos.reduce((acc, item) => acc + item.cantidad, 0);

        return {
            desde: fechaDesde,
            hasta: fechaHasta,
            total,
            datos,
        };
    }

    // 3. Comentarios en cada publicación en un lapso de tiempo
    async comentariosPorPublicacion(desde?: string, hasta?: string) {
        const { fechaDesde, fechaHasta } = this.obtenerRangoFechas(desde, hasta);

        const datos = await this.comentarioModel.aggregate([
            {
                $match: {
                    activo: true,
                    createdAt: { $gte: fechaDesde, $lte: fechaHasta },
                },
            },
            {
                $group: {
                    _id: '$publicacion_id',
                    cantidad: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: this.publicacionModel.collection.name,
                    localField: '_id',
                    foreignField: '_id',
                    as: 'publicacion',
                },
            },
            { $unwind: '$publicacion' },
            { $match: { 'publicacion.activo': true } },
            {
                $project: {
                    _id: 0,
                    publicacionId: '$_id',
                    titulo: '$publicacion.titulo',
                    cantidad: 1,
                },
            },
            { $sort: { cantidad: -1 } },
            { $limit: 10 },
        ]);

        return {
            desde: fechaDesde,
            hasta: fechaHasta,
            datos,
        };
    }
}