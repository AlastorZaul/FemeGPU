import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ClusterApiResponse } from '../models/gpu.model';

const MOCK_CLUSTERS: ClusterApiResponse[] = [
  {
    total_physical_gpus: 8, total_virtual_gpus: 8, total_used_gpus: 6, global_gpu_usage_percent: 75, cluster_name: 'Cluster Production A',
    nodes: {
      "prod-node-01": { physical_gpus: 4, virtual_gpus: 4, reserved_gpus: 3, used_gpus: 3, used_mig_units: 3, gpu_usage_percent: 88 },
      "prod-node-02": { physical_gpus: 4, virtual_gpus: 4, reserved_gpus: 3, used_gpus: 3, used_mig_units: 3, gpu_usage_percent: 62 }
    }
  },
  {
    total_physical_gpus: 4, total_virtual_gpus: 4, total_used_gpus: 1, global_gpu_usage_percent: 25, cluster_name: 'Cluster Staging B',
    nodes: {
      "staging-node-21": { physical_gpus: 2, virtual_gpus: 2, reserved_gpus: 0, used_gpus: 0, used_mig_units: 0, gpu_usage_percent: 15 },
      "staging-node-22": { physical_gpus: 2, virtual_gpus: 2, reserved_gpus: 1, used_gpus: 1, used_mig_units: 1, gpu_usage_percent: 40 }
    }
  }
];

@Injectable({ providedIn: 'root' })
export class GpuDataService {
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 2000).pipe(
    map(() => {
      const updatedClusters = JSON.parse(JSON.stringify(MOCK_CLUSTERS));
      for (const cluster of updatedClusters) {
        let totalUsage = 0;
        let totalUsedGpus = 0;
        for (const nodeName in cluster.nodes) {
          const node = cluster.nodes[nodeName];
          const usageFluctuation = (Math.random() - 0.5) * 10;
          node.gpu_usage_percent = Math.max(0, Math.min(100, Math.round(node.gpu_usage_percent + usageFluctuation)));
          node.used_gpus = Math.round((node.physical_gpus * node.gpu_usage_percent) / 100);
          totalUsedGpus += node.used_gpus;
          totalUsage += node.gpu_usage_percent;
        }
        cluster.total_used_gpus = totalUsedGpus;
        cluster.global_gpu_usage_percent = Math.round(totalUsage / Object.keys(cluster.nodes).length);
      }
      return updatedClusters;
    }),
    shareReplay(1)
  );
}