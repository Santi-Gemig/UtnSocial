import {
    IsOptional,
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';

// DTO para actualizar solo los campos permitidos del perfil del usuario dueño de la cuenta
export class ActualizarUsuarioDto {
    @IsOptional()
    @IsString({ message: 'El nombre debe ser un texto' })
    @Matches(/\S/, { message: 'El nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
    nombre?: string;

    @IsOptional()
    @IsString({ message: 'El apellido debe ser un texto' })
    @Matches(/\S/, { message: 'El apellido no puede estar vacío' })
    @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
    apellido?: string;

    @IsOptional()
    @IsString({ message: 'El nombre de usuario debe ser un texto' })
    @Matches(/^\S+$/, { message: 'El nombre de usuario no puede contener espacios' })
    @MaxLength(30, { message: 'El nombre de usuario no puede superar los 30 caracteres' })
    username?: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser un texto' })
    @MaxLength(250, { message: 'La descripción no puede superar los 250 caracteres' })
    descripcion?: string;

    @IsOptional()
    @IsString()
    foto_perfil_url?: string;
}
