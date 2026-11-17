import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CrearComentarioDto {
    @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
    @IsString({ message: 'El comentario debe ser un texto' })
    @Matches(/\S/, { message: 'El comentario no puede contener solo espacios' })
    @MaxLength(300, { message: 'El comentario no puede superar los 300 caracteres' })
    mensaje: string;
}