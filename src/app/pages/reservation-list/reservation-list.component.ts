import {Component, computed, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {ClusterApiResponse, ReservationDetail} from '../../models/gpu.model'; // Importer ReservationDetail
import {MatChipsModule} from '@angular/material/chips';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
// S'assurer d'utiliser le bon service
import {GpuDataService} from '../../services/gpu-data.service';
// import {GpuDataServiceMock, FlatReservation} from '../../services/gpu-data-mock.service';
import {MatTooltip} from '@angular/material/tooltip';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';

// Définir l'interface FlatReservation ici si elle n'est pas exportée du service mock
// Elle doit correspondre à ReservationDetail + cluster/node
export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatIconModule,
    MatChipsModule,
    MatSlideToggleModule, MatTooltip,
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent {
  // S'assurer d'injecter le bon service
  private gpuDataService = inject(GpuDataServiceMock);

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

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
    return flatList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // AJOUTER LES NOUVELLES COLONNES
  public displayedColumns: string[] = [
    'status', 'clusterName', 'nodeName', 'namespace', 'application',
    'gpusRequested', 'memoryRequest', 'cpuRequest', 'createdAt'
  ];

  // La méthode onToggleStatus n'est pas dans GpuDataService,
  // elle est dans GpuDataServiceMock. Vous devrez l'implémenter
  // dans GpuDataService si vous passez au backend réel.
  onToggleStatus(reservation: FlatReservation) {
    console.log(`Changement de statut pour ${reservation.namespace}...`);
    this.gpuDataService.toggleReservationStatus(reservation).subscribe({
      next: (res) => console.log(`Statut changé à: ${res.newState}`),
      error: (err) => console.error("Erreur lors du changement de statut", err)
    });
  }
}
