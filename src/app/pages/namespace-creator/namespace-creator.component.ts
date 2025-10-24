import { Component, computed, inject, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { GpuDataService, NamespaceReservation } from '../../services/gpu-data.service';
import { ClusterApiResponse, NodeMetrics } from '../../models/gpu.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

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
  private gpuDataService = inject(GpuDataService);
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
    gpusRequested: [1, [Validators.required, Validators.min(1)]]
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

  selectedNodeMetrics = computed(() => {
    const nodeName = this.reservationForm.get('node')?.value;
    const node = this.availableNodes().find(n => n.name === nodeName);
    return node ? node.metrics : null;
  });

  gpusAvailable = computed(() => {
    const metrics = this.selectedNodeMetrics();
    if (!metrics) return 0;
    const available = metrics.physical_gpus - metrics.reserved_gpus;
    return Math.max(0, available); // S'assurer que ce n'est pas négatif
  });

  constructor() {
    // Réinitialiser le nœud si le cluster change
    this.reservationForm.get('cluster')?.valueChanges.subscribe(() => {
      this.reservationForm.get('node')?.reset('', { emitEvent: false });
      this.updateGpuRequestedValidation();
    });

    // Mettre à jour la validation du nombre de GPUs quand le nœud change
    this.reservationForm.get('node')?.valueChanges.subscribe(() => {
      this.updateGpuRequestedValidation();
    });
  }

  // Fonction pour mettre à jour les validateurs de gpusRequested
  private updateGpuRequestedValidation() {
    const maxAvailable = this.gpusAvailable();
    const gpusControl = this.reservationForm.get('gpusRequested');

    // Si maxAvailable est 0, le validateur max(0) poserait problème.
    // On met max(1) et on laisse l'erreur 'max' s'afficher si on demande 1.
    const maxVal = maxAvailable > 0 ? maxAvailable : 1;

    gpusControl?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(maxVal)
    ]);
    gpusControl?.updateValueAndValidity({ emitEvent: false });
  }


  onSubmit() {
    if (this.reservationForm.invalid || this.isSubmitting()) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    // Vérification manuelle (au cas où la validation max(0) serait contournée)
    if (this.gpusAvailable() <= 0 || this.reservationForm.get('gpusRequested')!.value! > this.gpusAvailable()) {
      this.reservationForm.get('gpusRequested')?.setErrors({ max: true });
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.reservationForm.getRawValue() as NamespaceReservation;

    this.gpuDataService.createNamespaceReservation(formData).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Fermer', { duration: 3000 });
        this.router.navigate(['/dashboard']); // Rediriger vers le dashboard
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
