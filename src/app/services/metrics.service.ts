import {inject, Injectable} from '@angular/core';
import {GpuDataService} from './gpu-data.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Cluster} from '../models/gpu.model';

// Interface pour les métriques d'un cluster individuel
export interface ClusterAllocationMetrics {
  id: string;
  name: string;
  totalGpus: number;
  allocatedGpus: number;
  availableGpus: number;
  errorGpus: number;
  allocationRate: number; // en pourcentage
}

// Interface pour les métriques globales de toute la ferme
export interface FarmAllocationMetrics {
  totalGpus: number;
  totalAllocatedGpus: number;
  totalAvailableGpus: number;
  totalErrorGpus: number;
  overallAllocationRate: number; // en pourcentage
  clusters: ClusterAllocationMetrics[];
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private gpuDataService = inject(GpuDataService);

  // Définition des seuils pour considérer un GPU comme "alloué"
  private readonly ALLOCATION_THRESHOLD_PERCENT = 10;

  // Observable public que les composants vont consommer
  public farmMetrics$: Observable<FarmAllocationMetrics>;

  constructor() {
    this.farmMetrics$ = this.gpuDataService.gpuData$.pipe(
      map(clusters => this.calculateMetrics(clusters))
    );
  }

  private calculateMetrics(clusters: Cluster[]): FarmAllocationMetrics {
    let totalGpus = 0;
    let totalAllocatedGpus = 0;
    let totalErrorGpus = 0;

    const clusterMetrics = clusters.map(cluster => {
      const allocatedGpusInCluster = cluster.gpus.filter(gpu => gpu.utilization > this.ALLOCATION_THRESHOLD_PERCENT).length;
      const errorGpusInCluster = cluster.gpus.filter(gpu => gpu.status === 'Erreur').length;
      const totalGpusInCluster = cluster.gpus.length;

      // Mise à jour des totaux de la ferme
      totalGpus += totalGpusInCluster;
      totalAllocatedGpus += allocatedGpusInCluster;
      totalErrorGpus += errorGpusInCluster;

      return {
        id: cluster.id,
        name: cluster.name,
        totalGpus: totalGpusInCluster,
        allocatedGpus: allocatedGpusInCluster,
        errorGpus: errorGpusInCluster,
        availableGpus: totalGpusInCluster - allocatedGpusInCluster - errorGpusInCluster,
        allocationRate: totalGpusInCluster > 0 ? (allocatedGpusInCluster / totalGpusInCluster) * 100 : 0,
      };
    });

    return {
      clusters: clusterMetrics,
      totalGpus: totalGpus,
      totalAllocatedGpus: totalAllocatedGpus,
      totalErrorGpus: totalErrorGpus,
      totalAvailableGpus: totalGpus - totalAllocatedGpus - totalErrorGpus,
      overallAllocationRate: totalGpus > 0 ? (totalAllocatedGpus / totalGpus) * 100 : 0,
    };
  }
}
