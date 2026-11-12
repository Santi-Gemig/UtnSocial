import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { CrearUsuarioDto } from '../usuarios/dto/crear-usuario.dto';
import { ImagenesService } from '../publicaciones/imagenes.service';

@Injectable()
export class AutenticacionService {
    constructor(
        private readonly usuariosService: UsuariosService,
        private readonly jwtService: JwtService,
        private readonly imagenes: ImagenesService,
    ) { }

    async registrar(
        crearUsuarioDto: CrearUsuarioDto,
        archivo?: Express.Multer.File,
    ) {
        let publicId: string | undefined;

        if (archivo) {
            const buffer = await this.imagenes.normalizar(archivo);
            const subida = await this.imagenes.subir(buffer, 'red-social/perfiles');
            crearUsuarioDto.foto_perfil_url = subida.url;
            publicId = subida.publicId;
        }

        try {
            const usuario = await this.usuariosService.crear(crearUsuarioDto);
            const usuarioObj = (usuario as any).toObject ? (usuario as any).toObject() : { ...usuario };
            delete usuarioObj.password;

            const payload = {
                sub: usuarioObj._id,
                correo: usuarioObj.correo,
                username: usuarioObj.username,
                perfil: usuarioObj.perfil,
            };
            const token = await this.jwtService.signAsync(payload);

            return {
                mensaje: 'Usuario registrado con éxito',
                usuario: usuarioObj,
                token,
            };
        } catch (error) {
            if (publicId) {
                await this.imagenes.eliminar(publicId);
            }
            throw error;
        }
    }

    async login(loginDto: LoginDto) {
        const { identificador, password } = loginDto;

        const usuario = await this.usuariosService.buscarPorLogin(identificador);
        if (!usuario) {
            throw new UnauthorizedException('Credenciales inválidas (usuario o contraseña incorrectos)');
        }

        if (usuario.activo === false) {
            throw new UnauthorizedException('Este usuario se encuentra deshabilitado');
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            throw new UnauthorizedException('Credenciales inválidas (usuario o contraseña incorrectos)');
        }

        const payload = {
            sub: usuario._id,
            correo: usuario.correo,
            username: usuario.username,
            perfil: usuario.perfil,
        };

        const token = await this.jwtService.signAsync(payload);

        const usuarioData = usuario.toObject() as any;
        delete usuarioData.password;

        return {
            mensaje: 'Inicio de sesión exitoso',
            usuario: usuarioData,
            token,
        };
    }
}
