import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '../autenticacion/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('mi-perfil')
  async obtenerMiPerfil(@Req() req: any) {
    return this.usuariosService.buscarPorId(req.user.sub);
  }
}
