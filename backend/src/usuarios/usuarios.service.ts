import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
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
        const usuario = await this.usuarioModel.findById(id).select('-password').exec();
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return usuario;
    }
}