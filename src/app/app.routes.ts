import {Routes} from '@angular/router';
import {LayoutComponent} from './layout/layout.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {NodeListComponent} from './pages/node-list/node-list.component';
import {LoginComponent} from './pages/login/login.component';
import {GatewayManagementComponent} from './pages/gateway-management/gateway-management.component';
import {NamespaceCreatorComponent} from './pages/namespace-creator/namespace-creator.component';
import {ReservationListComponent} from './pages/reservation-list/reservation-list.component';
import {ApplicationListComponent} from './pages/application-list/application-list.component';
import {roleGuard} from './services/role.guard';
import {ModelListComponent} from './pages/model-list/model-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    // Le layout de base reste protégé par le guard simple ou roleGuard
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Accessible à tout le monde connecté
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { breadcrumb: 'Dashboard' }
      },
      // --- ZONES SÉCURISÉES ---
      {
        path: 'nodes',
        component: NodeListComponent,
        canActivate: [roleGuard], // <--- Protection active
        data: {
          breadcrumb: 'Nodes',
          roles: ['ADMIN', 'USER'] // Admin et User peuvent voir
        }
      },
      {
        path: 'gateways',
        component: GatewayManagementComponent,
        canActivate: [roleGuard], // <--- Protection active
        data: {
          breadcrumb: 'Gateways',
          roles: ['ADMIN'] // SEUL L'ADMIN PEUT VOIR
        }
      },
      {
        path: 'create-namespace',
        component: NamespaceCreatorComponent,
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Créer un Namespace',
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'models',
        component: ModelListComponent,
        canActivate: [roleGuard], // Protection activée
        data: {
          breadcrumb: 'Catalogue Modèles',
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'reservations',
        component: ReservationListComponent,
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Réservations Actives',
          roles: ['ADMIN', 'USER']
        }
      },
      { path: 'applications',
        component: ApplicationListComponent,
        data : { breadcrumb: 'Listes Applications' }
      },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
