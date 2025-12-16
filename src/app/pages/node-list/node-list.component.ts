import {ChangeDetectionStrategy, Component, computed, inject, Signal, signal} from '@angular/core'; // 1. Import ChangeDetectionStrategy
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';

import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';

export interface FlatNode {
  clusterName: string;
  nodeName: string;
  metrics: NodeMetrics;
  usageClass: string;
  statusClass: string;
}

@Component({
  selector: 'app-node-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatProgressBarModule, MatIconModule,MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule],
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // 3. Activation du mode haute performance
})
export class NodeListComponent {
  private gpuDataService = inject(GpuDataServiceMock);

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, {initialValue: []});

  public searchText = signal('');
  public statusFilter = signal<string | null>(null);

  public allNodes: Signal<FlatNode[]> = computed(() => {
    const nodes: FlatNode[] = [];
    for (const cluster of this.clusters()) {
      for (const nodeName in cluster.nodes) {
        const metrics = cluster.nodes[nodeName];

        // 4. Calcul de la classe CSS ici (exécuté seulement quand les données changent)
        let cssClass = 'usage-low';
        if (metrics.gpu_usage_percent > 90) cssClass = 'usage-high';
        else if (metrics.gpu_usage_percent > 70) cssClass = 'usage-medium';

        const statusSlug = (metrics.status || 'En ligne').toLowerCase().replace(' ', '-');
        const statusClass = `status-${statusSlug}`;

        nodes.push({
          clusterName: cluster.cluster_name,
          nodeName: nodeName,
          metrics: metrics,
          usageClass: cssClass, // On stocke le résultat
          statusClass: statusClass // <--- On stocke la classe
        });
      }
    }
    return nodes;
  });

  public filteredNodes = computed(() => {
    let data = this.allNodes();
    const search = this.searchText().toLowerCase();
    const status = this.statusFilter();

    if (status) {
      data = data.filter(n => n.metrics.status === status);
    }

    if (search) {
      data = data.filter(n =>
        n.nodeName.toLowerCase().includes(search) ||
        n.clusterName.toLowerCase().includes(search)
      );
    }

    return data;
  });

  // Pour remplir le dropdown de statut automatiquement
  public availableStatuses = computed(() => {
    const statuses = new Set(this.allNodes().map(n => n.metrics.status));
    return Array.from(statuses).sort();
  });

  public displayedColumns: string[] = [
    'clusterName',
    'nodeName',
    'owner',
    'status',
    'physical_gpus',
    'virtual_gpus',
    'used_gpus',
    'memory',
    'cpu',
    'gpu_usage_percent'
  ];
}
