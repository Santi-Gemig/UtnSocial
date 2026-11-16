import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isObjectIdOrHexString } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { ImagenesService } from '../publicaciones/imagenes.service';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
        private readonly imagenes: ImagenesService,
    ) { }

    // 1. Crear nuevo usuario (Registro)
    async crear(crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
        const { correo, username, password } = crearUsuarioDto;

        // Verificar si ya existe el correo
        const existeCorreo = await this.usuarioModel.findOne({ correo: correo.toLowerCase() });
        if (existeCorreo) {
            throw new BadRequestException('El correo electrónico ya está registrado');
        }

        // Verificar si ya existe el nombre de usuario
        const existeUsername = await this.usuarioModel.findOne({ username });
        if (existeUsername) {
            throw new BadRequestException('El nombre de usuario ya está en uso');
        }

        // Encriptar la contraseña con bcrypt (10 rondas de salt)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear el documento en MongoDB
        const nuevoUsuario = new this.usuarioModel({
            ...crearUsuarioDto,
            correo: correo.toLowerCase(),
            password: passwordHash,
            perfil: crearUsuarioDto.perfil || 'usuario', // Por defecto es usuario
        });

        return nuevoUsuario.save();
    }

    // 2. Buscar por correo o username (usado en el Login)
    async buscarPorLogin(identificador: string): Promise<UsuarioDocument | null> {
        return this.usuarioModel
            .findOne({
                $or: [
                    { correo: identificador.toLowerCase() },
                    { username: identificador },
                ],
            })
            .exec();
    }

    // 3. Buscar por ID (usado en "Mi Perfil")
    async buscarPorId(id: string): Promise<UsuarioDocument> {
        if (!isObjectIdOrHexString(id)) {
            throw new BadRequestException('ID de usuario inválido');
        }
        const usuario = await this.usuarioModel.findById(id).select('-password').exec();
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return usuario;
    }

    // 4. Actualizar perfil propio (solo dueño autenticado por JWT)
    async actualizarPerfil(
        id: string,
        dto: ActualizarUsuarioDto,
        archivo?: Express.Multer.File,
    ) {
        if (!isObjectIdOrHexString(id)) {
            throw new BadRequestException('ID de usuario inválido');
        }

        // Si quiere cambiar el @username, verificamos que ningún otro usuario lo tenga tomado
        if (dto.username !== undefined) {
            const usernameLimpio = dto.username.trim();
            const existeOtro = await this.usuarioModel
                .findOne({ username: usernameLimpio, _id: { $ne: id } })
                .exec();
            if (existeOtro) {
                throw new BadRequestException('El nombre de usuario ya está en uso');
            }
            dto.username = usernameLimpio;
        }

        let publicId: string | undefined;
        if (archivo) {
            const buffer = await this.imagenes.normalizar(archivo);
            const subida = await this.imagenes.subir(buffer, 'red-social/perfiles');
            dto.foto_perfil_url = subida.url;
            publicId = subida.publicId;
        }

        const cambios: Partial<Usuario> = {};
        if (dto.nombre !== undefined) cambios.nombre = dto.nombre.trim();
        if (dto.apellido !== undefined) cambios.apellido = dto.apellido.trim();
        if (dto.username !== undefined) cambios.username = dto.username;
        if (dto.descripcion !== undefined) cambios.descripcion = dto.descripcion.trim();
        if (dto.foto_perfil_url !== undefined) cambios.foto_perfil_url = dto.foto_perfil_url;

        try {
            const usuario = await this.usuarioModel
                .findByIdAndUpdate(
                    id,
                    { $set: cambios },
                    { new: true, runValidators: true },
                )
                .select('-password')
                .exec();

            if (!usuario) {
                throw new NotFoundException('Usuario no encontrado');
            }

            return {
                mensaje: 'Perfil actualizado con éxito',
                usuario,
            };
        } catch (error) {
            if (publicId) {
                await this.imagenes.eliminar(publicId);
            }
            throw error;
        }
    }
}