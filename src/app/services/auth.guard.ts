import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Vérifie si l'utilisateur est "connecté" (simulation)
  if (localStorage.getItem('isLoggedIn') === 'true') {
    return true;
  } else {
    // Sinon, redirige vers la page de connexion
    router.navigate(['/login']);
    return false;
  }
};
