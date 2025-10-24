import {Injectable} from '@angular/core';
import {delay, Observable, of, tap, timer} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {ClusterApiResponse, ReservationDetail} from '../models/gpu.model';


export interface NamespaceReservation {
  cluster: string;
  node: string;
  namespace: string;
  application: string;
  gpusRequested: number;
}

const MOCK_CLUSTERS: ClusterApiResponse[] = [
  {
    cluster_name: 'cluster-A',
    total_physical_gpus: 8,
    // ...
    nodes: {
      "syy0ia1017": {
        physical_gpus: 4,
        virtual_gpus: 16,
        reserved_gpus: 0,
        used_gpus: 0,
        used_mig_units: 0,
        gpu_usage_percent: 0,
        reservations: [] // <-- AJOUTER CECI
      },
      "syy0ia1018": {
        physical_gpus: 4,
        virtual_gpus: 16,
        reserved_gpus: 0,
        used_gpus: 0,
        used_mig_units: 0,
        gpu_usage_percent: 0,
        reservations: [] // <-- AJOUTER CECI
      }
    },
    total_virtual_gpus: 0,
    total_used_gpus: 0,
    global_gpu_usage_percent: 0
  },
  {
    cluster_name: 'cluster-B',
    // ...
    nodes: {
      "syy0ia2022": {
        physical_gpus: 8,
        virtual_gpus: 32,
        reserved_gpus: 0,
        used_gpus: 0,
        used_mig_units: 0,
        gpu_usage_percent: 0,
        reservations: [] // <-- AJOUTER CECI
      }
    },
    total_physical_gpus: 0,
    total_virtual_gpus: 0,
    total_used_gpus: 0,
    global_gpu_usage_percent: 0
  }
];

@Injectable({providedIn: 'root'})
export class GpuDataService {
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 2000).pipe(
    map(() => {
      MOCK_CLUSTERS.forEach(cluster => {
        let totalClusterReserved = 0;
        Object.values(cluster.nodes).forEach(node => {
          // Calcule le total réservé à partir de la liste détaillée
          const totalNodeReserved = node.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
          node.reserved_gpus = totalNodeReserved; // Met à jour le compte du nœud
          totalClusterReserved += totalNodeReserved;
        });
        // (Note: vous utilisez `total_used_gpus` pour le total,
        //  nous allons mettre à jour celui-là pour rester cohérent avec votre code précédent)
        cluster.total_used_gpus = totalClusterReserved;
      });

      return JSON.parse(JSON.stringify(MOCK_CLUSTERS));
    }),
    shareReplay(1)
  );

  createNamespaceReservation(data: NamespaceReservation): Observable<any> {
    console.log('[Mock Service] Demande de réservation reçue:', data);

    const cluster = MOCK_CLUSTERS.find(c => c.cluster_name === data.cluster);
    if (!cluster) { /* ... (gestion d'erreur) */
    }

    const nodeMetrics = cluster!.nodes[data.node];
    if (!nodeMetrics) { /* ... (gestion d'erreur) */
    }

    // Recalculer la disponibilité pour être sûr
    const currentReserved = nodeMetrics.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
    const gpusAvailable = nodeMetrics.physical_gpus - currentReserved;

    if (gpusAvailable < data.gpusRequested) {
      const errorMsg = `Pas assez de GPUs disponibles sur ${data.node} (demandés: ${data.gpusRequested}, dispo: ${gpusAvailable})`;
      return of({message: errorMsg}).pipe(
        delay(500),
        tap(() => {
          throw new Error(errorMsg);
        })
      );
    }

    // 4. Mettre à jour le MOCK_CLUSTERS (la simulation de la BDD)
    // CRÉER L'OBJET DE RÉSERVATION
    const newReservation: ReservationDetail = {
      namespace: data.namespace,
      application: data.application,
      gpusRequested: data.gpusRequested,
      createdAt: new Date()
    };

    // AJOUTER À LA LISTE
    nodeMetrics.reservations.push(newReservation);

    console.log(`[Mock Service] Réservation effectuée. ${data.node} a maintenant ${nodeMetrics.reservations.length} réservations.`);

    // 5. Renvoyer une réponse de succès simulée
    return of({message: `Réservation pour ${data.namespace} effectuée avec succès.`}).pipe(
      delay(1000) // Simuler une attente réseau
    );
  }
}
