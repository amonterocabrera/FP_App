import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    // This is where standard layout wrapping happens, protected by authGuard. 
    // It will lazy load child authenticated paths (ex. Dashboard, Personas).
    canActivate: [authGuard],
    children: [
      /* Example: 
      {
        path: 'personas',
        loadComponent: () => import('./personas/list.component').then(m => m.ListComponent)
      } 
      */
    ]
  },
  { path: '**', redirectTo: '' }
];
