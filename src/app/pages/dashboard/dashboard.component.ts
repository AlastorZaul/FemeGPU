import {Component, inject, Signal} from '@angular/core';
import { CommonModule } from '@angular/common'; // NÉCESSAIRE pour le pipe `async` et `@if`
import { GpuDataService } from '../../services/gpu-data.service';

// Imports Angular Material
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Import des composants et modèles
import { GpuCardComponent } from '../../components/gpu-card/gpu-card.component';
import { GpuHistoryChartComponent } from '../../components/gpu-history-chart/gpu-history-chart.component';
import { Gpu, Cluster } from '../../models/gpu.model';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, // Indispensable
    GpuCardComponent,
    MatExpansionModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private gpuService = inject(GpuDataService);
  private dialog = inject(MatDialog);

  // TRANSFORMATION DE L'OBSERVABLE EN SIGNAL
  // Le signal `clusters` se mettra à jour automatiquement à chaque nouvelle
  // émission de l'observable `gpuData$`.
  public clusters: Signal<Cluster[]>;

  constructor() {
    this.clusters = toSignal(this.gpuService.gpuData$, {initialValue: []});
  }

  showHistory(gpu: Gpu): void {
    this.dialog.open(GpuHistoryChartComponent, {
      width: '80vw',
      maxWidth: '800px',
      data: gpu
    });
  }
}
