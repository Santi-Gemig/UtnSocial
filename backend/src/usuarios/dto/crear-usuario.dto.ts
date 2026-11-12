import {
    IsDateString,
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CrearUsuarioDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser un texto' })
    @Matches(/\S/, { message: 'El nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
    nombre: string;

    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    @IsString({ message: 'El apellido debe ser un texto' })
    @Matches(/\S/, { message: 'El apellido no puede estar vacío' })
    @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
    apellido: string;

    @IsNotEmpty({ message: 'El correo es obligatorio' })
    @IsEmail({}, { message: 'El correo debe tener un formato válido' })
    correo: string;

    @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
    @IsString({ message: 'El nombre de usuario debe ser un texto' })
    @Matches(/^\S+$/, { message: 'El nombre de usuario no puede contener espacios' })
    @MaxLength(30, { message: 'El nombre de usuario no puede superar los 30 caracteres' })
    username: string;

    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
        message: 'La contraseña debe poseer al menos una mayúscula y un número',
    })
    password: string;

    @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
    @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida' })
    fecha_nacimiento: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser un texto' })
    @MaxLength(300, { message: 'La descripción no puede superar los 300 caracteres' })
    descripcion?: string;

    @IsOptional()
    @IsIn(['usuario', 'administrador'], {
        message: 'El perfil debe ser "usuario" o "administrador"',
    })
    perfil?: string;

    @IsOptional()
    @IsString()
    foto_perfil_url?: string;
}
