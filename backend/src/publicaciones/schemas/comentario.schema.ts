import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from '../../usuarios/schemas/usuario.schema';
import { Publicacion } from './publicacion.schema';

export type ComentarioDocument = HydratedDocument<Comentario>;

@Schema({ timestamps: true })
export class Comentario {
    @Prop({ type: Types.ObjectId, ref: Publicacion.name, required: true })
    publicacion_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
    usuario_id: Types.ObjectId;

    @Prop({ required: true, trim: true })
    mensaje: string;

    @Prop({ default: false })
    modificado: boolean;

    @Prop({ default: true })
    activo: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);