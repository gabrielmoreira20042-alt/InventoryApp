import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de autenticação - protege rotas que requerem login
 * 
 * Se o utilizador não estiver autenticado, redireciona para /login
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // utilizador autenticado, pode aceder
  }

  // Guardar a URL pretendida para redirecionar após login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
