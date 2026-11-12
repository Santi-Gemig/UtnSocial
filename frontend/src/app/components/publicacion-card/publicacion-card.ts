import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
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
export class PublicacionCard {
  @Input({ required: true }) publicacion!: PublicacionItem;
  @Output() eliminada = new EventEmitter<string>();

  private publicacionesService = inject(PublicacionesService);
  authService = inject(AuthService);

  cargandoLike = false;
  eliminando = signal<boolean>(false);

  // Estados de Modales (reemplaza confirm() y alert())
  mostrarModalEliminar = signal<boolean>(false);
  mostrarModalLogin = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  // Comprueba si el usuario actual ya le dio like
  get yaDioLike(): boolean {
    const miId = this.authService.currentUser()?._id;
    if (!miId || !this.publicacion.likes) return false;
    return this.publicacion.likes.some((id: any) => id === miId || id?._id === miId);
  }

  // Comprueba si puede eliminar (si es el autor o admin)
  get puedeEliminar(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    const esAutor = this.publicacion.usuario_id?._id === user._id;
    const esAdmin = user.perfil === 'administrador';
    return esAutor || esAdmin;
  }

  // Toggle de Like (Dar o Quitar)
  toggleLike(): void {
    if (!this.authService.isLoggedIn()) {
      this.mostrarModalLogin.set(true);
      return;
    }
    if (this.cargandoLike) return;
    this.cargandoLike = true;

    const miId = this.authService.currentUser()?._id!;

    if (this.yaDioLike) {
      this.publicacionesService.quitarLike(this.publicacion._id).subscribe({
        next: () => {
          this.publicacion.likes = this.publicacion.likes.filter((id: any) => id !== miId && id?._id !== miId);
          this.cargandoLike = false;
        },
        error: (err) => {
          this.cargandoLike = false;
          this.errorMensaje.set(err.error?.message || 'Error al quitar me gusta');
        },
      });
    } else {
      this.publicacionesService.darLike(this.publicacion._id).subscribe({
        next: () => {
          this.publicacion.likes.push(miId);
          this.cargandoLike = false;
        },
        error: (err) => {
          this.cargandoLike = false;
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
