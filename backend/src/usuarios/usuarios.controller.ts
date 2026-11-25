import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '../autenticacion/guards/auth.guard';
import { AdminGuard } from '../autenticacion/guards/admin.guard';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { MAX_IMAGEN_BYTES } from '../publicaciones/imagenes.service';

@UseGuards(AuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) { }

  @Get('mi-perfil')
  async obtenerMiPerfil(@Req() req: any) {
    return this.usuariosService.buscarPorId(req.user.sub);
  }

  // Solo el dueño autenticado (req.user.sub del JWT) puede editar su propio perfil
  @Patch('mi-perfil')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGEN_BYTES,
        files: 1,
      },
    }),
  )
  async actualizarMiPerfil(
    @Req() req: any,
    @Body() actualizarUsuarioDto: ActualizarUsuarioDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.usuariosService.actualizarPerfil(
      req.user.sub,
      actualizarUsuarioDto,
      archivo,
    );
  }
  // Listar todos los usuarios (Solo Admin)
  @Get()
  @UseGuards(AdminGuard)
  async listarTodos() {
    return this.usuariosService.listarTodos();
  }
  // Alta de usuario desde panel Admin con rol seleccionable y foto opcional (Solo Admin)
  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGEN_BYTES,
        files: 1,
      },
    }),
  )
  async crearDesdeAdmin(
    @Body() crearUsuarioDto: CrearUsuarioDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.usuariosService.crearDesdeAdmin(crearUsuarioDto, archivo);
  }
  // Baja lógica de usuario / deshabilitar (Solo Admin)
  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deshabilitar(@Param('id') id: string, @Req() req: any) {
    return this.usuariosService.deshabilitar(id, req.user.sub);
  }
  // Alta lógica de usuario / rehabilitar (Solo Admin)
  @Post(':id/rehabilitar')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async rehabilitar(@Param('id') id: string) {
    return this.usuariosService.rehabilitar(id);
  }
}
