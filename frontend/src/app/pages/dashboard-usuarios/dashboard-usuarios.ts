import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth';
import {
  fechaNoFutura,
  obtenerFechaHoyInput,
  passwordsCoinciden,
} from '../../validators/usuario.validators';

@Component({
  selector: 'app-dashboard-usuarios',
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.css',
})
export class DashboardUsuarios implements OnInit {
  authService = inject(AuthService);

  readonly hoyFecha = obtenerFechaHoyInput();

  usuarios = signal<Usuario[]>([]);
  cargando = signal<boolean>(true);
  creando = signal<boolean>(false);
  procesandoId = signal<string | null>(null);
  usuarioADeshabilitar = signal<Usuario | null>(null);

  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  errorAccion = signal<string | null>(null);

  fotoBase64 = signal<string>('');
  archivoFoto = signal<File | null>(null);

  usuarioForm = new FormGroup(
    {
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
      correo: new FormControl('', [Validators.required, Validators.email]),
      username: new FormControl('', [
        Validators.required,
        Validators.maxLength(30),
        Validators.pattern(/^\S+$/),
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/),
      ]),
      repetir_password: new FormControl('', [Validators.required]),
      fecha_nacimiento: new FormControl('', [Validators.required, fechaNoFutura]),
      descripcion: new FormControl('', [Validators.maxLength(300)]),
      perfil: new FormControl<'usuario' | 'administrador'>('usuario', [Validators.required]),
    },
    { validators: passwordsCoinciden },
  );

  get f() {
    return this.usuarioForm.controls;
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.errorAccion.set(null);
    this.authService.listarUsuarios().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err.status === 401) return;
        this.errorAccion.set(err.error?.message || 'Error al cargar el listado de usuarios');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.archivoFoto.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.fotoBase64.set(reader.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  quitarFoto(): void {
    this.fotoBase64.set('');
    this.archivoFoto.set(null);
  }

  crearUsuario(): void {
    if (this.authService.estaTokenVencido()) {
      this.authService.logout();
      return;
    }

    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.creando.set(true);
    const v = this.usuarioForm.value;

    const datos = new FormData();
    datos.append('nombre', v.nombre!.trim());
    datos.append('apellido', v.apellido!.trim());
    datos.append('correo', v.correo!.trim());
    datos.append('username', v.username!.trim());
    datos.append('password', v.password!);
    datos.append('fecha_nacimiento', v.fecha_nacimiento!);
    datos.append('perfil', v.perfil || 'usuario');

    if (v.descripcion?.trim()) {
      datos.append('descripcion', v.descripcion.trim());
    }
    if (this.archivoFoto()) {
      datos.append('imagen', this.archivoFoto()!);
    }

    this.authService.crearUsuarioAdmin(datos).subscribe({
      next: (res) => {
        this.creando.set(false);
        this.mensajeExito.set(
          `Usuario @${res.usuario.username} creado con perfil "${res.usuario.perfil}".`,
        );
        this.usuarios.update((prev) => [res.usuario, ...prev]);
        this.usuarioForm.reset({ perfil: 'usuario' });
        this.quitarFoto();
      },
      error: (err) => {
        this.creando.set(false);
        if (err.status === 401) return;
        const msg = err.error?.message || 'Error al crear usuario.';
        this.mensajeError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  esMiUsuario(u: Usuario): boolean {
    return !!u._id && u._id === this.authService.currentUser()?._id;
  }

  solicitarDeshabilitar(u: Usuario): void {
    if (!u._id || this.esMiUsuario(u) || this.procesandoId()) return;
    this.usuarioADeshabilitar.set(u);
  }

  cancelarDeshabilitar(): void {
    if (this.procesandoId()) return;
    this.usuarioADeshabilitar.set(null);
  }

  confirmarDeshabilitar(): void {
    const u = this.usuarioADeshabilitar();
    if (!u?._id || this.procesandoId()) return;
    this.actualizarEstadoUsuario(u._id, false);
  }

  rehabilitar(u: Usuario): void {
    if (!u._id || this.esMiUsuario(u) || this.procesandoId()) return;
    this.actualizarEstadoUsuario(u._id, true);
  }

  private actualizarEstadoUsuario(id: string, habilitar: boolean): void {
    if (this.authService.estaTokenVencido()) {
      this.usuarioADeshabilitar.set(null);
      this.authService.logout();
      return;
    }

    this.procesandoId.set(id);
    this.errorAccion.set(null);

    const peticion$ = habilitar
      ? this.authService.rehabilitarUsuario(id)
      : this.authService.deshabilitarUsuario(id);

    peticion$.subscribe({
      next: (res) => {
        this.procesandoId.set(null);
        this.usuarioADeshabilitar.set(null);
        this.usuarios.update((lista) =>
          lista.map((item) => (item._id === res.usuario._id ? res.usuario : item)),
        );
      },
      error: (err) => {
        this.procesandoId.set(null);
        this.usuarioADeshabilitar.set(null);
        if (err.status === 401) return;
        const msg = err.error?.message || 'No se pudo actualizar el estado del usuario.';
        this.errorAccion.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }
}
