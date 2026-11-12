import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  // Formulario reactivo con las validaciones pedidas
  loginForm = new FormGroup({
    identificador: new FormControl('', [Validators.required]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/), // Al menos una mayúscula y un número
    ]),
  });

  // Getter cómodo para comprobar errores en el HTML
  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.mensajeError.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const { identificador, password } = this.loginForm.value;

    this.authService.login({ identificador: identificador!, password: password! }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        this.mensajeError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }
}