import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Cluster, Gpu } from '../models/gpu.model';

// Données de base avec le nouveau statut
const MOCK_CLUSTERS: Cluster[] = [
  {
    id: 'cluster-1', name: 'Cluster IA (Europe)',
    gpus: [
      { id: 'gpu-1a', name: 'NVIDIA A100', status: 'En charge', temperature: 65, utilization: 92, fanSpeed: 75, power: 280, history: [] },
      { id: 'gpu-1b', name: 'NVIDIA A100', status: 'Inactif', temperature: 40, utilization: 5, fanSpeed: 30, power: 90, history: [] }
    ]
  },
  {
    id: 'cluster-2', name: 'Cluster Rendu 3D (USA)',
    gpus: [
      { id: 'gpu-2a', name: 'RTX 4090', status: 'En charge', temperature: 55, utilization: 60, fanSpeed: 65, power: 320, history: [] },
      { id: 'gpu-2b', name: 'RTX 4090', status: 'Inactif', temperature: 38, utilization: 2, fanSpeed: 25, power: 85, history: [] },
      { id: 'gpu-2c', name: 'RTX 3090 Ti', status: 'Erreur', temperature: 30, utilization: 0, fanSpeed: 0, power: null, history: [] }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class GpuDataService {
  // `timer(0, 1500)` émet une valeur immédiatement, puis toutes les 1500ms (1.5s).
  // C'est cet intervalle qui rythme votre tableau de bord.
  public gpuData$: Observable<Cluster[]> = timer(0, 1500).pipe(
    map(() => {
      // La logique de simulation met à jour les données à chaque intervalle.
      MOCK_CLUSTERS.forEach(cluster => {
        cluster.gpus.forEach(gpu => {
          this.updateGpuMetrics(gpu);
        });
      });
      // On retourne une nouvelle copie des données pour garantir la détection des changements.
      return JSON.parse(JSON.stringify(MOCK_CLUSTERS));
    }),
    shareReplay(1) // Assure que tous les composants partagent le même flux de données.
  );

  private changeGpuStatus(gpu: Gpu) {
    if (gpu.status === 'En charge') gpu.status = 'Inactif';
    else if (gpu.status === 'Inactif') gpu.status = 'En charge';
    // Le statut Erreur reste fixe pour l'exemple
  }

  private updateGpuMetrics(gpu: Gpu) {
    switch(gpu.status) {
      case 'En charge':
        gpu.utilization = this.fluctuate(gpu.utilization, 70, 100, 10);
        gpu.temperature = this.fluctuate(gpu.temperature, 65, 90, 3);
        gpu.fanSpeed = this.fluctuate(gpu.fanSpeed, 60, 100, 5);
        gpu.power = this.fluctuate(gpu.power!, 250, 450, 20);
        break;
      case 'Inactif':
        gpu.utilization = this.fluctuate(gpu.utilization, 0, 10, 2);
        gpu.temperature = this.fluctuate(gpu.temperature, 35, 50, 1);
        gpu.fanSpeed = this.fluctuate(gpu.fanSpeed, 20, 40, 5);
        gpu.power = this.fluctuate(gpu.power!, 80, 120, 5);
        break;
      case 'Erreur':
        gpu.utilization = 0;
        gpu.fanSpeed = 0;
        gpu.temperature = 30;
        gpu.power = null;
        break;
    }
    // L'historique continue d'être enregistré
    gpu.history.push({ name: new Date(), value: gpu.temperature });
    if (gpu.history.length > 20) gpu.history.shift();
  }

  private fluctuate(value: number, min: number, max: number, amount: number): number {
    const change = (Math.random() * amount * 2) - amount;
    return Math.max(min, Math.min(max, value + change));
  }
}
