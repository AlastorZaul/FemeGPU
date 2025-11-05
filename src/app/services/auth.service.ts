import {Injectable, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated: WritableSignal<boolean> = signal<boolean>(!!localStorage.getItem('user'));
  // NOUVEAU : Signal pour stocker le nom de l'utilisateur
  currentUser: WritableSignal<string | null> = signal<string | null>(localStorage.getItem('user'));

  constructor(private router: Router) { }

  login(user: string, pass: string): boolean {
    if (user && pass) {
      localStorage.setItem('user', user); // On stocke le nom d'utilisateur
      this.isAuthenticated.set(true);
      this.currentUser.set(user); // On met à jour le signal
      this.router.navigate(['/dashboard']);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('user'); // On supprime le nom d'utilisateur
    this.isAuthenticated.set(false);
    this.currentUser.set(null); // On met à jour le signal
    this.router.navigate(['/login']);
  }
}
