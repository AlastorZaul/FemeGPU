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
    MatCheckboxModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private gpuService = inject(GpuDataService);
  private dialog = inject(MatDialog);

  public clusters: Signal<Cluster[]>;

  // Map pour stocker un FormControl pour chaque sélecteur de cluster
  public selectionControls = new Map<string, FormControl>();

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

  // Méthode pour "Tout sélectionner / Tout désélectionner"
  toggleSelectAll(clusterId: string, gpus: Gpu[]): void {
    const control = this.selectionControls.get(clusterId);
    if (!control) return;

    const allGpuIds = gpus.map(gpu => gpu.id);
    const selectedIds = control.value || [];

    if (selectedIds.length === allGpuIds.length) {
      control.setValue([]); // Si tout est sélectionné, on désélectionne tout
    } else {
      control.setValue(allGpuIds); // Sinon, on sélectionne tout
    }
  }

  // Méthode pour vérifier si tout est sélectionné (pour l'état de la checkbox)
  isAllSelected(clusterId: string, totalGpus: number): boolean {
    const control = this.selectionControls.get(clusterId);
    return control ? control.value?.length === totalGpus : false;
  }


  showHistory(gpu: Gpu): void {
    this.dialog.open(GpuHistoryChartComponent, {
      width: '80vw',
      maxWidth: '800px',
      data: gpu
    });
  }
}
