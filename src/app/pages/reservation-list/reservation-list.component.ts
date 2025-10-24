import {Component, computed, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {ClusterApiResponse} from '../../models/gpu.model';
import {MatChipsModule} from '@angular/material/chips';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {FlatReservation, GpuDataServiceMock} from '../../services/gpu-data-mock.service';
import {MatTooltip} from '@angular/material/tooltip'; // <-- IMPORTER

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatIconModule,
    MatChipsModule,
    MatSlideToggleModule, MatTooltip, // <-- AJOUTER AUX IMPORTS
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent {
  private gpuDataService = inject(GpuDataServiceMock);

  // ... (propriété 'clusters' inchangée)
  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  // ... (propriété 'allReservations' inchangée)
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

  // ... (propriété 'displayedColumns' inchangée)
  public displayedColumns: string[] = [
    'status', 'clusterName', 'nodeName', 'namespace', 'application', 'gpusRequested', 'createdAt'
  ];

  // **** NOUVELLE MÉTHODE ****
  // Appelée lors du clic sur l'interrupteur
  onToggleStatus(reservation: FlatReservation) {
    // Affiche le changement dans la console, le service s'occupe de la sauvegarde
    // Le 'timer' du service rafraîchira l'UI
    console.log(`Changement de statut pour ${reservation.namespace}...`);
    this.gpuDataService.toggleReservationStatus(reservation).subscribe({
      next: (res) => console.log(`Statut changé à: ${res.newState}`),
      error: (err) => console.error("Erreur lors du changement de statut", err)
    });
  }
}
