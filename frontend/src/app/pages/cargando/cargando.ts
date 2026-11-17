import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-cargando',
    templateUrl: './cargando.html',
    styleUrl: './cargando.css',
})
export class Cargando implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);

    ngOnInit(): void {
        const token = this.authService.token();


        if (!token) {
            setTimeout(() => {
                this.authService.logout();
            }, 600);
            return;
        }


        this.authService.autorizar().subscribe({
            next: () => {
                this.router.navigate(['/publicaciones']);
            },
            error: () => {
                this.authService.logout();
            },
        });
    }
}