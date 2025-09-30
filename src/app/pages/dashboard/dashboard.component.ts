import {Component, computed, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';

// Services
import {GpuDataService} from '../../services/gpu-data.service';
import {FarmAllocationMetrics, MetricsService} from '../../services/metrics.service';
import {Cluster} from '../../models/gpu.model';

// Composants et Modules
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDialog} from '@angular/material/dialog';
import {ClusterDetailsDialogComponent} from '../../components/cluster-details-dialog/cluster-details-dialog.component';
import {MatDivider} from '@angular/material/divider';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatDivider
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private metricsService = inject(MetricsService);
  private gpuDataService = inject(GpuDataService); // Pour les données brutes
  private dialog = inject(MatDialog);

  // Signal pour les métriques calculées (pour l'affichage principal)
  public metrics: Signal<FarmAllocationMetrics | undefined>;
  // Signal pour les données brutes (pour les détails dans la modale)
  private readonly rawClusters: Signal<Cluster[]>;

  constructor() {
    this.metrics = toSignal(this.metricsService.farmMetrics$);
    this.rawClusters = toSignal(this.gpuDataService.gpuData$, {initialValue: []});
  }

  // --- CORRECTION : La propriété `displayClusters` doit être déclarée ici ---
  public displayClusters = computed(() => {
    const raw = this.rawClusters();
    const metricsClusters = this.metrics()?.clusters;

    if (!raw.length || !metricsClusters) return [];

    // On combine les données brutes (avec la liste des GPUs) et les métriques
    return raw.map(rawCluster => {
      const metric = metricsClusters.find(m => m.id === rawCluster.id);
      return {
        ...rawCluster,
        ...metric
      };
    });
  });

  // Méthode pour ouvrir la modale
  showClusterDetails(clusterId: string): void {
    // On cherche le cluster correspondant dans les données brutes
    const clusterData = this.rawClusters().find(c => c.id === clusterId);
    if (!clusterData) return; // Sécurité si le cluster n'est pas trouvé

    this.dialog.open(ClusterDetailsDialogComponent, {
      width: '600px',
      data: {
        clusterName: clusterData.name,
        gpus: clusterData.gpus
      }
    });
  }
}
