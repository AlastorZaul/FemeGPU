import {Component, computed, effect, inject, Signal, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {ClusterApiResponse, ReservationDetail} from '../../models/gpu.model';
import {AiModel} from '../../models/aimodel.model';
import {MatChipsModule} from '@angular/material/chips';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltip} from '@angular/material/tooltip';
import {GpuDataService} from '../../services/gpu-data.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {
  ReservationActionsModalComponent,
  ReservationActionsModalData
} from '../../components/reservation-actions-modal/reservation-actions-modal.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';

export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
  owner: string;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatIconModule,
    MatChipsModule,
    MatSlideToggleModule, MatTooltip, MatIconButton,
    MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, MatButton
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent {
  private gpuDataService = inject(GpuDataService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });
  private models: Signal<AiModel[]> = toSignal(this.gpuDataService.getAvailableModels(), {initialValue: []});

  public searchText = signal('');
  public selectedNodeFilter = signal<string | null>(null);

  public displayedColumns: string[] = [
    'status', 'owner', 'clusterName', 'nodeName', 'namespace', 'application',
    'gpusRequested', 'memoryRequest', 'cpuRequest', 'createdAt', 'actions'
  ];

  constructor() {
    // Debug : Vérifions si les données arrivent jusqu'au composant
    effect(() => {
      console.log('Component View - Clusters reçus:', this.clusters().length);
      console.log('Component View - Réservations calculées:', this.allReservations().length);
    });
  }

  // 1. Mise à plat de toutes les réservations
  public allReservations: Signal<FlatReservation[]> = computed(() => {
    const flatList: FlatReservation[] = [];
    const allClusters = this.clusters();

    for (const cluster of allClusters) {
      if (cluster.nodes) {
        for (const nodeName in cluster.nodes) {
          const node = cluster.nodes[nodeName];
          if (node.reservations && node.reservations.length > 0) {
            for (const res of node.reservations) {
              flatList.push({
                ...res,
                clusterName: cluster.cluster_name,
                nodeName: nodeName,
                owner: node.owner
              });
            }
          }
        }
      }
    }
    return flatList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // 2. Filtrage SANS restriction de propriétaire
  public filteredReservations = computed(() => {
    let data = this.allReservations();
    const search = this.searchText().toLowerCase();
    const nodeFilter = this.selectedNodeFilter();

    // --- ICI : J'ai supprimé le bloc "if (currentUser...)" qui cachait vos données ---

    if (nodeFilter) {
      data = data.filter(res => res.nodeName === nodeFilter);
    }

    if (search) {
      data = data.filter(res =>
        res.namespace.toLowerCase().includes(search) ||
        res.application.toLowerCase().includes(search) ||
        (res.owner && res.owner.toLowerCase().includes(search))
      );
    }
    return data;
  });

  public allNodes: Signal<{ name: string, cluster: string }[]> = computed(() => {
    const nodes: { name: string, cluster: string }[] = [];
    const allClusters = this.clusters();
    for (const cluster of allClusters) {
      if (cluster.nodes) {
        for (const nodeName in cluster.nodes) {
          nodes.push({name: nodeName, cluster: cluster.cluster_name});
        }
      }
    }
    return nodes;
  });

  // Garder la sécurité uniquement sur les clics (boutons d'action)
  private checkNodeAccess(clusterName: string, nodeName: string): boolean {
    const cluster = this.clusters().find(c => c.cluster_name === clusterName);
    const node = cluster?.nodes[nodeName];
    if (!node) return false;

    const isBlocked = node.status?.toLowerCase().includes('block') || node.status?.toLowerCase().includes('bloqué');
    if (isBlocked) {
      const currentUser = this.authService.currentUser();
      const isOwner = currentUser?.username === node.owner;
      const isAdmin = currentUser?.roles.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        this.snackBar.open(
          `⛔ Action refusée : Le nœud est bloqué.`,
          'Fermer', {duration: 5000, panelClass: ['error-snackbar']}
        );
        return false;
      }
    }
    return true;
  }

  // --- Méthodes d'action ---
  onToggleStatus(reservation: FlatReservation) {
    if (!this.checkNodeAccess(reservation.clusterName, reservation.nodeName)) return;
    this.gpuDataService.toggleReservationStatus(reservation).subscribe();
  }

  openActionsModal(reservation: FlatReservation): void {
    if (!this.checkNodeAccess(reservation.clusterName, reservation.nodeName)) return;

    const sameClusterNodes = this.allNodes().filter(node => node.cluster === reservation.clusterName);
    const dialogData: ReservationActionsModalData = {
      reservation: reservation,
      allNodes: sameClusterNodes,
      availableModels: this.models()
    };
    const dialogRef = this.dialog.open(ReservationActionsModalComponent, {data: dialogData, width: '500px'});

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.action === 'deploy') this.onDeployReservation(reservation);
      if (result.action === 'delete') this.onDeleteReservation(reservation);
      else if (result.action === 'move' && result.targetNodeName) this.onMoveReservation(reservation, result.targetNodeName);
      else if (result.action === 'updateModel') this.onUpdateModel(reservation, result.modelName || '');
    });
  }

  onUpdateModel(reservation: FlatReservation, newModelName: string) {
    this.gpuDataService.updateReservationModel(reservation, newModelName).subscribe(
      res => this.snackBar.open(res.message, 'OK', {duration: 3000})
    );
  }
  onMoveReservation(reservation: FlatReservation, targetNodeName: string) {
    this.gpuDataService.moveReservationToNode(reservation, targetNodeName).subscribe(
      res => this.snackBar.open(res.message, 'Fermer')
    );
  }
  onDeleteReservation(reservation: FlatReservation) {
    this.gpuDataService.deleteReservation(reservation).subscribe(
      res => this.snackBar.open(res.message, 'Fermer')
    );
  }
  onDeployReservation(reservation: FlatReservation) {
    this.snackBar.open(`🚀 Déploiement du namespace ${reservation.namespace} lancé !`, 'Fermer', {duration: 3000});
    this.gpuDataService.deployNamespace(reservation).subscribe();
  }

  // Bouton de secours (vous pourrez le retirer plus tard)
  resetMockData() {
    if (confirm('Réinitialiser le Mock ?')) {
      localStorage.removeItem('gpuFarmMockData');
      window.location.reload();
    }
  }
}
