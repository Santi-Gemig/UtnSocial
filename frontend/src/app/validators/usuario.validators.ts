import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function obtenerFechaHoyInput(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const repetirPassword = control.get('repetir_password')?.value;
  return password === repetirPassword ? null : { noCoinciden: true };
}

export const fechaNoFutura: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value;
  if (!valor || typeof valor !== 'string') return null;
  return valor > obtenerFechaHoyInput() ? { fechaFutura: true } : null;
};
