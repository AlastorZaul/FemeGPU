import {Component, computed, effect, inject, OnInit, signal, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router'; // Ajout de ActivatedRoute
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDividerModule} from '@angular/material/divider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {startWith} from 'rxjs/operators';
import {MatAutocompleteModule} from '@angular/material/autocomplete'; // N'oubliez pas l'autocomplete
import {ClusterApiResponse, NodeMetrics} from '../../models/gpu.model';
import {GpuDataServiceMock, NamespaceReservation} from '../../services/gpu-data-mock.service';
import {CustomGaugeComponent} from '../../components/custom-gauge/custom-gauge.component';

@Component({
  selector: 'app-namespace-creator',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule, CustomGaugeComponent,
    MatSlideToggleModule, MatAutocompleteModule
  ],
  templateUrl: './namespace-creator.component.html',
  styleUrls: ['./namespace-creator.component.scss']
})
export class NamespaceCreatorComponent implements OnInit {
  // 1. Injections
  private fb = inject(FormBuilder);
  private gpuDataService = inject(GpuDataServiceMock);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Nécessaire pour les queryParams

  // 2. Propriétés simples
  public isSubmitting = signal(false);
  public showGauges = signal(true);

  // 3. Chargement des données (Indépendant du formulaire)
  clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });
  availableApplications = toSignal(this.gpuDataService.getAvailableApplications(), { initialValue: [] });

  // 4. Formulaire (DOIT ÊTRE DÉFINI AVANT LES SIGNAUX QUI L'UTILISENT)
  reservationForm = this.fb.group({
    cluster: ['', Validators.required],
    node: [{ value: '', disabled: true }, Validators.required],
    namespace: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    application: ['', Validators.required],
    gpusRequested: [1, [Validators.required, Validators.min(1)]],
    memoryRequest: [1, [Validators.required, Validators.min(1)]],
    cpuRequest: [1, [Validators.required, Validators.min(1)]]
  });

  // 5. Signaux dépendants du formulaire (Définis APRES le formulaire)

  // -- Autocomplete Application --
  currentApplicationInput = toSignal(
    this.reservationForm.get('application')!.valueChanges.pipe(startWith('')),
    {initialValue: ''}
  );

  filteredApplications = computed(() => {
    const filterValue = (this.currentApplicationInput() || '').toLowerCase();
    const apps = this.availableApplications();
    return apps.filter(app => app.toLowerCase().includes(filterValue));
  });

  // -- Sélection Cluster & Node --
  selectedClusterName = toSignal(
    this.reservationForm.get('cluster')!.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  selectedNodeName = toSignal(
    this.reservationForm.get('node')!.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  // -- Valeurs demandées (pour les calculs de jauge) --
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

  // 6. Calculs (Computed)
  selectedCluster = computed(() =>
    this.clusters().find(c => c.cluster_name === this.selectedClusterName())
  );

  availableNodes = computed(() => {
    const cluster = this.selectedCluster();
    return cluster ? Object.entries(cluster.nodes).map(([name, metrics]) => ({
      name,
      metrics: metrics as NodeMetrics
    })) : [];
  });

  selectedNodeMetrics = computed(() => {
    const cluster = this.selectedCluster();
    const nodeName = this.selectedNodeName();
    if (cluster && nodeName) {
      return (cluster.nodes[nodeName] as NodeMetrics) || null;
    }
    return null;
  });

  // -- Disponibilité Brute --
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

  // -- Disponibilité Projetée (Restante après réservation) --
  projectedGpus = computed(() => Math.max(0, this.rawGpusAvailable() - (this.requestedGpus() || 0)));
  projectedMemory = computed(() => Math.max(0, this.rawMemoryAvailable() - (this.requestedMemory() || 0)));
  projectedCpu = computed(() => Math.max(0, this.rawCpuAvailable() - (this.requestedCpu() || 0)));

  constructor() {
    // Gestion activation/désactivation champ Node
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

    // Validation dynamique des quotas
    effect(() => {
      this.updateValidation('gpusRequested', this.rawGpusAvailable());
      this.updateValidation('memoryRequest', this.rawMemoryAvailable());
      this.updateValidation('cpuRequest', this.rawCpuAvailable());
    });
  }

  // Initialisation : Récupération des paramètres d'URL (Provisionnement depuis Catalogue)
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const appName = params['app'];
      const vram = params['vram'];

      if (appName) {
        this.reservationForm.patchValue({application: appName});

        // Logique : Si le modèle a besoin de VRAM, on suggère de la RAM système (x1.5)
        if (vram) {
          const vramNum = Number(vram);
          const suggestedRam = Math.ceil(vramNum * 1.5);
          this.reservationForm.patchValue({memoryRequest: suggestedRam});

          this.snackBar.open(
            `Modèle sélectionné : ${appName} (RAM ajustée à ${suggestedRam} Go)`,
            'Ok',
            {duration: 4000}
          );
        }
      }
    });
  }

  private updateValidation(controlName: string, max: number) {
    const control = this.reservationForm.get(controlName);
    if (control) {
      // On garde min(1) mais on met à jour le max dynamiquement
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
