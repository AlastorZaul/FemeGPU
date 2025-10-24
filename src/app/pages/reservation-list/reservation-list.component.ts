import { Component, computed, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { GpuDataService } from '../../services/gpu-data.service';
import { ClusterApiResponse, ReservationDetail } from '../../models/gpu.model';

// Interface pour notre tableau "aplati"
export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent {
  private gpuDataService = inject(GpuDataService);

  // 1. Obtenir les données brutes des clusters
  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  // 2. Transformer les données en une liste plate de réservations
  public allReservations: Signal<FlatReservation[]> = computed(() => {
    const flatList: FlatReservation[] = [];
    const allClusters = this.clusters();

    for (const cluster of allClusters) {
      for (const nodeName in cluster.nodes) {
        const node = cluster.nodes[nodeName];
        if (node.reservations && node.reservations.length > 0) {
          for (const res of node.reservations) {
            flatList.push({
              ...res, // Copie les propriétés de ReservationDetail
              clusterName: cluster.cluster_name,
              nodeName: nodeName
            });
          }
        }
      }
    }
    // Trier par date de création, la plus récente en premier
    return flatList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // 3. Colonnes à afficher dans le tableau
  public displayedColumns: string[] = ['clusterName', 'nodeName', 'namespace', 'application', 'gpusRequested', 'createdAt'];
}
