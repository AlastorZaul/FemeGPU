import {Component, computed, inject, Signal, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTooltipModule} from '@angular/material/tooltip';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

// CORRECTION : Import du service abstrait
import {GpuDataService} from '../../services/gpu-data.service';
import {ClusterApiResponse, ReservationDetail} from '../../models/gpu.model';

export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

export interface ApplicationGroup {
  applicationName: string;
  totalGpus: number;
  namespaces: {
    namespace: string;
    clusterName: string;
    nodeName: string;
    isActive: boolean;
    gpusRequested: number;
    modelName?: string;
  }[];
}

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatIconModule, MatExpansionModule, MatTooltipModule,
    FormsModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.scss']
})
export class ApplicationListComponent {
  // CORRECTION : Injection via la classe abstraite
  private gpuDataService = inject(GpuDataService);

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  public searchText = signal('');

  public allReservations: Signal<FlatReservation[]> = computed(() => {
    const flatList: FlatReservation[] = [];
    const allClusters = this.clusters();
    for (const cluster of allClusters) {
      for (const nodeName in cluster.nodes) {
        const node = cluster.nodes[nodeName];
        if (node.reservations && node.reservations.length > 0) {
          for (const res of node.reservations) {
            flatList.push({
              ...res,
              clusterName: cluster.cluster_name,
              nodeName: nodeName
            });
          }
        }
      }
    }
    return flatList;
  });

  public applicationsList: Signal<ApplicationGroup[]> = computed(() => {
    const allRes = this.allReservations();
    const search = this.searchText().toLowerCase();

    const groups = allRes.reduce((acc, res) => {
      const appName = res.application;
      let group = acc.get(appName);

      if (!group) {
        group = {
          applicationName: appName,
          totalGpus: 0,
          namespaces: []
        };
        acc.set(appName, group);
      }

      group.totalGpus += res.gpusRequested;
      group.namespaces.push({
        namespace: res.namespace,
        clusterName: res.clusterName,
        nodeName: res.nodeName,
        isActive: res.isActive,
        gpusRequested: res.gpusRequested,
        modelName: res.modelName,
      });

      return acc;
    }, new Map<string, ApplicationGroup>());

    let result = Array.from(groups.values());

    if (search) {
      result = result.filter(g => g.applicationName.toLowerCase().includes(search));
    }

    return result.sort((a, b) => a.applicationName.localeCompare(b.applicationName));
  });
}
