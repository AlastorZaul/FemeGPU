import {Component, computed, inject, signal, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {ClusterApiResponse, ReservationDetail} from '../../models/gpu.model';
import {AiModel} from '../../models/aimodel.model'
import {MatChipsModule} from '@angular/material/chips';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltip} from '@angular/material/tooltip';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatIconButton} from '@angular/material/button';
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
import {AuthService} from '../../services/auth.service'; // <--- 1. IMPORT AUTH SERVICE

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
  private dialog = inject(MatDialog);
  private authService = inject(AuthService); // <--- 2. INJECTION

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });
  private models: Signal<AiModel[]> = toSignal(this.gpuDataService.getAvailableModels(), {initialValue: []});

  public searchText = signal('');
  public selectedNodeFilter = signal<string | null>(null);

  // ... (allReservations et filteredReservations restent inchangés) ...
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

  public filteredReservations = computed(() => {
    let data = this.allReservations();
    const search = this.searchText().toLowerCase();
    const nodeFilter = this.selectedNodeFilter();
    if (nodeFilter) {
      data = data.filter(res => res.nodeName === nodeFilter);
    }
    if (search) {
      data = data.filter(res =>
        res.namespace.toLowerCase().includes(search) ||
        res.application.toLowerCase().includes(search)
      );
    }
    return data;
  });

  public allNodes: Signal<{ name: string, cluster: string }[]> = computed(() => {
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

  // --- 3. NOUVELLE MÉTHODE DE VÉRIFICATION ---
  /**
   * Vérifie si l'utilisateur a le droit de modifier le contenu de ce nœud.
   * Retourne TRUE si autorisé, FALSE (avec snackbar) sinon.
   */
  private checkNodeAccess(clusterName: string, nodeName: string): boolean {
    const cluster = this.clusters().find(c => c.cluster_name === clusterName);
    const node = cluster?.nodes[nodeName];

    if (!node) return false;

    // Détection du statut Bloqué
    const isBlocked = node.status.toLowerCase().includes('block') ||
      node.status.toLowerCase().includes('bloqué');

    if (isBlocked) {
      const currentUser = this.authService.currentUser();

      // VÉRIFICATION DES DROITS :
      // Autorisé si : C'est le Propriétaire OU C'est un Admin
      const isOwner = currentUser?.username === node.owner;
      const isAdmin = currentUser?.roles.includes('ADMIN'); // <--- AJOUT ICI

      if (!isOwner && !isAdmin) { // <--- CONDITION MODIFIÉE
        this.snackBar.open(
          `⛔ Action refusée : Le nœud est bloqué par "${node.owner}". Seuls le propriétaire ou un administrateur peuvent intervenir.`,
          'Fermer',
          {duration: 5000, panelClass: ['error-snackbar']}
        );
        return false;
      }
    }
    return true;
  }

  // --- 4. SÉCURISATION DU TOGGLE STATUS ---
  onToggleStatus(reservation: FlatReservation) {
    // Vérification avant action
    if (!this.checkNodeAccess(reservation.clusterName, reservation.nodeName)) {
      // On force le rafraîchissement de l'UI pour remettre le toggle à sa place précédente si besoin
      // (En Angular natif avec Signal, cela se fera au prochain cycle,
      // mais idéalement le toggle ne devrait même pas bouger visuellement)
      return;
    }

    console.log(`Changement de statut pour ${reservation.namespace}...`);
    this.gpuDataService.toggleReservationStatus(reservation).subscribe({
      next: (res) => console.log(`Statut changé à: ${res.newState}`),
      error: (err) => console.error("Erreur lors du changement de statut", err)
    });
  }

  // --- 5. SÉCURISATION DE LA MODALE D'ACTIONS ---
  openActionsModal(reservation: FlatReservation): void {
    // Vérification avant ouverture
    if (!this.checkNodeAccess(reservation.clusterName, reservation.nodeName)) {
      return;
    }

    const sameClusterNodes = this.allNodes().filter(node => node.cluster === reservation.clusterName);

    const dialogData: ReservationActionsModalData = {
      reservation: reservation,
      allNodes: sameClusterNodes,
      availableModels: this.models()
    };

    const dialogRef = this.dialog.open<ReservationActionsModalComponent, ReservationActionsModalData, ReservationActionsModalResult>(
      ReservationActionsModalComponent,
      {
        data: dialogData,
        width: '500px'
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'delete') {
        this.onDeleteReservation(reservation);
      } else if (result.action === 'move' && result.targetNodeName) {
        this.onMoveReservation(reservation, result.targetNodeName);
      }
      else if (result.action === 'updateModel') {
        this.onUpdateModel(reservation, result.modelName || '');
      }
    });
  }

  // ... (Les méthodes onUpdateModel, onMoveReservation, onDeleteReservation restent inchangées) ...

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
    this.gpuDataService.moveReservationToNode(reservation, targetNodeName).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message, 'Fermer');
        } else {
          this.snackBar.open(`Erreur: ${res.message}`, 'Fermer');
        }
      },
      error: (err) => this.snackBar.open(`Erreur: ${err.message}`, 'Fermer')
    });
  }

  onDeleteReservation(reservation: FlatReservation) {
    this.gpuDataService.deleteReservation(reservation).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message, 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open(`Erreur: ${res.message}`, 'Fermer', {duration: 5000});
        }
      },
      error: (err) => this.snackBar.open(`Erreur inattendue: ${err.message}`, 'Fermer')
    });
  }
}
