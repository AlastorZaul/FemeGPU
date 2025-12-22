import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms'; // <--- Important pour [(ngModel)]
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public authService = inject(AuthService); // Public pour accès HTML
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Champs du formulaire
  username = '';
  password = '';
  isLoading = signal(false);

  // Pour l'aide en mode mock
  availableMockUsers = this.authService.getAvailableUsers();

  toggleMode() {
    this.authService.toggleMockMode();
    const mode = this.authService.isMockMode() ? 'MOCK (Démo)' : 'LIVE (Serveur)';
    this.snackBar.open(`Mode basculé sur : ${mode}`, 'OK', {duration: 1500});
  }

  // Remplissage rapide pour la démo
  fillMockUser(username: string) {
    this.username = username;
    this.password = '123'; // Mot de passe fictif
  }

  onSubmit() {
    if (!this.username) return;

    this.isLoading.set(true);
    const creds = {username: this.username, password: this.password};

    // --- CHANGEMENT ICI : On utilise loginSmart ---
    this.authService.loginSmart(creds).subscribe({
      next: (user) => {
        this.isLoading.set(false);

        // Petit message pour confirmer le mode utilisé
        const modeUsed = this.authService.isMockMode() ? 'Mode DÉMO' : 'Mode LIVE';
        this.snackBar.open(`Bienvenue ${user.username} (${modeUsed})`, '👋', {duration: 2000});

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Gestion d'erreur unifiée
        this.snackBar.open('Connexion impossible. Vérifiez le serveur ou les identifiants.', 'Fermer', {duration: 4000});
        console.error(err);
      }
    });
  }
}
