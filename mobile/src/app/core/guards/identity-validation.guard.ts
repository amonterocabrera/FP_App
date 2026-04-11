import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ValidationStatus } from '../models/auth.models';

export const identityValidationGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const status = authService.getValidationStatus();

  if (status === ValidationStatus.Approved) {
    return true; // Permitir acceso navegacion a modulos internos
  }

  // Redirigir a vista de validacion obligatoria
  return router.createUrlTree(['/identity-validation']);
};
