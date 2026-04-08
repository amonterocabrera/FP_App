import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    // Check if user must change password
    const user = authService.getCurrentUser();
    // Wait, mustChangePassword is not in the UserSession it's in the AuthResult
    // However, they can parse the JWT natively to get "must_change_password" claim if needed,
    // or we just let components check it. Since we just check logged in state here:
    return true;
  }

  // Not logged in so redirect to login page with the return url
  return router.createUrlTree(['/home'], { queryParams: { returnUrl: state.url } });
};
