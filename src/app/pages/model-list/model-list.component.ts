import {Component, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';
import {AiModel} from '../../models/aimodel.model';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {Router} from '@angular/router';

@Component({
  selector: 'app-model-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinner
  ],
  templateUrl: './model-list.component.html',
  styleUrls: ['./model-list.component.scss'] // Créez ce fichier vide si besoin
})
export class ModelListComponent {
  displayedColumns: string[] = ['name', 'type', 'vram', 'description', 'actions'];
  private gpuService = inject(GpuDataServiceMock);
  // Chargement des modèles sous forme de Signal
  models: Signal<AiModel[]> = toSignal(this.gpuService.getAvailableModels(), {initialValue: []});
  private router = inject(Router);

  onProvision(model: AiModel) {
    // Navigation vers le créateur avec les infos du modèle en paramètre
    this.router.navigate(['/create-namespace'], {
      queryParams: {
        app: model.name,
        vram: model.vramRequiredGb,
        type: model.type
      }
    });
  }
}
