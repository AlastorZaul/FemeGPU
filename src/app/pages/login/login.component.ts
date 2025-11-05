import {Component, inject} from '@angular/core';
import {AuthService} from '../../services/auth.service'; // Importer AuthService
import {FormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';

  // Injecter le service d'authentification
  private authService = inject(AuthService);

  // Mettre à jour la méthode de connexion
  onLogin(): void {
    this.authService.login(this.username, this.password);
  }
}
