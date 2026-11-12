import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { PublicacionItem, PublicacionesService } from '../../services/publicaciones';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule, RouterLink, PublicacionCard],
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
          console.error('Error al cargar publicaciones del perfil', err);
          this.cargando.set(false);
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
