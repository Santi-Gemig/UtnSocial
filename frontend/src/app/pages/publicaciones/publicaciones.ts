import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicacionItem, PublicacionesService } from '../../services/publicaciones';
import { AuthService } from '../../services/auth';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';

@Component({
  imports: [CommonModule, ReactiveFormsModule, PublicacionCard, RouterLink],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  authService = inject(AuthService);

  publicaciones = signal<PublicacionItem[]>([]);
  cargando = signal<boolean>(false);
  publicando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  // Ordenamiento y paginación
  ordenActual = signal<'fecha' | 'likes'>('fecha');
  totalPublicaciones = signal<number>(0);
  offset = signal<number>(0);
  readonly limit = 5; // Cantidad por página
  readonly Math = Math;

  // Previsualización y archivo real para subir con FormData (Multer + Cloudinary)
  imagenPostBase64 = signal<string>('');
  archivoImagen = signal<File | null>(null);

  postForm = new FormGroup({
    titulo: new FormControl('', [Validators.required]),
    descripcion: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.cargando.set(true);
    this.publicacionesService
      .listar({
        orden: this.ordenActual(),
        limit: this.limit,
        offset: this.offset(),
      })
      .subscribe({
        next: (res) => {
          this.publicaciones.set(res.publicaciones);
          this.totalPublicaciones.set(res.total);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error al listar publicaciones', err);
          this.mensajeError.set('Error al cargar las publicaciones');
          this.cargando.set(false);
        },
      });
  }

  cambiarOrden(nuevoOrden: 'fecha' | 'likes'): void {
    if (this.ordenActual() === nuevoOrden) return;
    this.ordenActual.set(nuevoOrden);
    this.offset.set(0); // Reinicia a la primera página
    this.cargarPublicaciones();
  }

  paginaSiguiente(): void {
    if (this.offset() + this.limit < this.totalPublicaciones()) {
      this.offset.update((prev) => prev + this.limit);
      this.cargarPublicaciones();
    }
  }

  paginaAnterior(): void {
    if (this.offset() > 0) {
      this.offset.update((prev) => Math.max(0, prev - this.limit));
      this.cargarPublicaciones();
    }
  }

  // Selecciona el archivo File para FormData y genera vista previa local
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.archivoImagen.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPostBase64.set(reader.result as string);
      };
      reader.readAsDataURL(file);
      input.value = '';
    }
  }

  quitarImagen(): void {
    this.imagenPostBase64.set('');
    this.archivoImagen.set(null);
  }

  crearPublicacion(): void {
    if (this.postForm.invalid) return;

    this.publicando.set(true);
    this.mensajeError.set(null);

    const { titulo, descripcion } = this.postForm.value;

    this.publicacionesService
      .crear({
        titulo: titulo!,
        descripcion: descripcion!,
        imagen: this.archivoImagen(),
      })
      .subscribe({
        next: () => {
          this.publicando.set(false);
          this.postForm.reset();
          this.imagenPostBase64.set('');
          this.archivoImagen.set(null);
          this.offset.set(0); // Vuelve a la primera página
          this.cargarPublicaciones();
        },
        error: (err) => {
          this.publicando.set(false);
          const msg = err.error?.message || 'Error al crear la publicación';
          this.mensajeError.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
  }

  onPublicacionEliminada(id: string): void {
    const restantesEnPagina = this.publicaciones().filter((p) => p._id !== id).length;
    if (restantesEnPagina === 0 && this.offset() > 0) {
      this.offset.update((prev) => Math.max(0, prev - this.limit));
    }
    this.cargarPublicaciones();
  }
}
