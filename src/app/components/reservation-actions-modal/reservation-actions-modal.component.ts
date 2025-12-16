import {Component, computed, Inject, signal} from '@angular/core'; // Ajout de signal
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {FlatReservation} from '../../services/gpu-data-mock.service';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatDividerModule} from '@angular/material/divider';
// Nouveaux imports pour le select
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {AiModel} from '../../models/aimodel.model'; // Assurez-vous que ce chemin est bon

export interface ReservationActionsModalData {
  reservation: FlatReservation;
  allNodes: { name: string, cluster: string }[];
  availableModels: AiModel[]; // <--- NOUVELLE DONNÉE REQUISE
}

export interface ReservationActionsModalResult {
  action: 'delete' | 'move' | 'updateModel'; // <--- NOUVELLE ACTION
  targetNodeName?: string;
  modelName?: string; // <--- POUR LE RETOUR DE DONNÉE
}

@Component({
  selector: 'app-reservation-actions-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule,
    MatFormFieldModule, MatSelectModule, FormsModule // <--- Ajout des modules
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

      <div class="model-section">
        <h3>Configuration du Modèle</h3>
        <div class="model-form">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Modèle associé</mat-label>
            <mat-select [(ngModel)]="selectedModel" placeholder="Aucun modèle">
              <mat-option [value]="null">-- Aucun --</mat-option>
              @for (model of data.availableModels; track model.id) {
                <mat-option [value]="model.name">
                  {{ model.name }} <span class="vram-hint">({{ model.vramRequiredGb }} Go)</span>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button color="primary"
                  [disabled]="selectedModel() === data.reservation.modelName"
                  (click)="onUpdateModel()">
            Enregistrer
          </button>
        </div>
      </div>

      <mat-divider></mat-divider>

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

    <div mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Fermer</button>
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
    .modal-content {
      padding-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .model-section {
      background-color: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .model-section h3 {
      margin-top: 0;
      font-size: 0.95rem;
      color: #475569;
    }

    .model-form {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .vram-hint {
      font-size: 0.8em;
      color: gray;
      margin-left: 5px;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: flex-start;
      margin-top: 10px;
    }

    .menu-header {
      padding: 8px 16px;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class ReservationActionsModalComponent {

  // Signal pour gérer la sélection du modèle
  selectedModel = signal<string | null>(null);

  availableNodesToMove = computed(() => {
    const currentNodeName = this.data.reservation.nodeName;
    return this.data.allNodes.filter(node => node.name !== currentNodeName);
  });

  constructor(
    public dialogRef: MatDialogRef<ReservationActionsModalComponent, ReservationActionsModalResult>,
    @Inject(MAT_DIALOG_DATA) public data: ReservationActionsModalData
  ) {
    // Initialiser la sélection avec la valeur actuelle de la réservation
    this.selectedModel.set(this.data.reservation.modelName || null);
  }

  onUpdateModel(): void {
    const val = this.selectedModel();
    if (val !== undefined) {
      this.dialogRef.close({
        action: 'updateModel',
        modelName: val || '' // Si null, on envoie chaine vide pour effacer
      });
    }
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete' });
  }

  onMove(targetNodeName: string): void {
    this.dialogRef.close({ action: 'move', targetNodeName: targetNodeName });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
