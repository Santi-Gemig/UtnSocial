import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isObjectIdOrHexString } from 'mongoose';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema';
import { CrearComentarioDto } from './dto/crear-comentario.dto';

@Injectable()
export class ComentariosService {
    constructor(
        @InjectModel(Comentario.name)
        private readonly comentarioModel: Model<ComentarioDocument>,
        @InjectModel(Publicacion.name)
        private readonly publicacionModel: Model<PublicacionDocument>,
    ) { }

    // Lista comentarios de una publicación (más recientes primero + paginación)
    async listarPorPublicacion(
        publicacionId: string,
        params: { limit?: number; offset?: number },
    ) {
        this.validarId(publicacionId, 'ID de publicación inválido');

        const limitNum = Number(params.limit);
        const offsetNum = Number(params.offset);
        const limit = Number.isInteger(limitNum) && limitNum > 0 ? Math.min(limitNum, 50) : 5;
        const offset = Number.isInteger(offsetNum) && offsetNum >= 0 ? offsetNum : 0;

        const filtro = {
            publicacion_id: new Types.ObjectId(publicacionId),
            activo: true,
        };

        const [comentarios, total] = await Promise.all([
            this.comentarioModel
                .find(filtro)
                .populate('usuario_id', 'nombre apellido username foto_perfil_url perfil')
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .exec(),
            this.comentarioModel.countDocuments(filtro),
        ]);

        return {
            total,
            limit,
            offset,
            comentarios,
        };
    }

    // Crea un nuevo comentario en una publicación
    async crear(
        publicacionId: string,
        usuarioId: string,
        dto: CrearComentarioDto,
    ) {
        this.validarId(publicacionId, 'ID de publicación inválido');

        const publicacion = await this.publicacionModel.findOne({
            _id: publicacionId,
            activo: true,
        });
        if (!publicacion) {
            throw new NotFoundException('Publicación no encontrada');
        }

        const nuevo = new this.comentarioModel({
            publicacion_id: new Types.ObjectId(publicacionId),
            usuario_id: new Types.ObjectId(usuarioId),
            mensaje: dto.mensaje.trim(),
            modificado: false,
            activo: true,
        });

        const guardado = await nuevo.save();
        return guardado.populate('usuario_id', 'nombre apellido username foto_perfil_url perfil');
    }

    // Modifica un comentario propio y marcar modificado: true (PUT)
    async modificar(
        comentarioId: string,
        usuarioId: string,
        dto: CrearComentarioDto,
    ) {
        this.validarId(comentarioId, 'ID de comentario inválido');

        const comentario = await this.comentarioModel.findOne({
            _id: comentarioId,
            activo: true,
        });

        if (!comentario) {
            throw new NotFoundException('Comentario no encontrado');
        }

        if (comentario.usuario_id.toString() !== usuarioId) {
            throw new ForbiddenException('Solo el autor puede editar este comentario');
        }

        comentario.mensaje = dto.mensaje.trim();
        comentario.modificado = true;
        const actualizado = await comentario.save();

        return actualizado.populate('usuario_id', 'nombre apellido username foto_perfil_url perfil');
    }

    private validarId(id: string, mensaje: string): void {
        if (!isObjectIdOrHexString(id)) {
            throw new BadRequestException(mensaje);
        }
    }
}