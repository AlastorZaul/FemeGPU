import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
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
  public authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Champs du formulaire
  username = '';
  password = '';
  isLoading = signal(false);

  // SUPPRIMÉ : availableMockUsers, toggleMode(), fillMockUser()

  onSubmit() {
    if (!this.username) return;

    this.isLoading.set(true);
    const creds = {username: this.username, password: this.password};

    this.authService.login(creds).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.snackBar.open(`Bienvenue ${user.username}`, '👋', {duration: 2000});
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur de connexion (API)', 'Fermer', {duration: 4000});
        console.error(err);
      }
    });
  }
}
