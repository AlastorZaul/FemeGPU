import {Component, effect, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common'; // NÉCESSAIRE pour le pipe `async` et `@if`
import {GpuDataService} from '../../services/gpu-data.service';

// Imports Angular Material
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

// Import des composants et modèles
import {GpuCardComponent} from '../../components/gpu-card/gpu-card.component';
import {GpuHistoryChartComponent} from '../../components/gpu-history-chart/gpu-history-chart.component';
import {Cluster, Gpu} from '../../models/gpu.model';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MultiSelectComponent} from '../../components/multi-select/multi-select.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, // Indispensable
    GpuCardComponent,
    MatExpansionModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MultiSelectComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private gpuService = inject(GpuDataService);
  private dialog = inject(MatDialog);

  // selectionControls est toujours utile pour stocker l'état
  public selectionControls = new Map<string, FormControl>();

  public clusters: Signal<Cluster[]>;

  constructor() {
    this.clusters = toSignal(this.gpuService.gpuData$, {initialValue: []});

    // Utilise un `effect` pour créer les FormControls dynamiquement
    // dès que les données des clusters sont disponibles.
    effect(() => {
      this.clusters().forEach(cluster => {
        if (!this.selectionControls.has(cluster.id)) {
          this.selectionControls.set(cluster.id, new FormControl([]));
        }
      });
    });
  }

  // --- NOUVELLE MÉTHODE DE FILTRAGE ---
  getFilteredGpus(cluster: Cluster): Gpu[] {
    const control = this.selectionControls.get(cluster.id);
    const selectedIds = control?.value;

    // Si rien n'est sélectionné, on retourne tous les GPUs
    if (!selectedIds || selectedIds.length === 0) {
      return cluster.gpus;
    }

    // Sinon, on retourne uniquement les GPUs dont l'ID est dans la liste des sélectionnés
    const selectedIdSet = new Set(selectedIds);
    return cluster.gpus.filter(gpu => selectedIdSet.has(gpu.id));
  }

  // Méthode qui met à jour le FormControl quand l'enfant émet un changement
  onSelectionChange(clusterId: string, selectedIds: any[]): void {
    const control = this.selectionControls.get(clusterId);
    if (control) {
      // On met à jour la valeur du control, ce qui mettra à jour l'input [selectedIds] de l'enfant
      control.setValue(selectedIds);
    }
  }

  showHistory(gpu: Gpu): void {
    this.dialog.open(GpuHistoryChartComponent, {
      width: '80vw',
      maxWidth: '800px',
      data: gpu
    });
  }
}
