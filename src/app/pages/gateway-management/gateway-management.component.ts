import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Imports Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

// Interface pour définir la structure d'une gateway
export interface Gateway {
  id: string;
  name: string;
  ipAddress: string;
  status: 'Online' | 'Offline';
}

// Données simulées pour le tableau
const MOCK_GATEWAYS: Gateway[] = [
  { id: 'gw-001', name: 'Gateway Principale - Datacenter A', ipAddress: '192.168.1.1', status: 'Online' },
  { id: 'gw-002', name: 'Gateway Secondaire - Datacenter A', ipAddress: '192.168.1.2', status: 'Offline' },
  { id: 'gw-003', name: 'Gateway - Datacenter B', ipAddress: '10.10.0.1', status: 'Online' },
];

@Component({
  selector: 'app-gateway-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './gateway-management.component.html',
  styleUrls: ['./gateway-management.component.scss']
})
export class GatewayManagementComponent {
  displayedColumns: string[] = ['name', 'ipAddress', 'status', 'actions'];
  dataSource = MOCK_GATEWAYS;
}