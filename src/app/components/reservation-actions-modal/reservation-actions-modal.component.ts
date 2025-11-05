import {Component, computed, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {FlatReservation} from '../../services/gpu-data-mock.service'; // Ajustez le chemin si nécessaire
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu'; // Pour le sous-menu de déplacement
import {MatDividerModule} from '@angular/material/divider';

/**
 * Données attendues par la modale
 */
export interface ReservationActionsModalData {
  reservation: FlatReservation;
  allNodes: { name: string, cluster: string }[];
}

/**
 * Résultat renvoyé par la modale
 */
export interface ReservationActionsModalResult {
  action: 'delete' | 'move';
  targetNodeName?: string; // Seulement pour 'move'
}

@Component({
  selector: 'app-reservation-actions-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule, // Important pour le sous-menu
    MatDividerModule
  ],
  template: `
    <h1 mat-dialog-title>
      Actions pour {{ data.reservation.namespace }}
    </h1>
    <mat-divider></mat-divider>

    <div mat-dialog-content class="modal-content">
      <p>
        <strong>Application :</strong> {{ data.reservation.application }} <br>
        <strong>Nœud Actuel :</strong> {{ data.reservation.nodeName }} ({{ data.reservation.clusterName }})
      </p>

      <div class="action-buttons">

        <button mat-flat-button color="primary"
                [matMenuTriggerFor]="moveSubMenu"
                [disabled]="availableNodesToMove().length === 0">
          <mat-icon>move_item</mat-icon>
          <span>Déplacer vers...</span>
        </button>

        <button mat-flat-button color="warn" (click)="onDelete()">
          <mat-icon>delete</mat-icon>
          <span>Supprimer</span>
        </button>
      </div>

    </div>

    <mat-divider></mat-divider>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Annuler</button>
    </div>

    <mat-menu #moveSubMenu="matMenu">
      <ng-template matMenuContent>
        <div class="menu-header">Choisir un nœud :</div>
        @for (node of availableNodesToMove(); track node.name) {
          <button mat-menu-item (click)="onMove(node.name)">
            <mat-icon>dns</mat-icon>
            <span>{{ node.name }} ({{node.cluster}})</span>
          </button>
        }
      </ng-template>
    </mat-menu>
  `,
  styles: [`
    .modal-content { padding-top: 20px; }
    .action-buttons {
      display: flex;
      gap: 16px;
      padding: 20px 0;
    }
    .menu-header {
      padding: 8px 16px;
      font-weight: bold;
      color: rgba(0,0,0,0.6);
    }
  `]
})
export class ReservationActionsModalComponent {

  // Signal pour filtrer les nœuds disponibles
  availableNodesToMove = computed(() => {
    const currentNodeName = this.data.reservation.nodeName;
    return this.data.allNodes.filter(node => node.name !== currentNodeName);
  });

  constructor(
    public dialogRef: MatDialogRef<ReservationActionsModalComponent, ReservationActionsModalResult>,
    @Inject(MAT_DIALOG_DATA) public data: ReservationActionsModalData
  ) {}

  /** L'utilisateur clique sur 'Supprimer' */
  onDelete(): void {
    // Ferme la modale et renvoie l'action 'delete'
    this.dialogRef.close({ action: 'delete' });
  }

  /** L'utilisateur choisit un nœud de destination */
  onMove(targetNodeName: string): void {
    // Ferme la modale et renvoie l'action 'move' et la cible
    this.dialogRef.close({ action: 'move', targetNodeName: targetNodeName });
  }

  /** L'utilisateur clique sur 'Annuler' en bas */
  onClose(): void {
    this.dialogRef.close(); // Ferme sans renvoyer de résultat
  }
}
