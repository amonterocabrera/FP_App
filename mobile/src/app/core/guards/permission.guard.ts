import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Example expected permission in route data: { data: { permission: 'usuarios.ver' } }
  const expectedPermission = route.data?.['permission'];

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }

  if (!expectedPermission) {
    // If no specific permission is required, allow active session to pass
    return true;
  }

  const hasPermission = authService.hasPermission(expectedPermission);
  
  if (!hasPermission) {
    // Try to redirect to a general unauthorized or dashboard page
    return router.createUrlTree(['/unauthorized']); 
  }

  return true;
};
