import {Routes} from '@angular/router';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {WorkersComponent} from './pages/workers/workers.component';
import {SettingsComponent} from './pages/settings/settings.component';
import {LoginComponent} from './pages/login/login.component';
import {authGuard} from './services/auth.guard';
import {LayoutComponent} from './layout/layout.component'; // Importez le nouveau layout

export const routes: Routes = [
  // Route pour la page de connexion, en dehors du layout principal
  {path: 'login', component: LoginComponent},

  // Route "coquille" qui utilise LayoutComponent pour afficher la sidebar
  // et qui protège toutes ses routes enfants
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {path: 'dashboard', component: DashboardComponent, data: {breadcrumb: 'Dashboard'}},
      {path: 'workers', component: WorkersComponent, data: {breadcrumb: 'Workers'}},
      {path: 'settings', component: SettingsComponent, data: {breadcrumb: 'Settings'}},
      // Redirige la racine (ex: localhost:4200) vers le dashboard
      {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
    ]
  },

  // Redirige toute autre URL inconnue
  {path: '**', redirectTo: 'login'}
];
