import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../services/auth';

@Directive({
    selector: '[appSoloAdmin]',
})
export class SoloAdminDirective {
    private templateRef = inject(TemplateRef<unknown>);
    private viewContainer = inject(ViewContainerRef);
    private authService = inject(AuthService);
    private mostrando = false;

    constructor() {
        effect(() => {
            const esAdmin =
                this.authService.isLoggedIn() &&
                this.authService.currentUser()?.perfil === 'administrador';

            if (esAdmin && !this.mostrando) {
                this.viewContainer.createEmbeddedView(this.templateRef);
                this.mostrando = true;
            } else if (!esAdmin && this.mostrando) {
                this.viewContainer.clear();
                this.mostrando = false;
            }
        });
    }
}