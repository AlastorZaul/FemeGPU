import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {UserRole} from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // 1. Vérifier si connecté
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Récupérer les rôles attendus par la route
  const expectedRoles = route.data['roles'] as UserRole[];

  const currentUser = authService.currentUser();
  console.log('🔍 DEBUG GUARD:', {
    user: currentUser,
    userRoles: currentUser?.roles,
    requiredRoles: expectedRoles
  });

  // 3. Vérifier les droits
  if (authService.hasAnyRole(expectedRoles)) {
    return true;
  } else {
    // Accès refusé
    snackBar.open(`Accès refusé. Rôle requis : ${expectedRoles?.join(', ')}`, 'OK', {duration: 5000});
    // Optionnel : rediriger vers dashboard si déjà connecté mais mauvais droits
    router.navigate(['/dashboard']);
    return false;
  }

};
