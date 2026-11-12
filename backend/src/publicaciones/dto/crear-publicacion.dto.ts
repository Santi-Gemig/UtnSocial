import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CrearPublicacionDto {
    @IsNotEmpty({ message: 'El título de la publicación es obligatorio' })
    @IsString({ message: 'El título debe ser un texto' })
    @Matches(/\S/, { message: 'El título no puede estar vacío' })
    @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
    titulo: string;

    @IsNotEmpty({ message: 'La descripción o mensaje es obligatorio' })
    @IsString({ message: 'La descripción debe ser un texto' })
    @Matches(/\S/, { message: 'La descripción no puede estar vacía' })
    @MaxLength(1000, { message: 'La descripción no puede superar los 1000 caracteres' })
    descripcion: string;

    @IsOptional()
    @IsString()
    imagen_url?: string;
}
