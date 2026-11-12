import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from '../../usuarios/schemas/usuario.schema';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true })
export class Publicacion {
    @Prop({ required: true, trim: true })
    titulo: string;

    @Prop({ required: true, trim: true })
    descripcion: string;

    @Prop({ default: '' })
    imagen_url: string;

    @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
    usuario_id: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: Usuario.name }], default: [] })
    likes: Types.ObjectId[];

    @Prop({ default: 0 })
    likes_count: number;

    @Prop({ default: true })
    activo: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
