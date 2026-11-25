import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { CrearComentarioDto } from './dto/crear-comentario.dto';
import { AuthGuard } from '../autenticacion/guards/auth.guard';

@Controller('publicaciones/:publicacionId/comentarios')
export class ComentariosController {
    constructor(private readonly comentariosService: ComentariosService) { }


    @Get()
    @UseGuards(AuthGuard)
    async listar(
        @Param('publicacionId') publicacionId: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.comentariosService.listarPorPublicacion(publicacionId, {
            limit,
            offset,
        });
    }


    @Post()
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async crear(
        @Param('publicacionId') publicacionId: string,
        @Body() dto: CrearComentarioDto,
        @Req() req: any,
    ) {
        return this.comentariosService.crear(publicacionId, req.user.sub, dto);
    }


    @Put(':comentarioId')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async modificar(
        @Param('publicacionId') publicacionId: string,
        @Param('comentarioId') comentarioId: string,
        @Body() dto: CrearComentarioDto,
        @Req() req: any,
    ) {
        return this.comentariosService.modificar(publicacionId, comentarioId, req.user.sub, dto);
    }
}