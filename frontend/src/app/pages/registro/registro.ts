import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

// Validador personalizado para chequear que las contraseñas coincidan
function passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const repetirPassword = control.get('repetir_password')?.value;
  return password === repetirPassword ? null : { noCoinciden: true };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  fotoBase64 = signal<string>(''); // Solo para previsualización en pantalla
  archivoFoto = signal<File | null>(null); // Archivo real para enviar por FormData a Multer/Cloudinary

  registroForm = new FormGroup(
    {
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      correo: new FormControl('', [Validators.required, Validators.email]),
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/),
      ]),
      repetir_password: new FormControl('', [Validators.required]),
      fecha_nacimiento: new FormControl('', [Validators.required]),
      descripcion: new FormControl(''),
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
    datos.append('nombre', formValues.nombre!);
    datos.append('apellido', formValues.apellido!);
    datos.append('correo', formValues.correo!);
    datos.append('username', formValues.username!);
    datos.append('password', formValues.password!);
    datos.append('fecha_nacimiento', formValues.fecha_nacimiento!);
    if (formValues.descripcion) {
      datos.append('descripcion', formValues.descripcion);
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
