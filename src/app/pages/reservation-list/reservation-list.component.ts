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
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatIconButton} from '@angular/material/button';

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
    MatSlideToggleModule, MatTooltip, MatMenuTrigger, MatMenu, MatMenuItem, MatMenuContent, MatIconButton,
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent {
  // S'assurer d'injecter le bon service
  private gpuDataService = inject(GpuDataServiceMock);
  private snackBar = inject(MatSnackBar); // NOUVEAU

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

  // NOUVEAU : Obtenir une liste plate de tous les nœuds pour le menu
  public allNodes: Signal<{ name: string, cluster: string }[]> = computed(() => {
    const nodes: { name: string, cluster: string }[] = [];
    for (const cluster of this.clusters()) {
      for (const nodeName in cluster.nodes) {
        nodes.push({ name: nodeName, cluster: cluster.cluster_name });
      }
    }
    return nodes;
  });

  // AJOUTER LES NOUVELLES COLONNES
  public displayedColumns: string[] = [
    'status', 'clusterName', 'nodeName', 'namespace', 'application',
    'gpusRequested', 'memoryRequest', 'cpuRequest', 'createdAt', 'actions'
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

  // **** NOUVELLE MÉTHODE ****
  // Appelée lors du clic sur un nœud dans le menu "Déplacer"
  onMoveReservation(reservation: FlatReservation, targetNodeName: string) {
    this.gpuDataService.moveReservationToNode(reservation, targetNodeName).subscribe({
      next: (res) => {
        if (res.success) {
          // MODIFICATION : 'duration' supprimé
          this.snackBar.open(res.message, 'Fermer');
        } else {
          // MODIFICATION : 'duration' supprimé
          this.snackBar.open(`Erreur: ${res.message}`, 'Fermer', {
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (err) => {
        // MODIFICATION : 'duration' supprimé
        this.snackBar.open(`Erreur: ${err.message || 'Échec du déplacement'}`, 'Fermer', {
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onDeleteReservation(reservation: FlatReservation) {

    // 1. Demander confirmation à l'utilisateur
    if (!confirm(`Voulez-vous vraiment supprimer la réservation pour ${reservation.namespace} sur ${reservation.nodeName} ?`)) {
      return; // L'utilisateur a annulé
    }

    // 2. Appeler la nouvelle méthode du service mock
    this.gpuDataService.deleteReservation(reservation).subscribe({
      next: (res) => {
        if (res.success) {
          // Afficher une notification de succès
          this.snackBar.open(res.message, 'Fermer', { duration: 3000 });
        } else {
          // Afficher une notification d'erreur (si la réservation n'est pas trouvée, par ex.)
          this.snackBar.open(`Erreur: ${res.message}`, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (err) => {
        // En cas d'erreur inattendue
        this.snackBar.open(`Erreur inattendue: ${err.message || 'Échec de la suppression'}`, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
