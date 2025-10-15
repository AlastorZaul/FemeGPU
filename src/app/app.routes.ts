import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NodeListComponent } from './pages/node-list/node-list.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './services/auth.guard';
import { GatewayManagementComponent } from './pages/gateway-management/gateway-management.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // On ajoute la donnée "breadcrumb" à chaque route
      { 
        path: 'dashboard', 
        component: DashboardComponent, 
        data: { breadcrumb: 'Dashboard' } 
      },
      { 
        path: 'nodes', 
        component: NodeListComponent, 
        data: { breadcrumb: 'Nodes' } 
      },
      { 
        path: 'gateways', 
        component: GatewayManagementComponent, 
        data: { breadcrumb: 'Gateways' } 
      },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];