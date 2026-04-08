import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/new',
    loadComponent: () => import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/edit/:id',
    loadComponent: () => import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/role-list/role-list.component').then(m => m.RoleListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roles/new',
    loadComponent: () => import('./roles/role-form/role-form.component').then(m => m.RoleFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roles/edit/:id',
    loadComponent: () => import('./roles/role-form/role-form.component').then(m => m.RoleFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'modulos',
    loadComponent: () => import('./modulos/modulo-list/modulo-list.component').then(m => m.ModuloListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'modulos/new',
    loadComponent: () => import('./modulos/modulo-form/modulo-form.component').then(m => m.ModuloFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'modulos/edit/:id',
    loadComponent: () => import('./modulos/modulo-form/modulo-form.component').then(m => m.ModuloFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'personas',
    loadComponent: () => import('./personas/personas-list/personas-list.component').then(m => m.PersonasListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'personas/new',
    loadComponent: () => import('./personas/persona-form/persona-form.component').then(m => m.PersonaFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'personas/edit/:id',
    loadComponent: () => import('./personas/persona-form/persona-form.component').then(m => m.PersonaFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'permisos',
    loadComponent: () => import('./permisos/permisos-list/permisos-list.component').then(m => m.PermisosListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'permisos/new',
    loadComponent: () => import('./permisos/permiso-form/permiso-form.component').then(m => m.PermisoFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'permisos/edit/:id',
    loadComponent: () => import('./permisos/permiso-form/permiso-form.component').then(m => m.PermisoFormComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
