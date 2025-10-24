import {Component, computed, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';

// Imports Angular Material
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';

// Interface pour notre liste aplatie de nœuds
export interface FlatNode {
  clusterName: string;
  nodeName: string;
  metrics: NodeMetrics;
}

@Component({
  selector: 'app-node-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatProgressBarModule, MatIconModule],
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.scss']
})
export class NodeListComponent {
  private gpuDataService = inject(GpuDataServiceMock);

  // Signal pour les données brutes de l'API
  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, {initialValue: []});

  // Signal calculé pour aplatir la liste de tous les nœuds
  public allNodes: Signal<FlatNode[]> = computed(() => {
    const nodes: FlatNode[] = [];
    for (const cluster of this.clusters()) {
      for (const nodeName in cluster.nodes) {
        nodes.push({
          clusterName: cluster.cluster_name,
          nodeName: nodeName,
          metrics: cluster.nodes[nodeName]
        });
      }
    }
    return nodes;
  });

  // Colonnes à afficher dans le tableau
  public displayedColumns: string[] = [
    'clusterName', 'nodeName', 'physical_gpus', 'virtual_gpus', 'used_gpus', 'gpu_usage_percent'
  ];

  getUsageClass(usagePercent: number): string {
    if (usagePercent > 90) return 'usage-high';
    if (usagePercent > 70) return 'usage-medium';
    return 'usage-low';
  }
}
