import {Component, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';

// Imports Angular Material
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {toSignal} from '@angular/core/rxjs-interop';

// MODÈLE GLOBAL
import {Gateway} from '../../models/gpu.model';
// **** MODIFICATION : Importer le NOUVEAU service ****
import {GatewayDataMockService} from '../../services/gateway-data-mock.service';


@Component({
  selector: 'app-gateway-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './gateway-management.component.html',
  styleUrls: ['./gateway-management.component.scss']
})
export class GatewayManagementComponent {

  // **** MODIFICATION : Injecter le NOUVEAU service ****
  private gatewayDataService = inject(GatewayDataMockService);
  private snackBar = inject(MatSnackBar);

  // **** MODIFICATION : Utiliser le nouveau service ****
  public gateways: Signal<Gateway[]> = toSignal(this.gatewayDataService.gateways$, { initialValue: [] });

  public dataSource = this.gateways;
  public displayedColumns: string[] = ['name', 'ipAddress', 'status', 'actions'];

  onRestart(gateway: Gateway): void {
    if (gateway.status === 'Restarting') {
      return;
    }

    // **** MODIFICATION : Utiliser le nouveau service ****
    this.gatewayDataService.restartGateway(gateway.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(`La gateway "${gateway.name}" a été relancée.`, 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open(`Échec de la relance: ${response.message}`, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      },
      error: (err) => {
        this.snackBar.open(`Erreur inattendue: ${err.message}`, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
