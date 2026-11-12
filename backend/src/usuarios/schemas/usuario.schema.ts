import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema({ timestamps: true })
export class Usuario {
    @Prop({ required: true, trim: true })
    nombre: string;

    @Prop({ required: true, trim: true })
    apellido: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    correo: string;

    @Prop({ required: true, unique: true, trim: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    fecha_nacimiento: string;

    @Prop({ default: '' })
    descripcion: string;

    @Prop({ default: '' })
    foto_perfil_url: string;

    @Prop({ default: 'usuario', enum: ['usuario', 'administrador'] })
    perfil: string;

    @Prop({ default: true })
    activo: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);