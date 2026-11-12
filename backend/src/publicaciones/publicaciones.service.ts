import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isObjectIdOrHexString } from 'mongoose';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';
import { ImagenesService } from './imagenes.service';

@Injectable()
export class PublicacionesService implements OnModuleInit {
    constructor(
        @InjectModel(Publicacion.name)
        private publicacionModel: Model<PublicacionDocument>,
        private readonly imagenes: ImagenesService,
    ) { }

    async onModuleInit() {
        try {
            // Sincroniza likes_count en documentos antiguos si hiciera falta
            await this.publicacionModel.updateMany(
                { likes_count: { $exists: false } },
                [{ $set: { likes_count: { $size: { $ifNull: ['$likes', []] } } } }]
            );
        } catch {
            // Si la base aún está vacía o iniciando, continúa normalmente
        }
    }

    // 1. Crea publicación vinculada al usuario logueado (sube imagen a Cloudinary si se envía archivo)
    async crear(
        crearPublicacionDto: CrearPublicacionDto,
        usuarioId: string,
        archivo?: Express.Multer.File,
    ): Promise<Publicacion> {
        let imagenUrl = '';
        let publicId: string | undefined;

        if (archivo) {
            const buffer = await this.imagenes.normalizar(archivo);
            const subida = await this.imagenes.subir(buffer, 'red-social/publicaciones');
            imagenUrl = subida.url;
            publicId = subida.publicId;
        }

        try {
            const nuevaPublicacion = new this.publicacionModel({
                ...crearPublicacionDto,
                imagen_url: imagenUrl,
                usuario_id: new Types.ObjectId(usuarioId),
                likes: [],
                likes_count: 0,
                activo: true,
            });

            const guardada = await nuevaPublicacion.save();
            return guardada.populate('usuario_id', 'nombre apellido username foto_perfil_url perfil');
        } catch (error) {
            if (publicId) {
                await this.imagenes.eliminar(publicId);
            }
            throw error;
        }
    }

    // 2. Lista publicaciones con ordenamiento, filtro por usuario y paginación
    async listar(params: {
        orden?: 'fecha' | 'likes';
        usuarioId?: string;
        limit?: number;
        offset?: number;
    }) {
        const { orden = 'fecha', usuarioId } = params;

        // Sanea limit/offset: valores no numéricos o negativos vuelven al valor por defecto
        const limitNum = Number(params.limit);
        const offsetNum = Number(params.offset);
        const limit = Number.isInteger(limitNum) && limitNum > 0 ? Math.min(limitNum, 50) : 10;
        const offset = Number.isInteger(offsetNum) && offsetNum >= 0 ? offsetNum : 0;

        const filtro: any = { activo: true };
        if (usuarioId) {
            this.validarId(usuarioId, 'ID de usuario inválido');
            filtro.usuario_id = new Types.ObjectId(usuarioId);
        }

        const query = this.publicacionModel
            .find(filtro)
            .populate('usuario_id', 'nombre apellido username foto_perfil_url perfil')
            .skip(offset)
            .limit(limit);

        if (orden === 'likes') {
            // Ordena de mayor a menor por el contador numérico de likes
            query.sort({ likes_count: -1, createdAt: -1 });
        } else {
            // Orden por defecto: fecha descendente (más nuevas primero)
            query.sort({ createdAt: -1 });
        }

        const [publicaciones, total] = await Promise.all([
            query.exec(),
            this.publicacionModel.countDocuments(filtro),
        ]);

        return {
            total,
            limit,
            offset,
            publicaciones,
        };
    }

    // 3. Dar "Me gusta" 
    async darLike(publicacionId: string, usuarioId: string) {
        this.validarId(publicacionId);
        const publicacion = await this.publicacionModel.findOne({
            _id: publicacionId,
            activo: true,
        });

        if (!publicacion) {
            throw new NotFoundException('Publicación no encontrada');
        }

        const uObjectId = new Types.ObjectId(usuarioId);
        const yaDioLike = publicacion.likes.some((id) => id.equals(uObjectId));

        if (yaDioLike) {
            throw new BadRequestException('Ya has dado me gusta a esta publicación');
        }

        publicacion.likes.push(uObjectId);
        publicacion.likes_count = publicacion.likes.length;
        await publicacion.save();

        return {
            mensaje: 'Me gusta agregado con éxito',
            totalLikes: publicacion.likes.length,
        };
    }

    // 4. Quitar "Me gusta"
    async quitarLike(publicacionId: string, usuarioId: string) {
        this.validarId(publicacionId);
        const publicacion = await this.publicacionModel.findOne({
            _id: publicacionId,
            activo: true,
        });

        if (!publicacion) {
            throw new NotFoundException('Publicación no encontrada');
        }

        const uObjectId = new Types.ObjectId(usuarioId);
        const index = publicacion.likes.findIndex((id) => id.equals(uObjectId));

        if (index === -1) {
            throw new BadRequestException('No habías dado me gusta a esta publicación previamente');
        }

        publicacion.likes.splice(index, 1);
        publicacion.likes_count = publicacion.likes.length;
        await publicacion.save();

        return {
            mensaje: 'Me gusta eliminado con éxito',
            totalLikes: publicacion.likes.length,
        };
    }

    // 5. Baja lógica: solo autor o administrador
    async bajaLogica(publicacionId: string, usuarioId: string, rolUsuario: string) {
        this.validarId(publicacionId);
        const publicacion = await this.publicacionModel.findById(publicacionId);

        if (!publicacion || !publicacion.activo) {
            throw new NotFoundException('Publicación no encontrada');
        }

        const esAutor = publicacion.usuario_id.toString() === usuarioId;
        const esAdmin = rolUsuario === 'administrador';

        if (!esAutor && !esAdmin) {
            throw new ForbiddenException(
                'No tienes permiso para eliminar esta publicación. Solo el autor o un administrador pueden hacerlo.',
            );
        }

        publicacion.activo = false;
        await publicacion.save();

        return { mensaje: 'Publicación eliminada correctamente (baja lógica)' };
    }

    // Valida que el id tenga formato de ObjectId de MongoDB (igual que en clase 11)
    private validarId(id: string, mensaje = 'ID de publicación inválido'): void {
        if (!isObjectIdOrHexString(id)) {
            throw new BadRequestException(mensaje);
        }
    }
}
