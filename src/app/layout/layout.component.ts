import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatExpansionModule} from '@angular/material/expansion';
// MatSlideToggleModule peut être retiré des imports si vous ne l'utilisez plus ailleurs
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
    BreadcrumbComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  public authService = inject(AuthService);

  // SUPPRIMÉ : isMockMode, onModeChange()
}
