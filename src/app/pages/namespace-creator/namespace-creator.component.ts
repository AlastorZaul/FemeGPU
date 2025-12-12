import {Component, computed, effect, inject, signal, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDividerModule} from '@angular/material/divider';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';
import {startWith} from 'rxjs/operators'; // IMPORTANT : pour initialiser les valeurs
import {CustomGaugeComponent} from '../../components/custom-gauge/custom-gauge.component';
import {NamespaceReservation} from '../../services/gpu-data.service';

@Component({
  selector: 'app-namespace-creator',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule, CustomGaugeComponent
  ],
  templateUrl: './namespace-creator.component.html',
  styleUrls: ['./namespace-creator.component.scss']
})
export class NamespaceCreatorComponent {
  private fb = inject(FormBuilder);
  private gpuDataService = inject(GpuDataServiceMock);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  public isSubmitting = signal(false);

  // 1. Données brutes
  clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  availableApplications = toSignal(this.gpuDataService.getAvailableApplications(), { initialValue: [] });

  // 2. Formulaire
  reservationForm = this.fb.group({
    cluster: ['', Validators.required],
    node: [{ value: '', disabled: true }, Validators.required],
    namespace: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    application: ['', Validators.required],
    gpusRequested: [1, [Validators.required, Validators.min(1)]],
    memoryRequest: [1, [Validators.required, Validators.min(1)]],
    cpuRequest: [1, [Validators.required, Validators.min(1)]]
  });

  // 3. Signaux de sélection (Cluster & Node)
  selectedClusterName = toSignal(
    this.reservationForm.get('cluster')!.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  selectedNodeName = toSignal(
    this.reservationForm.get('node')!.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  // 4. Signaux des valeurs demandées (Reactive) [C'est ici que la magie opère]
  requestedGpus = toSignal(
    this.reservationForm.get('gpusRequested')!.valueChanges.pipe(startWith(1)),
    { initialValue: 1 }
  );
  requestedMemory = toSignal(
    this.reservationForm.get('memoryRequest')!.valueChanges.pipe(startWith(1)),
    { initialValue: 1 }
  );
  requestedCpu = toSignal(
    this.reservationForm.get('cpuRequest')!.valueChanges.pipe(startWith(1)),
    { initialValue: 1 }
  );

  // 5. Calculs des métriques du nœud sélectionné
  selectedCluster = computed(() =>
    this.clusters().find(c => c.cluster_name === this.selectedClusterName())
  );

  availableNodes = computed(() => {
    const cluster = this.selectedCluster();
    return cluster ? Object.entries(cluster.nodes).map(([name, metrics]) => ({ name, metrics })) : [];
  });

  selectedNodeMetrics = computed(() => {
    const cluster = this.selectedCluster();
    const nodeName = this.selectedNodeName();
    if (cluster && nodeName) {
      return cluster.nodes[nodeName] || null;
    }
    return null;
  });

  // 6. Disponibilité BRUTE (Ce qu'il y a sur le nœud)
  rawGpusAvailable = computed(() => {
    const metrics = this.selectedNodeMetrics();
    return metrics ? Math.max(0, metrics.physical_gpus - metrics.reserved_gpus) : 0;
  });

  rawMemoryAvailable = computed(() => {
    const metrics = this.selectedNodeMetrics();
    return metrics ? Math.max(0, metrics.total_memory_gb - metrics.reserved_memory_gb) : 0;
  });

  rawCpuAvailable = computed(() => {
    const metrics = this.selectedNodeMetrics();
    return metrics ? Math.max(0, metrics.total_cpu_cores - metrics.reserved_cpu_cores) : 0;
  });

  // 7. Disponibilité PROJETÉE (Après réservation) - Utilisé pour l'affichage
  projectedGpus = computed(() => Math.max(0, this.rawGpusAvailable() - (this.requestedGpus() || 0)));
  projectedMemory = computed(() => Math.max(0, this.rawMemoryAvailable() - (this.requestedMemory() || 0)));
  projectedCpu = computed(() => Math.max(0, this.rawCpuAvailable() - (this.requestedCpu() || 0)));

  constructor() {
    // Gestion de l'activation/désactivation du champ Node
    effect(() => {
      const clusterName = this.selectedClusterName();
      const nodeControl = this.reservationForm.get('node');
      if (clusterName) {
        nodeControl?.enable({ emitEvent: false });
      } else {
        nodeControl?.disable({ emitEvent: false });
        nodeControl?.reset('', { emitEvent: false });
      }
    }, { allowSignalWrites: true });

    // Validation dynamique (Empêcher de demander plus que le stock brut)
    effect(() => {
      this.updateValidation('gpusRequested', this.rawGpusAvailable());
      this.updateValidation('memoryRequest', this.rawMemoryAvailable());
      this.updateValidation('cpuRequest', this.rawCpuAvailable());
    });
  }

  private updateValidation(controlName: string, max: number) {
    const control = this.reservationForm.get(controlName);
    if (control) {
      control.setValidators([Validators.required, Validators.min(1), Validators.max(max)]);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  onSubmit() {
    if (this.reservationForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      const formData = this.reservationForm.getRawValue() as NamespaceReservation;

      this.gpuDataService.createNamespaceReservation(formData).subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Réservation réussie', 'OK', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.snackBar.open('Erreur : ' + err.message, 'Fermer', { duration: 5000 });
          this.isSubmitting.set(false);
        },
        complete: () => this.isSubmitting.set(false)
      });
    } else {
      this.reservationForm.markAllAsTouched();
    }
  }
}
