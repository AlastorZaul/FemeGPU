import {ChangeDetectionStrategy, Component, computed, inject, Signal, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';

import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
// CORRECTION : Import du service abstrait
import {GpuDataService} from '../../services/gpu-data.service';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';

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
  imports: [CommonModule, MatTableModule, MatCardModule, MatProgressBarModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, MatIconButton],
  templateUrl: './node-list.component.html',
  styleUrls: ['./node-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodeListComponent {
  // CORRECTION : Injection via la classe abstraite
  private gpuDataService = inject(GpuDataService);

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, {initialValue: []});

  public searchText = signal('');
  public statusFilter = signal<string | null>(null);

  public allNodes: Signal<FlatNode[]> = computed(() => {
    const nodes: FlatNode[] = [];
    for (const cluster of this.clusters()) {
      for (const nodeName in cluster.nodes) {
        const metrics = cluster.nodes[nodeName];

        let cssClass = 'usage-low';
        if (metrics.gpu_usage_percent > 90) cssClass = 'usage-high';
        else if (metrics.gpu_usage_percent > 70) cssClass = 'usage-medium';

        const statusSlug = (metrics.status || 'En ligne').toLowerCase().replace(' ', '-');
        const statusClass = `status-${statusSlug}`;

        nodes.push({
          clusterName: cluster.cluster_name,
          nodeName: nodeName,
          metrics: metrics,
          usageClass: cssClass,
          statusClass: statusClass
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

  public availableStatuses = computed(() => {
    const statuses = new Set(this.allNodes().map(n => n.metrics.status));
    return Array.from(statuses).sort();
  });

  toggleDrain(node: FlatNode) {
    // Optimiste ou simple appel (ici simple appel avec rechargement via le polling du service)
    this.gpuDataService.toggleNodeDrain(node.nodeName).subscribe({
      next: (res) => console.log(res.message),
      error: (err) => console.error('Erreur drain', err)
    });
  }

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
    'gpu_usage_percent',
    'actions'
  ];
}
