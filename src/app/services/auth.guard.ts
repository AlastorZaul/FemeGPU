import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si l'utilisateur est authentifié, on autorise l'accès
  if (authService.isLoggedIn()) {
    return true;
  }

  // Sinon, on le redirige vers la page de connexion
  router.navigate(['/login']);
  return false;
};
