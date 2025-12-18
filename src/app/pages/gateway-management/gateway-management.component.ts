import {Component, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';

import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {toSignal} from '@angular/core/rxjs-interop';

import {Gateway} from '../../models/gpu.model';
// CORRECTION : Import du service abstrait
import {GatewayDataService} from '../../services/gateway-data.service';


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

  // CORRECTION : Injection via la classe abstraite
  private gatewayDataService = inject(GatewayDataService);
  private snackBar = inject(MatSnackBar);

  public gateways: Signal<Gateway[]> = toSignal(this.gatewayDataService.gateways$, { initialValue: [] });

  public dataSource = this.gateways;
  public displayedColumns: string[] = ['name', 'ipAddress', 'status', 'actions'];

  onRestart(gateway: Gateway): void {
    if (gateway.status === 'Restarting') {
      return;
    }

    this.gatewayDataService.restartGateway(gateway.id).subscribe({
      next: (response) => {
        // En mode Live, 'response' peut être vide ou différer du mock. Ajustez selon votre API.
        if (response && response.success !== false) {
          this.snackBar.open(`La gateway "${gateway.name}" a été relancée.`, 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open(`Échec de la relance.`, 'Fermer', {duration: 5000});
        }
      },
      error: (err) => {
        this.snackBar.open(`Erreur inattendue: ${err.message}`, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
