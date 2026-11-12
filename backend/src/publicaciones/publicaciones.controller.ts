import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PublicacionesService } from './publicaciones.service';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';
import { AuthGuard } from '../autenticacion/guards/auth.guard';
import { MAX_IMAGEN_BYTES } from './imagenes.service';

@Controller('publicaciones')
export class PublicacionesController {
    constructor(private readonly publicacionesService: PublicacionesService) { }

    // 1. Crear publicación con Multer y Cloudinary (como en clase 11) - Status 201 Created
    @Post()
    @UseGuards(AuthGuard)
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
    async crear(
        @Body() crearPublicacionDto: CrearPublicacionDto,
        @Request() req: any,
        @UploadedFile() archivo?: Express.Multer.File,
    ) {
        const usuarioId = req.user.sub; // ID extraído del token JWT
        return this.publicacionesService.crear(crearPublicacionDto, usuarioId, archivo);
    }

    // 2. Listar publicaciones (Paginación, Ordenamiento por fecha/likes, Filtro por usuario)
    @Get()
    async listar(
        @Query('orden') orden?: 'fecha' | 'likes',
        @Query('usuarioId') usuarioId?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.publicacionesService.listar({ orden, usuarioId, limit, offset });
    }

    // 3. Dar "Me gusta" (Requiere Login)
    @Post(':id/like')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async darLike(@Param('id') id: string, @Request() req: any) {
        const usuarioId = req.user.sub;
        return this.publicacionesService.darLike(id, usuarioId);
    }

    // 4. Quitar "Me gusta" (Requiere Login)
    @Delete(':id/like')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async quitarLike(@Param('id') id: string, @Request() req: any) {
        const usuarioId = req.user.sub;
        return this.publicacionesService.quitarLike(id, usuarioId);
    }

    // 5. Baja lógica de publicación (Solo autor o admin)
    @Delete(':id')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async bajaLogica(@Param('id') id: string, @Request() req: any) {
        const usuarioId = req.user.sub;
        const rolUsuario = req.user.perfil;
        return this.publicacionesService.bajaLogica(id, usuarioId, rolUsuario);
    }
}
