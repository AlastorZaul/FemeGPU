import {Component, inject, Signal} from '@angular/core';
import {CommonModule, KeyValue} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';

// Services et Modèles
import {GpuDataService} from '../../services/gpu-data.service';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';

// Composants et Modules
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDividerModule} from '@angular/material/divider';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private gpuDataService = inject(GpuDataService);

  // Signal pour les données brutes de l'API
  public clusters: Signal<ClusterApiResponse[]>;

  constructor() {
    this.clusters = toSignal(this.gpuDataService.clusterData$, {initialValue: []});
  }

  // Permet de conserver l'ordre original des clés dans l'objet `nodes`
  originalOrder = (a: KeyValue<string, NodeMetrics>, b: KeyValue<string, NodeMetrics>): number => {
    return 0;
  }

  getUsageClass(usagePercent: number): string {
    if (usagePercent > 90) {
      return 'usage-high';
    }
    if (usagePercent > 70) {
      return 'usage-medium';
    }
    return 'usage-low';
  }
}
