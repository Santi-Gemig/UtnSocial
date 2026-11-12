import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AutenticacionService } from './autenticacion.service';
import { CrearUsuarioDto } from '../usuarios/dto/crear-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { MAX_IMAGEN_BYTES } from '../publicaciones/imagenes.service';

@Controller('auth')
export class AutenticacionController {
    constructor(private readonly authService: AutenticacionService) { }

    @Post('registro')
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
    async registrar(
        @Body() crearUsuarioDto: CrearUsuarioDto,
        @UploadedFile() archivo?: Express.Multer.File,
    ) {
        return this.authService.registrar(crearUsuarioDto, archivo);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
