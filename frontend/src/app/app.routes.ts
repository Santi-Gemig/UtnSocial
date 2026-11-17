import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Publicaciones } from './pages/publicaciones/publicaciones';
import { PublicacionDetalle } from './pages/publicacion-detalle/publicacion-detalle';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { Cargando } from './pages/cargando/cargando';

export const routes: Routes = [
    { path: '', redirectTo: 'cargando', pathMatch: 'full' },
    { path: 'cargando', component: Cargando },
    { path: 'login', component: Login },
    { path: 'registro', component: Registro },
    { path: 'publicaciones', component: Publicaciones },
    { path: 'publicaciones/:id', component: PublicacionDetalle },
    { path: 'mi-perfil', component: MiPerfil },
    { path: '**', redirectTo: 'publicaciones' },
];