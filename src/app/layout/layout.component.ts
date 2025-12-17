import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatSlideToggleModule} from '@angular/material/slide-toggle'; // <-- Import nécessaire
import {AuthService} from '../services/auth.service';
import {BreadcrumbComponent} from '../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatSlideToggleModule, // <-- Ajouter ici
    BreadcrumbComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  public authService = inject(AuthService);

  // --- LOGIQUE DU MODE DÉVELOPPEUR ---

  // Lit l'état actuel (true si 'true', false sinon)
  isMockMode = localStorage.getItem('FORCE_MOCK') === 'true';

  onModeChange(event: any) {
    const isChecked = event.checked;
    if (isChecked) {
      localStorage.setItem('FORCE_MOCK', 'true');
    } else {
      localStorage.setItem('FORCE_MOCK', 'false');
    }
    // Rechargement pour appliquer le changement de Factory
    window.location.reload();
  }
}
