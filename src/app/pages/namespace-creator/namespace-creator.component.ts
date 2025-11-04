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
import {NamespaceReservation} from '../../services/gpu-data.service';
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDividerModule} from '@angular/material/divider';
import {GpuDataServiceMock} from '../../services/gpu-data-mock.service';
import {startWith} from 'rxjs';

@Component({
  selector: 'app-namespace-creator',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule
  ],
  templateUrl: './namespace-creator.component.html',
  styleUrls: ['./namespace-creator.component.scss']
})
export class NamespaceCreatorComponent {
  private fb = inject(FormBuilder);
  private gpuDataService = inject(GpuDataServiceMock);
  private readonly selectedClusterName: Signal<string | null | undefined>;
  private readonly selectedNodeName: Signal<string | null | undefined>;
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  public isSubmitting = signal(false);

  // Récupérer les données des clusters pour les dropdowns
  clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  // Le formulaire de réservation
  reservationForm = this.fb.group({
    cluster: ['', Validators.required],
    node: [{ value: '', disabled: true }, Validators.required],
    namespace: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    application: ['', Validators.required],
    gpusRequested: [1, [Validators.required, Validators.min(1)]],
    memoryRequest: [1, [Validators.required, Validators.min(1)]], // NOUVEAU
    cpuRequest: [1, [Validators.required, Validators.min(1)]]     // NOUVEAU
  });

  // Gérer les listes déroulantes dépendantes
  selectedCluster = computed(() => {
    const clusterName = this.reservationForm.get('cluster')?.value;
    return this.clusters().find(c => c.cluster_name === clusterName);
  });

  availableNodes = computed(() => {
    const cluster = this.selectedCluster();
    const nodeControl = this.reservationForm.get('node');
    if (cluster) {
      nodeControl?.enable({ emitEvent: false });
    } else {
      nodeControl?.disable({ emitEvent: false });
    }
    if (!cluster) return [];
    return Object.entries(cluster.nodes).map(([name, metrics]) => ({ name, metrics }));
  });

  selectedNodeMetrics = signal<NodeMetrics | null>(null);

  gpusAvailable = computed(() => {
    const metrics = this.selectedNodeMetrics();
    if (!metrics) return 0;
    const available = metrics.physical_gpus - metrics.reserved_gpus;
    return Math.max(0, available); // S'assurer que ce n'est pas négatif
  });

  memoryAvailable = computed(() => { // NOUVEAU
    const metrics = this.selectedNodeMetrics();
    if (!metrics) return 0;
    const available = (metrics.total_memory_gb || 0) - (metrics.reserved_memory_gb || 0);
    return Math.max(0, available);
  });

  cpuAvailable = computed(() => { // NOUVEAU
    const metrics = this.selectedNodeMetrics();
    if (!metrics) return 0;
    const available = (metrics.total_cpu_cores || 0) - (metrics.reserved_cpu_cores || 0);
    return Math.max(0, available);
  });

  constructor() {
    this.reservationForm = this.fb.group({
      cluster: ['', Validators.required],
      node: [{ value: '', disabled: true }, Validators.required], // Reste désactivé
      namespace: ['', [Validators.required, Validators.pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/)]],
      application: ['', Validators.required],
      gpusRequested: [1, [Validators.required, Validators.min(1)]],
      memoryRequest: [1, [Validators.required, Validators.min(1)]],
      cpuRequest: [1, [Validators.required, Validators.min(1)]]
    });
// 1. Créer des signaux à partir des changements de valeur du formulaire
    const clusterControl = this.reservationForm.get('cluster')!;
    const nodeControl = this.reservationForm.get('node')!;

    // startWith() est crucial pour que le signal ait une valeur au démarrage
    this.selectedClusterName = toSignal(
      clusterControl.valueChanges.pipe(startWith(clusterControl.value))
    );
    this.selectedNodeName = toSignal(
      nodeControl.valueChanges.pipe(startWith(nodeControl.value))
    );


    // 2. Mettre à jour les 'effects' pour utiliser les NOUVEAUX signaux
    // (Remplacez vos anciens 'effects' par ceux-ci)

    // Logique pour réinitialiser et (dés)activer le champ 'node'
    effect(() => {
      const clusterName = this.selectedClusterName(); // Utilise le signal
      const nodeControl = this.reservationForm.get('node');

      if (clusterName) {
        nodeControl?.enable({ emitEvent: false });
      } else {
        nodeControl?.disable({ emitEvent: false });
      }

      // Réinitialiser le champ 'node' (cela va déclencher le signal selectedNodeName)
      nodeControl?.reset(undefined);
    }, { allowSignalWrites: true });


    // Logique pour mettre à jour le nœud sélectionné et ses métriques
    effect(() => {
      const nodeName = this.selectedNodeName(); // Utilise le signal
      const clusterName = this.selectedClusterName(); // Utilise le signal

      if (nodeName && clusterName) {
        const cluster = this.clusters().find(c => c.cluster_name === clusterName);
        const node = cluster?.nodes[nodeName];
        if (node) {
          this.selectedNodeMetrics.set(node);
        } else {
          this.selectedNodeMetrics.set(null);
        }
      } else {
        this.selectedNodeMetrics.set(null);
      }
    }, { allowSignalWrites: true });

    // Logique pour mettre à jour les validateurs des ressources (celle-ci reste)
    effect(() => {
      this.updateResourceValidation('gpusRequested', this.gpusAvailable());
    });
    effect(() => {
      this.updateResourceValidation('memoryRequest', this.memoryAvailable());
    });
    effect(() => {
      this.updateResourceValidation('cpuRequest', this.cpuAvailable());
    });
  }

  // Fonction pour mettre à jour les validateurs de gpusRequested
  private updateResourceValidation(controlName: string, maxAvailable: number) {
    const control = this.reservationForm.get(controlName);

    control?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(maxAvailable)
    ]);
    control?.updateValueAndValidity({ emitEvent: false });
  }


  onSubmit() {
    if (this.reservationForm.invalid || this.isSubmitting()) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    // Vérifications manuelles (au cas où la validation max(0) serait contournée)
    if (this.gpusAvailable() <= 0 || this.reservationForm.get('gpusRequested')!.value! > this.gpusAvailable()) {
      this.reservationForm.get('gpusRequested')?.setErrors({ max: true });
    }
    if (this.memoryAvailable() <= 0 || this.reservationForm.get('memoryRequest')!.value! > this.memoryAvailable()) {
      this.reservationForm.get('memoryRequest')?.setErrors({ max: true });
    }
    if (this.cpuAvailable() <= 0 || this.reservationForm.get('cpuRequest')!.value! > this.cpuAvailable()) {
      this.reservationForm.get('cpuRequest')?.setErrors({ max: true });
    }

    // Revérifier si des erreurs ont été ajoutées
    if (this.reservationForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.reservationForm.getRawValue() as NamespaceReservation;

    this.gpuDataService.createNamespaceReservation(formData).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Réservation créée avec succès', 'Fermer', { duration: 3000 });
        void this.router.navigate(['/dashboard']); // Rediriger vers le dashboard
      },
      error: (err) => {
        this.snackBar.open(`Erreur: ${err.message || 'Échec de la réservation'}`, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
