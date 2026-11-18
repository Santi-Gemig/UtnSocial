import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicacionItem, PublicacionesService } from '../../services/publicaciones';
import { AuthService } from '../../services/auth';

@Component({
  imports: [CommonModule, DatePipe, RouterLink],
  selector: 'app-publicacion-card',
  styleUrl: './publicacion-card.css',
  templateUrl: './publicacion-card.html',
})
export class PublicacionCard implements OnInit, OnChanges {
  @Input({ required: true }) publicacion!: PublicacionItem;
  @Output() eliminada = new EventEmitter<string>();

  private publicacionesService = inject(PublicacionesService);
  authService = inject(AuthService);

  // Signals reactivos para actualizar Likes en vivo (Angular Zoneless) sin recargar ni reordenar
  cargandoLike = signal<boolean>(false);
  animandoLike = signal<boolean>(false);
  likesCount = signal<number>(0);
  yaDioLike = signal<boolean>(false);

  eliminando = signal<boolean>(false);

  // Estados de Modales (reemplaza confirm() y alert())
  mostrarModalEliminar = signal<boolean>(false);
  mostrarModalLogin = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  private timerAnimacion?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.sincronizarLikes();
  }

  ngOnChanges(): void {
    this.sincronizarLikes();
  }

  private sincronizarLikes(): void {
    const likes = this.publicacion?.likes || [];
    const miId = this.authService.currentUser()?._id;
    this.likesCount.set(likes.length);
    this.yaDioLike.set(
      !!miId && likes.some((id: any) => id === miId || id?._id === miId),
    );
  }

  // Comprueba si puede eliminar (si es el autor o admin)
  get puedeEliminar(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    const esAutor = this.publicacion.usuario_id?._id === user._id;
    const esAdmin = user.perfil === 'administrador';
    return esAutor || esAdmin;
  }

  // Toggle de Like en vivo con actualización optimista y animación burst
  toggleLike(): void {
    if (!this.authService.isLoggedIn() || this.authService.estaTokenVencido()) {
      this.authService.logout();
      return;
    }
    if (this.cargandoLike()) return;

    const miId = this.authService.currentUser()?._id;
    if (!miId) return;

    const estabaLikeado = this.yaDioLike();
    const likesPrevios = [...(this.publicacion.likes || [])];

    // Actualización inmediata en vivo sin esperar recarga y sin alterar el orden del feed
    this.cargandoLike.set(true);
    this.yaDioLike.set(!estabaLikeado);
    this.likesCount.update((c) => Math.max(0, c + (estabaLikeado ? -1 : 1)));

    if (!estabaLikeado) {
      if (this.timerAnimacion) clearTimeout(this.timerAnimacion);
      this.animandoLike.set(true);
      this.timerAnimacion = setTimeout(() => this.animandoLike.set(false), 520);
    }

    if (estabaLikeado) {
      this.publicacionesService.quitarLike(this.publicacion._id).subscribe({
        next: (res) => {
          this.publicacion.likes = likesPrevios.filter((id: any) => id !== miId && id?._id !== miId);
          if (typeof res?.totalLikes === 'number') {
            this.likesCount.set(res.totalLikes);
          }
          this.cargandoLike.set(false);
        },
        error: (err) => {
          this.publicacion.likes = likesPrevios;
          this.sincronizarLikes();
          this.cargandoLike.set(false);
          if (err.status === 401 || this.authService.estaTokenVencido()) {
            this.authService.logout();
            return;
          }
          this.errorMensaje.set(err.error?.message || 'Error al quitar me gusta');
        },
      });
    } else {
      this.publicacionesService.darLike(this.publicacion._id).subscribe({
        next: (res) => {
          if (!likesPrevios.some((id: any) => id === miId || id?._id === miId)) {
            this.publicacion.likes = [...likesPrevios, miId];
          }
          if (typeof res?.totalLikes === 'number') {
            this.likesCount.set(res.totalLikes);
          }
          this.cargandoLike.set(false);
        },
        error: (err) => {
          this.publicacion.likes = likesPrevios;
          this.sincronizarLikes();
          this.animandoLike.set(false);
          this.cargandoLike.set(false);
          if (err.status === 401 || this.authService.estaTokenVencido()) {
            this.authService.logout();
            return;
          }
          this.errorMensaje.set(err.error?.message || 'Error al dar me gusta');
        },
      });
    }
  }

  // Abrir modal de confirmación de eliminación
  solicitarEliminar(): void {
    this.mostrarModalEliminar.set(true);
  }

  cancelarEliminar(): void {
    this.mostrarModalEliminar.set(false);
  }

  // Confirmar eliminación en el modal
  confirmarEliminar(): void {
    this.eliminando.set(true);
    this.publicacionesService.eliminar(this.publicacion._id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.mostrarModalEliminar.set(false);
        this.eliminada.emit(this.publicacion._id);
      },
      error: (err) => {
        this.eliminando.set(false);
        this.mostrarModalEliminar.set(false);
        if (err.status === 401 || this.authService.estaTokenVencido()) {
          this.authService.logout();
          return;
        }
        this.errorMensaje.set(err.error?.message || 'Error al eliminar la publicación');
      },
    });
  }

  cerrarModalLogin(): void {
    this.mostrarModalLogin.set(false);
  }

  cerrarModalError(): void {
    this.errorMensaje.set(null);
  }
}
