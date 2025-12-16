import {Component, computed, inject, signal, Signal} from '@angular/core';
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
import {AiModel} from '../../models/aimodel.model';
import {MatDialog} from '@angular/material/dialog';
import {
  ReservationActionsModalComponent,
  ReservationActionsModalData,
  ReservationActionsModalResult
} from '../../components/reservation-actions-modal/reservation-actions-modal.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';

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
    MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent {
  private gpuDataService = inject(GpuDataServiceMock);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog); // NOUVELLE INJECTION

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });
  private models: Signal<AiModel[]> = toSignal(this.gpuDataService.getAvailableModels(), {initialValue: []});

  public searchText = signal('');
  public selectedNodeFilter = signal<string | null>(null);

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

  public filteredReservations = computed(() => {
    let data = this.allReservations();
    const search = this.searchText().toLowerCase();
    const nodeFilter = this.selectedNodeFilter();
    // Filtre par Noeud (Select)
    if (nodeFilter) {
      data = data.filter(res => res.nodeName === nodeFilter);
    }
    // Filtre par Texte (Namespace ou Application)
    if (search) {
      data = data.filter(res =>
        res.namespace.toLowerCase().includes(search) ||
        res.application.toLowerCase().includes(search)
      );
    }
    return data;
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
    // --- MODIFICATION ICI : On filtre pour ne garder que les nœuds du MÊME cluster ---
    const sameClusterNodes = this.allNodes().filter(node => node.cluster === reservation.clusterName);

    const dialogData: ReservationActionsModalData = {
      reservation: reservation,
      allNodes: sameClusterNodes,
      availableModels: this.models()// On passe la liste filtrée
    };

    const dialogRef = this.dialog.open<ReservationActionsModalComponent, ReservationActionsModalData, ReservationActionsModalResult>(
      ReservationActionsModalComponent,
      {
        data: dialogData,
        width: '500px' // Un peu plus large pour accommoder le select
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'delete') {
        this.onDeleteReservation(reservation);
      } else if (result.action === 'move' && result.targetNodeName) {
        this.onMoveReservation(reservation, result.targetNodeName);
      }
      // 3. Gérer la nouvelle action 'updateModel'
      else if (result.action === 'updateModel') {
        this.onUpdateModel(reservation, result.modelName || '');
      }
    });
  }

  onUpdateModel(reservation: FlatReservation, newModelName: string) {
    this.gpuDataService.updateReservationModel(reservation, newModelName).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(`Modèle mis à jour : ${newModelName || 'Aucun'}`, 'OK', {duration: 3000});
        } else {
          this.snackBar.open(`Erreur : ${res.message}`, 'Fermer');
        }
      },
      error: (err) => this.snackBar.open('Erreur lors de la mise à jour', 'Fermer')
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
