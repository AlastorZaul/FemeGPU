import {Component, computed, inject, Signal, ChangeDetectionStrategy} from '@angular/core'; // 1. Import ChangeDetectionStrategy
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';

import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';

export interface FlatNode {
  clusterName: string;
  nodeName: string;
  metrics: NodeMetrics;
  usageClass: string;
}

@Component({
  selector: 'app-node-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatProgressBarModule, MatIconModule],
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // 3. Activation du mode haute performance
})
export class NodeListComponent {
  private gpuDataService = inject(GpuDataServiceMock);

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, {initialValue: []});

  public allNodes: Signal<FlatNode[]> = computed(() => {
    const nodes: FlatNode[] = [];
    for (const cluster of this.clusters()) {
      for (const nodeName in cluster.nodes) {
        const metrics = cluster.nodes[nodeName];

        // 4. Calcul de la classe CSS ici (exécuté seulement quand les données changent)
        let cssClass = 'usage-low';
        if (metrics.gpu_usage_percent > 90) cssClass = 'usage-high';
        else if (metrics.gpu_usage_percent > 70) cssClass = 'usage-medium';

        nodes.push({
          clusterName: cluster.cluster_name,
          nodeName: nodeName,
          metrics: metrics,
          usageClass: cssClass // On stocke le résultat
        });
      }
    }
    return nodes;
  });

  // J'ai ajouté 'owner' suite à ta demande précédente
  public displayedColumns: string[] = [
    'clusterName',
    'nodeName',
    'owner',
    'physical_gpus',
    'virtual_gpus',
    'used_gpus',
    'memory',
    'cpu',
    'gpu_usage_percent'
  ];

  // 5. La méthode getUsageClass() a été supprimée car elle n'est plus nécessaire !
}
