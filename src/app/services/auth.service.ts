import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfile, UserRole } from '../models/user.model'; // Ajuste l'import selon où tu as mis l'interface

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal qui contient l'état actuel de l'utilisateur (null = non connecté)
  public currentUser = signal<UserProfile | null>(null);

  // Signal dérivé pour savoir si on est connecté
  public isLoggedIn = computed(() => !!this.currentUser());

  constructor(private router: Router) {
    // Restauration de session (simulation)
    const savedUser = localStorage.getItem('mock_sso_user');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  // Simulation du login SSO
  login(role: UserRole = 'USER'): void {
    const mockUser: UserProfile = {
      username: role === 'ADMIN' ? 'AdminSystem' : 'JohnDoe',
      email: role === 'ADMIN' ? 'admin@fermegpu.local' : 'user@fermegpu.local',
      roles: [role], // On assigne le rôle choisi
      token: 'fake-jwt-token-xyz-123'
    };

    this.currentUser.set(mockUser);
    localStorage.setItem('mock_sso_user', JSON.stringify(mockUser));
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('mock_sso_user');
    this.router.navigate(['/login']);
  }

  // Vérifie si l'utilisateur a l'un des rôles requis
  hasAnyRole(requiredRoles: UserRole[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.roles.some(role => requiredRoles.includes(role));
  }
}
