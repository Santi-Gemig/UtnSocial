import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { AutenticacionService } from './autenticacion.service';
import { AutenticacionController } from './autenticacion.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ImagenesService } from '../publicaciones/imagenes.service';

if (existsSync('.env')) loadEnvFile('.env');

@Module({
  imports: [
    UsuariosModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secreto_super_seguro_utn_red_social',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, ImagenesService],
  exports: [AutenticacionService],
})
export class AutenticacionModule { }
