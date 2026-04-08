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
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
