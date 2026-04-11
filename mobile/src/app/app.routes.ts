import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { identityValidationGuard } from './core/guards/identity-validation.guard';
import { TabsPage } from './tabs/tabs.page';

export const routes: Routes = [
  // ── Pública: Login ─────────────────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
  },

  // ── Autenticada: Shell con ion-tabs ────────────────────────────────────────
  {
    path: '',
    component: TabsPage,
    canActivate: [authGuard, identityValidationGuard],
    children: [
      // Tab 1 — Inicio / Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      // Tab 2 — Reportes
      {
        path: 'reportes',
        loadComponent: () =>
          import('./reportes/reportes.page').then(m => m.ReportesPage),
      },

      // Tab 3 (FAB) — Agregar persona
      {
        path: 'agregar',
        loadComponent: () =>
          import('./personas/persona-form/persona-form.component')
            .then(m => m.PersonaFormComponent),
      },

      // Tab 4 — Más opciones
      {
        path: 'mas',
        loadComponent: () =>
          import('./mas-opciones/mas-opciones.page').then(m => m.MasOpcionesPage),
      },

      // Tab 5 — Perfil
      {
        path: 'perfil',
        loadComponent: () =>
          import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
      },

      // Rutas secundarias dentro del shell (sin tabs visualmente)
      {
        path: 'users',
        loadComponent: () =>
          import('./users/user-list/user-list.component').then(m => m.UserListComponent),
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
      },
      {
        path: 'users/edit/:id',
        loadComponent: () =>
          import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./roles/role-list/role-list.component').then(m => m.RoleListComponent),
      },
      {
        path: 'roles/new',
        loadComponent: () =>
          import('./roles/role-form/role-form.component').then(m => m.RoleFormComponent),
      },
      {
        path: 'roles/edit/:id',
        loadComponent: () =>
          import('./roles/role-form/role-form.component').then(m => m.RoleFormComponent),
      },
      {
        path: 'personas',
        loadComponent: () =>
          import('./personas/personas-list/personas-list.component')
            .then(m => m.PersonasListComponent),
      },
      {
        path: 'personas/new',
        loadComponent: () =>
          import('./personas/persona-form/persona-form.component')
            .then(m => m.PersonaFormComponent),
      },
      {
        path: 'personas/edit/:id',
        loadComponent: () =>
          import('./personas/persona-form/persona-form.component')
            .then(m => m.PersonaFormComponent),
      },
      {
        path: 'modulos',
        loadComponent: () =>
          import('./modulos/modulo-list/modulo-list.component').then(m => m.ModuloListComponent),
      },
      {
        path: 'modulos/new',
        loadComponent: () =>
          import('./modulos/modulo-form/modulo-form.component').then(m => m.ModuloFormComponent),
      },
      {
        path: 'modulos/edit/:id',
        loadComponent: () =>
          import('./modulos/modulo-form/modulo-form.component').then(m => m.ModuloFormComponent),
      },
      {
        path: 'permisos',
        loadComponent: () =>
          import('./permisos/permisos-list/permisos-list.component')
            .then(m => m.PermisosListComponent),
      },
      {
        path: 'permisos/new',
        loadComponent: () =>
          import('./permisos/permiso-form/permiso-form.component')
            .then(m => m.PermisoFormComponent),
      },
      {
        path: 'permisos/edit/:id',
        loadComponent: () =>
          import('./permisos/permiso-form/permiso-form.component')
            .then(m => m.PermisoFormComponent),
      },

      // Default child → dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  
  // ── Validación de Identidad Obligatoria ────────────────────────────────────
  {
    path: 'identity-validation',
    loadComponent: () => import('./validation/validation.page').then(m => m.ValidationPage),
    canActivate: [authGuard]
  },
];
