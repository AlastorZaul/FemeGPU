import {Injectable, signal, computed} from '@angular/core';
import {Router} from '@angular/router';
import {UserProfile, UserRole} from '../models/user.model';


export const MOCK_USERS: (UserProfile & { description: string, icon: string })[] = [
  {
    username: 'Alice Admin',
    email: 'alice@admin.local',
    roles: ['ADMIN'],
    token: 'admin-token',
    description: 'Accès complet, gestion gateways',
    icon: 'shield_person'
  },
  {
    username: 'Bob Developer',
    email: 'bob@dev.local',
    roles: ['USER'],
    token: 'user-token',
    description: 'Peut créer des réservations',
    icon: 'code'
  },
  {
    username: 'Charlie Viewer',
    email: 'charlie@audit.local',
    roles: ['VIEWER'], // Assure-toi d'avoir ajouté 'VIEWER' dans ton type UserRole
    token: 'viewer-token',
    description: 'Lecture seule (Audit)',
    icon: 'visibility'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<UserProfile | null>(null);
  public isLoggedIn = computed(() => !!this.currentUser());

  constructor(private router: Router) {
    // Restauration session
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  // Retourne la liste pour l'affichage
  getAvailableUsers() {
    return MOCK_USERS;
  }

  // Login simplifié : on passe directement l'objet utilisateur
  login(user: UserProfile): void {
    this.currentUser.set(user);
    localStorage.setItem('user_profile', JSON.stringify(user));
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem('user_profile');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasAnyRole(requiredRoles: UserRole[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return user.roles.some(role => requiredRoles.includes(role));
  }
}
