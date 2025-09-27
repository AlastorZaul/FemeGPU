import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WorkersComponent } from './pages/workers/workers.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    component: DashboardComponent,
    data: { breadcrumb: 'Dashboard' } // On ajoute le label ici
  },
  {
    path: 'workers',
    component: WorkersComponent,
    data: { breadcrumb: 'Workers' } // Et ici
  },
  {
    path: 'settings',
    component: SettingsComponent,
    data: { breadcrumb: 'Settings' } // Et ici
  },

  { path: '**', redirectTo: '/dashboard' }
];
