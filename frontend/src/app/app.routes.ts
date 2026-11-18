import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Publicaciones } from './pages/publicaciones/publicaciones';
import { PublicacionDetalle } from './pages/publicacion-detalle/publicacion-detalle';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { Cargando } from './pages/cargando/cargando';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'cargando', pathMatch: 'full' },
    { path: 'cargando', component: Cargando },
    { path: 'login', component: Login },
    { path: 'registro', component: Registro },
    // Rutas protegidas: solo con sesión iniciada
    { path: 'publicaciones', component: Publicaciones, canActivate: [authGuard] },
    { path: 'publicaciones/:id', component: PublicacionDetalle, canActivate: [authGuard] },
    { path: 'mi-perfil', component: MiPerfil, canActivate: [authGuard] },
    { path: '**', redirectTo: 'publicaciones' },
];
