import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>' // Contient uniquement le router-outlet
})
export class AppComponent {
  toggleMockMode() {
    const current = localStorage.getItem('FORCE_MOCK');
    const newValue = current === 'true' ? 'false' : 'true';
    localStorage.setItem('FORCE_MOCK', newValue);

    // Recharger la page pour appliquer
    window.location.reload();
  }
}
