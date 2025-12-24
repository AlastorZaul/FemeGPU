import {computed, inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {UserProfile, UserRole} from '../models/user.model';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signal pour l'utilisateur courant
  public currentUser = signal<UserProfile | null>(null);
  public isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // Restauration de la session au démarrage
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('user_profile');
      }
    }
  }

  /**
   * Connexion via l'API Node.js
   * Remplace l'ancien 'loginSmart' et 'loginApi'
   */
  login(creds: { username: string, password?: string }): Observable<UserProfile> {
    return this.http.post<UserProfile>('/api/auth/login', creds).pipe(
      tap(user => this.setSession(user))
    );
  }

  logout(): void {
    localStorage.removeItem('user_profile');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(user: UserProfile) {
    this.currentUser.set(user);
    localStorage.setItem('user_profile', JSON.stringify(user));
  }

  // --- Gestion des Rôles ---

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return !!user && user.roles.includes(role as UserRole);
  }

  hasAnyRole(requiredRoles: string[] | UserRole[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return user.roles.some(role => requiredRoles.includes(role as UserRole));
  }
}
