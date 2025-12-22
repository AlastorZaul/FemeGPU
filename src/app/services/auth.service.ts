import {computed, inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {UserProfile, UserRole} from '../models/user.model';
import {Observable, of, throwError} from 'rxjs';
import {delay, tap} from 'rxjs/operators';

// On garde vos utilisateurs riches pour le mode Mock
export const MOCK_USERS: (UserProfile & { description: string, icon: string })[] = [
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
  {
    username: 'Mistral',
    email: 'admin@mistral.ai',
    roles: ['USER'],
    token: 'mistral-token',
    description: 'Propriétaire du nœud H200',
    icon: 'dns'
  },
  {
    username: 'Équipe IA',
    email: 'ai-team@company.com',
    roles: ['USER'],
    token: 'ai-token',
    description: 'Propriétaire du nœud A100',
    icon: 'psychology'
  },
  {
    username: 'Infrastructure',
    email: 'infra@company.com',
    roles: ['ADMIN'],
    token: 'infra-token',
    description: 'Gestionnaire Infra',
    icon: 'settings_input_component'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // --- 1. SIGNAL D'ÉTAT DU MODE ---
  // Initialisé à 'true' par défaut pour la démo, ou selon le localStorage
  public isMockMode = signal<boolean>(localStorage.getItem('prefer_mock') !== 'false');

  public currentUser = signal<UserProfile | null>(null);
  public isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('user_profile');
      }
    }
  }

  // --- 2. BASCULE DU MODE ---
  toggleMockMode() {
    this.isMockMode.update(val => !val);
    localStorage.setItem('prefer_mock', String(this.isMockMode()));
    this.logout(); // Déconnexion forcée au changement de mode
  }

  loginSmart(credentials: { username: string, password?: string }): Observable<UserProfile> {
    const input = credentials.username.toLowerCase().trim();

    // Recherche plus souple :
    // 1. Soit le username contient ce qu'on a tapé (ex: "alice" dans "Alice Admin")
    // 2. Soit l'email correspond exactement
    const mockUserFound = MOCK_USERS.find(u =>
      u.username.toLowerCase().includes(input) ||
      (u.email && u.email.toLowerCase() === input)
    );

    if (mockUserFound) {
      console.log(`🤖 Smart Login: "${input}" reconnu comme MOCK (${mockUserFound.username})`);

      // ON FORCE LE MODE MOCK
      this.isMockMode.set(true);
      localStorage.setItem('prefer_mock', 'true');

      // On passe les credentials du user trouvé pour éviter les erreurs de frappe
      return this.loginMock({username: mockUserFound.username, password: credentials.password});
    } else {
      console.log(`☁️ Smart Login: "${input}" inconnu en local -> Tentative API`);

      // ON FORCE LE MODE API
      this.isMockMode.set(false);
      localStorage.setItem('prefer_mock', 'false');

      return this.loginApi(credentials);
    }
  }

  // API LIVE (Node.js)
  private loginApi(creds: { username: string, password?: string }): Observable<UserProfile> {
    return this.http.post<UserProfile>('/api/auth/login', creds).pipe(
      tap(user => this.setSession(user))
    );
  }

  // MOCK LOCAL (Simulation)
  private loginMock(creds: { username: string, password?: string }): Observable<UserProfile> {
    // Dans le mock, on cherche par username (partiel ou complet)
    const user = MOCK_USERS.find(u =>
      u.username.toLowerCase().includes(creds.username.toLowerCase()) ||
      // CORRECTION ICI : On vérifie (u.email && ...) avant le toLowerCase()
      (u.email && u.email.toLowerCase() === creds.username.toLowerCase())
    );

    if (user) {
      // Simulation de délai réseau
      return of(user).pipe(
        delay(600),
        tap(u => this.setSession(u))
      );
    }
    return throwError(() => new Error('Utilisateur introuvable (Mock)'));
  }

  private setSession(user: UserProfile) {
    this.currentUser.set(user);
    localStorage.setItem('user_profile', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem('user_profile');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // Helper pour récupérer la liste (utile pour l'autocomplétion en mode mock)
  getAvailableUsers() {
    return MOCK_USERS;
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique.
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    // On force le cast 'as UserRole' pour satisfaire TypeScript
    return !!user && user.roles.includes(role as UserRole);
  }

  /**
   * Vérifie si l'utilisateur possède au moins L'UN des rôles requis.
   * Utilisé par le RoleGuard.
   */
  hasAnyRole(requiredRoles: string[] | UserRole[]): boolean {
    const user = this.currentUser();

    // Pas d'utilisateur connecté = pas de rôle
    if (!user) return false;

    // Si la route ne demande aucun rôle, c'est autorisé
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // On vérifie si l'un des rôles de l'utilisateur est dans la liste requise
    return user.roles.some(role => requiredRoles.includes(role as UserRole));
  }
}
