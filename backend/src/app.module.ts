import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { PublicacionesModule } from './publicaciones/publicaciones.module';

// Carga las variables del archivo .env (tal como en clase 11)
if (existsSync('.env')) loadEnvFile('.env');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/red-social';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    UsuariosModule,
    AutenticacionModule,
    PublicacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
