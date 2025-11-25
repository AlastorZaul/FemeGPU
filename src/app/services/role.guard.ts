import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // 1. Récupérer les rôles attendus depuis la configuration de la route
  const expectedRoles = route.data['roles'] as UserRole[];

  // 2. Si pas connecté -> Login
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // 3. Vérifier les droits
  const hasRole = authService.hasAnyRole(expectedRoles);

  if (!hasRole) {
    snackBar.open('Accès refusé : Droits insuffisants', 'OK', { duration: 3000 });
    // Optionnel : rediriger vers une page "Access Denied" ou rester sur place
    return false;
  }

  return true;
};
