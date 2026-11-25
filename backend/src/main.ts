import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

let cachedServer: any;

function configurarApp(app: any) {
  // Límite para cuerpos JSON / urlencoded (las imágenes viajan por multipart con Multer)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origenesExtra = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const origenesPermitidos = new Set([
    'http://localhost:4200',
    'https://utn-social-cwtq.vercel.app',
    ...origenesExtra,
  ]);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || origenesPermitidos.has(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'), false);
    },
    credentials: true,
  });
}

export async function createNestServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    configurarApp(app);
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

if (!process.env.VERCEL) {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    configurarApp(app);
    await app.listen(process.env.PORT ?? 3000);
  }
  void bootstrap();
}
