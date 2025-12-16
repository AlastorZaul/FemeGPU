import {computed, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {UserProfile, UserRole} from '../models/user.model';


export const MOCK_USERS: (UserProfile & { description: string, icon: string })[] = [
  // --- Utilisateurs Génériques ---
  {
    username: 'Alice Admin',
    email: 'alice@admin.local',
    roles: ['ADMIN'],
    token: 'admin-token',
    description: 'Accès complet (Super Admin)',
    icon: 'shield_person'
  },
  {
    username: 'Bob Developer',
    email: 'bob@dev.local',
    roles: ['USER'],
    token: 'user-token',
    description: 'Développeur standard',
    icon: 'code'
  },

  // --- Propriétaires de Nœuds (Requis pour tester la sécurité) ---
  {
    username: 'Mistral',
    email: 'admin@mistral.ai',
    roles: ['USER'],
    token: 'mistral-token',
    description: 'Propriétaire du nœud H200 (HPI B)',
    icon: 'dns'
  },
  {
    username: 'Équipe IA',
    email: 'ai-team@company.com',
    roles: ['USER'],
    token: 'ai-token',
    description: 'Propriétaire du nœud A100 (HPI A)',
    icon: 'psychology'
  },
  {
    username: 'Infrastructure',
    email: 'infra@company.com',
    roles: ['ADMIN'], // Souvent Admin
    token: 'infra-token',
    description: 'Gestionnaire Infra (HPI A)',
    icon: 'settings_input_component'
  },
  {
    username: 'Data Science',
    email: 'ds@company.com',
    roles: ['USER'],
    token: 'ds-token',
    description: 'Propriétaire du nœud L40S (HPI B)',
    icon: 'analytics'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<UserProfile | null>(null);
  public isLoggedIn = computed(() => !!this.currentUser());

  constructor(private router: Router) {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  getAvailableUsers() {
    return MOCK_USERS;
  }

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
