import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatDividerModule} from '@angular/material/divider';
import {FormsModule} from '@angular/forms';
import {FlatReservation} from '../../pages/reservation-list/reservation-list.component'; // Ajustez le chemin si besoin
import {AiModel} from '../../models/aimodel.model';

export interface ReservationActionsModalData {
  reservation: FlatReservation;
  allNodes: { name: string, cluster: string }[];
  availableModels: AiModel[];
}

@Component({
  selector: 'app-reservation-actions-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,       // Indispensable pour <mat-icon>
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './reservation-actions-modal.component.html', // Lien vers le fichier HTML
  styles: [`
    .modal-content {
      min-width: 400px;
    }

    .action-section {
      padding: 16px 0;
    }

    .action-section h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 1rem;
      color: #334155;
    }

    .description {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 12px;
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: space-between;
    }

    .flex-grow {
      flex: 1;
    }

    .cluster-hint {
      font-size: 0.8em;
      color: gray;
    }

    .sub-text {
      font-size: 0.85rem;
      color: #64748b;
    }

    .danger-zone {
      color: #dc2626;
    }

    .warning-text {
      font-size: 0.85rem;
      font-style: italic;
    }

    .action-btn {
      height: 56px;
      margin-bottom: 22px;
    }

    /* Alignement avec le input */
  `]
})
export class ReservationActionsModalComponent {
  public selectedTargetNode: string | null = null;
  public selectedModel: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ReservationActionsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReservationActionsModalData
  ) {
    // Initialiser le modèle sélectionné avec le modèle actuel
    this.selectedModel = data.reservation.modelName || null;
  }

  confirmDeploy() {
    this.dialogRef.close({action: 'deploy'});
  }

  confirmMove() {
    if (this.selectedTargetNode) {
      this.dialogRef.close({action: 'move', targetNodeName: this.selectedTargetNode});
    }
  }

  confirmUpdateModel() {
    this.dialogRef.close({action: 'updateModel', modelName: this.selectedModel});
  }

  confirmDelete() {
    this.dialogRef.close({ action: 'delete' });
  }
}
