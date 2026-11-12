import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const MAX_IMAGEN_BYTES = 10 * 1024 * 1024; // Hasta 10 MB para fotos de celular/cámara

@Injectable()
export class ImagenesService {
  private readonly logger = new Logger(ImagenesService.name);

  async normalizar(archivo?: Express.Multer.File): Promise<Buffer> {
    if (!archivo?.buffer?.length || archivo.buffer.length > MAX_IMAGEN_BYTES) {
      throw new BadRequestException('Se requiere una imagen de hasta 10 MB');
    }
    const b = archivo.buffer;

    // Verificación de firma binaria (igual que en clase 11)
    const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const png = b
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP';

    if (!jpeg && !png && !webp) {
      throw new BadRequestException(
        'Solo se admiten imágenes JPEG, PNG o WebP',
      );
    }

    try {
      const imagen = sharp(b, {
        limitInputPixels: 50_000_000,
      });
      const metadata = await imagen.metadata();
      if ((metadata.pages ?? 1) > 1) throw new Error('Imagen animada');

      return await imagen
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .timeout({ seconds: 15 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Imagen inválida, animada o demasiado grande',
      );
    }
  }

  private opciones() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new ServiceUnavailableException(
        'Falta configurar Cloudinary en el servidor (.env)',
      );
    }
    return {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    };
  }

  async subir(
    buffer: Buffer,
    carpeta = 'red-social/publicaciones',
  ): Promise<{ url: string; publicId: string }> {
    const opciones = this.opciones();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...opciones,
          resource_type: 'image',
          allowed_formats: ['webp'],
          public_id: `${carpeta}/${randomUUID()}`,
          overwrite: false,
          timeout: 30000,
        },
        (error, resultado) => {
          if (error || !resultado) {
            return reject(
              new BadGatewayException('No se pudo subir la imagen a Cloudinary'),
            );
          }
          resolve({ url: resultado.secure_url, publicId: resultado.public_id });
        },
      );
      stream.on('error', () =>
        reject(new BadGatewayException('No se pudo subir la imagen a Cloudinary')),
      );
      stream.end(buffer);
    });
  }

  async eliminar(publicId?: string): Promise<void> {
    if (!publicId) return;
    try {
      const resultado = (await cloudinary.uploader.destroy(publicId, {
        ...this.opciones(),
        resource_type: 'image',
        invalidate: true,
      })) as { result: string };
      if (!['ok', 'not found'].includes(resultado.result)) {
        throw new Error('No eliminado');
      }
    } catch {
      this.logger.warn(`Pendiente de limpieza en Cloudinary: ${publicId}`);
    }
  }
}
