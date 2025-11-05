import {Component, computed, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {ClusterApiResponse, ReservationDetail} from '../../models/gpu.model';
import {MatChipsModule} from '@angular/material/chips';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltip} from '@angular/material/tooltip';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatIconButton} from '@angular/material/button';
// NOUVEAUX IMPORTS
import {MatDialog} from '@angular/material/dialog';
import {
  ReservationActionsModalComponent,
  ReservationActionsModalData,
  ReservationActionsModalResult
} from '../../components/reservation-actions-modal/reservation-actions-modal.component';

// IMPORTS DE MENU (ils seront retirés de l'array 'imports' ci-dessous)
// import {MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';


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
    MatSlideToggleModule, MatTooltip, MatIconButton,
    // MatMenuTrigger, MatMenu, MatMenuItem, MatMenuContent, // <- Supprimés
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent {
  private gpuDataService = inject(GpuDataServiceMock);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog); // NOUVELLE INJECTION

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  public allReservations: Signal<FlatReservation[]> = computed(() => {
    // ... (votre logique computed existante reste inchangée)
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

  public allNodes: Signal<{ name: string, cluster: string }[]> = computed(() => {
    // ... (votre logique computed existante reste inchangée)
    const nodes: { name: string, cluster: string }[] = [];
    for (const cluster of this.clusters()) {
      for (const nodeName in cluster.nodes) {
        nodes.push({ name: nodeName, cluster: cluster.cluster_name });
      }
    }
    return nodes;
  });

  public displayedColumns: string[] = [
    'status', 'clusterName', 'nodeName', 'namespace', 'application',
    'gpusRequested', 'memoryRequest', 'cpuRequest', 'createdAt', 'actions'
  ];

  onToggleStatus(reservation: FlatReservation) {
    // ... (votre méthode existante reste inchangée)
    console.log(`Changement de statut pour ${reservation.namespace}...`);
    this.gpuDataService.toggleReservationStatus(reservation).subscribe({
      next: (res) => console.log(`Statut changé à: ${res.newState}`),
      error: (err) => console.error("Erreur lors du changement de statut", err)
    });
  }

  // **** NOUVELLE MÉTHODE POUR OUVRIR LA MODALE ****
  openActionsModal(reservation: FlatReservation): void {
    const dialogData: ReservationActionsModalData = {
      reservation: reservation,
      allNodes: this.allNodes() // Passe la liste des nœuds à la modale
    };

    const dialogRef = this.dialog.open<ReservationActionsModalComponent, ReservationActionsModalData, ReservationActionsModalResult>(
      ReservationActionsModalComponent,
      {
        data: dialogData,
        width: '450px' // Définissez une largeur appropriée
      }
    );

    // Gérer le résultat à la fermeture de la modale
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return; // L'utilisateur a annulé
      }

      if (result.action === 'delete') {
        // L'utilisateur a cliqué 'Supprimer' dans la modale
        this.onDeleteReservation(reservation);
      } else if (result.action === 'move' && result.targetNodeName) {
        // L'utilisateur a choisi un nœud pour le déplacement
        this.onMoveReservation(reservation, result.targetNodeName);
      }
    });
  }


  onMoveReservation(reservation: FlatReservation, targetNodeName: string) {
    // ... (votre méthode existante reste inchangée)
    this.gpuDataService.moveReservationToNode(reservation, targetNodeName).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message, 'Fermer');
        } else {
          this.snackBar.open(`Erreur: ${res.message}`, 'Fermer', {
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (err) => {
        this.snackBar.open(`Erreur: ${err.message || 'Échec du déplacement'}`, 'Fermer', {
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onDeleteReservation(reservation: FlatReservation) {
    /*
    // 1. Demander confirmation à l'utilisateur
    // NOUS ALLONS SUPPRIMER CETTE PARTIE, la modale sert de confirmation
    if (!confirm(`Voulez-vous vraiment supprimer la réservation pour ${reservation.namespace} sur ${reservation.nodeName} ?`)) {
      return; // L'utilisateur a annulé
    }
    */

    // 2. Appeler la nouvelle méthode du service mock
    this.gpuDataService.deleteReservation(reservation).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message, 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open(`Erreur: ${res.message}`, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (err) => {
        this.snackBar.open(`Erreur inattendue: ${err.message || 'Échec de la suppression'}`, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
