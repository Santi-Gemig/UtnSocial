import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { PublicacionItem, PublicacionesService } from '../../services/publicaciones';
import { RolEtiquetaPipe } from '../../pipes/rol-etiqueta.pipe';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PublicacionCard, RolEtiquetaPipe],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);
  private router = inject(Router);

  usuario = signal<Usuario | null>(null);
  ultimasPublicaciones = signal<PublicacionItem[]>([]);
  cargando = signal<boolean>(true);
  errorPublicaciones = signal<string | null>(null);

  // Estado y formulario para el modal de Edición de Perfil
  mostrarModalEditar = signal<boolean>(false);
  guardandoPerfil = signal<boolean>(false);
  errorEditar = signal<string | null>(null);
  fotoPreview = signal<string>('');
  archivoFoto = signal<File | null>(null);
  quitarFotoSolicitada = signal<boolean>(false);

  editarForm = new FormGroup({
    nombre: new FormControl('', [
      Validators.required,
      Validators.maxLength(50),
      Validators.pattern(/\S/),
    ]),
    apellido: new FormControl('', [
      Validators.required,
      Validators.maxLength(50),
      Validators.pattern(/\S/),
    ]),
    username: new FormControl('', [
      Validators.required,
      Validators.maxLength(30),
      Validators.pattern(/^\S+$/),
    ]),
    descripcion: new FormControl('', [Validators.maxLength(250)]),
  });

  get ef() {
    return this.editarForm.controls;
  }

  get descripcionEditLength(): number {
    return (this.editarForm.controls.descripcion.value || '').length;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.usuario.set(user);
    this.cargarUltimasPublicaciones();
  }

  cargarUltimasPublicaciones(): void {
    const user = this.usuario();
    if (!user || !user._id) return;

    this.cargando.set(true);
    this.errorPublicaciones.set(null);
    this.publicacionesService
      .listar({
        usuarioId: user._id,
        limit: 3,
        orden: 'fecha',
      })
      .subscribe({
        next: (res) => {
          this.ultimasPublicaciones.set(res.publicaciones);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          if (err.status === 401) return;
          const msg = err.error?.message || 'Error al cargar tus últimas publicaciones';
          this.errorPublicaciones.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
  }

  abrirModalEditar(): void {
    const u = this.usuario();
    if (!u) return;

    this.editarForm.setValue({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      username: u.username || '',
      descripcion: u.descripcion || '',
    });
    this.fotoPreview.set(u.foto_perfil_url || '');
    this.archivoFoto.set(null);
    this.quitarFotoSolicitada.set(false);
    this.errorEditar.set(null);
    this.mostrarModalEditar.set(true);
  }

  cerrarModalEditar(): void {
    if (this.guardandoPerfil()) return;
    this.mostrarModalEditar.set(false);
  }

  onFotoPerfilSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.archivoFoto.set(file);
    this.quitarFotoSolicitada.set(false);
    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  quitarFotoModal(): void {
    this.fotoPreview.set('');
    this.archivoFoto.set(null);
    this.quitarFotoSolicitada.set(true);
  }

  guardarPerfil(): void {
    this.errorEditar.set(null);

    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      return;
    }

    this.guardandoPerfil.set(true);
    const valores = this.editarForm.value;
    const datos = new FormData();
    datos.append('nombre', (valores.nombre || '').trim());
    datos.append('apellido', (valores.apellido || '').trim());
    datos.append('username', (valores.username || '').trim());
    datos.append('descripcion', (valores.descripcion || '').trim());

    if (this.archivoFoto()) {
      datos.append('imagen', this.archivoFoto()!);
    } else if (this.quitarFotoSolicitada()) {
      datos.append('foto_perfil_url', '');
    }

    this.authService.actualizarPerfil(datos).subscribe({
      next: (res) => {
        this.guardandoPerfil.set(false);
        this.usuario.set(res.usuario);
        this.mostrarModalEditar.set(false);
        this.cargarUltimasPublicaciones();
      },
      error: (err) => {
        this.guardandoPerfil.set(false);
        const msg = err.error?.message || 'Error al actualizar el perfil';
        this.errorEditar.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  onPublicacionEliminada(_id: string): void {
    this.cargarUltimasPublicaciones();
  }

  getIniciales(): string {
    const u = this.usuario();
    if (!u) return '?';
    const n = u.nombre?.[0] || '';
    const a = u.apellido?.[0] || '';
    return (n + a).toUpperCase() || u.username?.[0]?.toUpperCase() || 'U';
  }
}
