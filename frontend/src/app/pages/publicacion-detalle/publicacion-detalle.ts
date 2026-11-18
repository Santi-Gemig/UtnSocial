import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    ComentarioItem,
    PublicacionItem,
    PublicacionesService,
} from '../../services/publicaciones';
import { AuthService } from '../../services/auth';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';

@Component({
    selector: 'app-publicacion-detalle',
    imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink, PublicacionCard],
    templateUrl: './publicacion-detalle.html',
    styleUrl: './publicacion-detalle.css',
})
export class PublicacionDetalle implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private publicacionesService = inject(PublicacionesService);
    authService = inject(AuthService);

    publicacion = signal<PublicacionItem | null>(null);
    cargandoPublicacion = signal<boolean>(true);
    errorPublicacion = signal<string | null>(null);

    // Estado de Comentarios y paginación acumulativa ("Cargar más")
    comentarios = signal<ComentarioItem[]>([]);
    totalComentarios = signal<number>(0);
    cargandoComentarios = signal<boolean>(false);
    enviandoComentario = signal<boolean>(false);
    errorComentario = signal<string | null>(null);
    readonly limitComentarios = 5;

    // Edición de comentario propio
    comentarioEditandoId = signal<string | null>(null);
    textoEditando = signal<string>('');
    guardandoEdicion = signal<boolean>(false);

    comentarioForm = new FormGroup({
        mensaje: new FormControl('', [
            Validators.required,
            Validators.maxLength(300),
            Validators.pattern(/\S/),
        ]),
    });

    get mensajeLength(): number {
        return (this.comentarioForm.controls.mensaje.value || '').length;
    }

    get hayMasComentarios(): boolean {
        return this.comentarios().length < this.totalComentarios();
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.router.navigate(['/publicaciones']);
            return;
        }
        this.cargarDetalle(id);
        this.cargarComentarios(id, false);
    }

    cargarDetalle(id: string): void {
        this.cargandoPublicacion.set(true);
        this.publicacionesService.obtenerPorId(id).subscribe({
            next: (pub) => {
                this.publicacion.set(pub);
                this.cargandoPublicacion.set(false);
            },
            error: () => {
                this.errorPublicacion.set('No se encontró la publicación solicitada.');
                this.cargandoPublicacion.set(false);
            },
        });
    }

    // Si acumular es true (botón "Cargar más"), agrega debajo sin borrar los anteriores
    cargarComentarios(publicacionId: string, acumular: boolean): void {
        this.cargandoComentarios.set(true);
        const offsetActual = acumular ? this.comentarios().length : 0;

        this.publicacionesService
            .listarComentarios(publicacionId, this.limitComentarios, offsetActual)
            .subscribe({
                next: (res) => {
                    if (acumular) {
                        this.comentarios.update((prev) => {
                            const ids = new Set(prev.map((c) => c._id));
                            return [...prev, ...res.comentarios.filter((c) => !ids.has(c._id))];
                        });
                    } else {
                        this.comentarios.set(res.comentarios);
                    }
                    this.totalComentarios.set(res.total);
                    this.cargandoComentarios.set(false);
                },
                error: () => {
                    this.cargandoComentarios.set(false);
                },
            });
    }

    cargarMasComentarios(): void {
        const pub = this.publicacion();
        if (!pub || this.cargandoComentarios()) return;
        this.cargarComentarios(pub._id, true);
    }

    enviarComentario(): void {
        if (this.authService.estaTokenVencido()) {
            this.authService.logout();
            return;
        }
        const pub = this.publicacion();
        if (!pub || this.comentarioForm.invalid || this.enviandoComentario()) return;

        this.enviandoComentario.set(true);
        this.errorComentario.set(null);
        const mensaje = (this.comentarioForm.controls.mensaje.value || '').trim();

        this.publicacionesService.crearComentario(pub._id, mensaje).subscribe({
            next: (nuevo) => {
                this.enviandoComentario.set(false);
                this.comentarioForm.reset();
                // Agrega el nuevo comentario arriba de todo (más reciente primero)
                this.comentarios.update((prev) => [nuevo, ...prev]);
                this.totalComentarios.update((t) => t + 1);
            },
            error: (err) => {
                this.enviandoComentario.set(false);
                if (err.status === 401) return;
                const msg = err.error?.message || 'Error al publicar el comentario';
                this.errorComentario.set(Array.isArray(msg) ? msg.join(', ') : msg);
            },
        });
    }

    esMiComentario(comentario: ComentarioItem): boolean {
        const miId = this.authService.currentUser()?._id;
        return !!miId && comentario.usuario_id?._id === miId;
    }

    iniciarEdicion(comentario: ComentarioItem): void {
        this.comentarioEditandoId.set(comentario._id);
        this.textoEditando.set(comentario.mensaje);
    }

    cancelarEdicion(): void {
        if (this.guardandoEdicion()) return;
        this.comentarioEditandoId.set(null);
        this.textoEditando.set('');
    }

    guardarEdicion(comentario: ComentarioItem): void {
        if (this.authService.estaTokenVencido()) {
            this.authService.logout();
            return;
        }
        const pub = this.publicacion();
        const nuevoTexto = this.textoEditando().trim();
        if (!pub || !nuevoTexto || nuevoTexto.length > 300 || this.guardandoEdicion()) return;

        this.guardandoEdicion.set(true);
        this.publicacionesService
            .editarComentario(pub._id, comentario._id, nuevoTexto)
            .subscribe({
                next: (actualizado) => {
                    this.guardandoEdicion.set(false);
                    this.comentarioEditandoId.set(null);
                    this.comentarios.update((lista) =>
                        lista.map((c) => (c._id === actualizado._id ? actualizado : c)),
                    );
                },
                error: (err) => {
                    this.guardandoEdicion.set(false);
                    if (err.status === 401) return;
                    const msg = err.error?.message || 'Error al editar el comentario';
                    this.errorComentario.set(Array.isArray(msg) ? msg.join(', ') : msg);
                },
            });
    }

    onPublicacionEliminada(): void {
        this.router.navigate(['/publicaciones']);
    }
}