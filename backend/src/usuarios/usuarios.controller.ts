import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '../autenticacion/guards/auth.guard';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { MAX_IMAGEN_BYTES } from '../publicaciones/imagenes.service';

@UseGuards(AuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

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
}
