import {Component, computed, inject, Signal, signal, WritableSignal} from '@angular/core';
import {CommonModule, KeyValue} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {RouterLink} from '@angular/router';
import {CustomGaugeComponent} from '../../components/custom-gauge/custom-gauge.component';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatProgressBarModule,
    MatDividerModule, MatFormFieldModule, MatSelectModule, RouterLink, CustomGaugeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private gpuDataService = inject(GpuDataServiceMock);

  private allClusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  public selectedClusterNames: WritableSignal<string[]> = signal([]);

  public clusterNames: Signal<string[]> = computed(() => {
    return this.allClusters().map(c => c.cluster_name);
  });

  public filteredClusters: Signal<ClusterApiResponse[]> = computed(() => {
    const all = this.allClusters();
    const selected = this.selectedClusterNames();
    if (selected.length === 0) {
      return all;
    }
    return all.filter(cluster => selected.includes(cluster.cluster_name));
  });

  getUsageClass(usagePercent: number): string {
    if (usagePercent > 90) return 'usage-high';
    if (usagePercent > 70) return 'usage-medium';
    return 'usage-low';
  }

  public getUsageStatusText(usagePercent: number): string {
    if (usagePercent > 90) return 'Utilisation Critique';
    if (usagePercent > 70) return 'Utilisation Élevée';
    return 'Utilisation Normale';
  }

  originalOrder = (a: KeyValue<string,NodeMetrics>, b: KeyValue<string,NodeMetrics>): number => 0;
}
