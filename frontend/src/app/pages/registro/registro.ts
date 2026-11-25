import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import {
  fechaNoFutura,
  obtenerFechaHoyInput,
  passwordsCoinciden,
} from '../../validators/usuario.validators';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly hoyFecha = obtenerFechaHoyInput();

  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  fotoBase64 = signal<string>(''); // Solo para previsualización en pantalla
  archivoFoto = signal<File | null>(null); // Archivo real para enviar por FormData a Multer/Cloudinary

  registroForm = new FormGroup(
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
      perfil: new FormControl<'usuario' | 'administrador'>('usuario'),
    },
    { validators: passwordsCoinciden }
  );

  get f() {
    return this.registroForm.controls;
  }

  // Manejo de la imagen de perfil (campo type="file")
  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.archivoFoto.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoBase64.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    this.mensajeError.set(null);

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const formValues = this.registroForm.value;

    // Armamos FormData tal cual se vio en la clase 11
    const datos = new FormData();
    datos.append('nombre', formValues.nombre!.trim());
    datos.append('apellido', formValues.apellido!.trim());
    datos.append('correo', formValues.correo!.trim());
    datos.append('username', formValues.username!.trim());
    datos.append('password', formValues.password!);
    datos.append('fecha_nacimiento', formValues.fecha_nacimiento!);
    if (formValues.descripcion?.trim()) {
      datos.append('descripcion', formValues.descripcion.trim());
    }
    datos.append('perfil', 'usuario');

    if (this.archivoFoto()) {
      datos.append('imagen', this.archivoFoto()!);
    }

    this.authService.registro(datos).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.message || 'Error al registrar usuario.';
        this.mensajeError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }
}
