import {Injectable} from '@angular/core';
import {Observable, of, timer} from 'rxjs';
import {delay, map, shareReplay} from 'rxjs/operators';
import {ClusterApiResponse, ReservationDetail} from '../models/gpu.model';

// Interface pour le formulaire de réservation
export interface NamespaceReservation {
  cluster: string;
  node: string;
  namespace: string;
  application: string;
  gpusRequested: number;
}

// (Interface pour la liste - pour la nouvelle fonction de basculement)
export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

// Clé pour le stockage local
const STORAGE_KEY = 'gpuFarmMockData';

// Données initiales (utilisées uniquement si localStorage est vide)
const INITIAL_MOCK_DATA: ClusterApiResponse[] = [
  // (Données mock initiales, incluant 'reservations' et 'isActive')
  {
    total_physical_gpus: 8, cluster_name: 'Cluster Production A',
    // ... (autres champs)
    nodes: {
      "prod-node-01": {
        physical_gpus: 4, virtual_gpus: 4, reserved_gpus: 3, used_gpus: 3,
        used_mig_units: 0, gpu_usage_percent: 88,
        reservations: [
          {
            namespace: 'alpha-train',
            application: 'jupyter-notebook',
            gpusRequested: 2,
            createdAt: new Date(Date.now() - 3600000),
            isActive: true
          },
          {
            namespace: 'alpha-train',
            application: 'model-builder',
            gpusRequested: 1,
            createdAt: new Date(Date.now() - 7200000),
            isActive: true
          }
        ]
      },
      // ... (autres noeuds avec 'reservations' et 'isActive')
    },
    total_virtual_gpus: 0,
    total_used_gpus: 0,
    global_gpu_usage_percent: 0
  },
  // ... (autres clusters)
];


@Injectable({
  providedIn: 'root'
})
export class GpuDataServiceMock {

  private mockClusters: ClusterApiResponse[];

  private saveDataToLocalStorage(): void {
    try {
      const dataToStore = JSON.stringify(this.mockClusters);
      localStorage.setItem(STORAGE_KEY, dataToStore);
      console.log('[Mock Service] Données sauvegardées dans localStorage.');
    } catch (e) {
      console.error('[Mock Service] Erreur lors de la sauvegarde dans localStorage:', e);
    }
  }

  private loadDataFromLocalStorage(): ClusterApiResponse[] {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        console.log('[Mock Service] Données chargées depuis localStorage.');
        const parsedData: ClusterApiResponse[] = JSON.parse(storedData);
        parsedData.forEach(cluster => {
          Object.values(cluster.nodes).forEach(node => {
            if (node.reservations) {
              node.reservations.forEach(res => {
                res.createdAt = new Date(res.createdAt);
                res.isActive = res.isActive ?? true;
              });
            }
          });
        });
        return parsedData;
      } else {
        console.log('[Mock Service] Pas de données. Initialisation avec les données mock.');
        const initialData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        return initialData;
      }
    } catch (e) {
      console.error('[Mock Service] Erreur lors du chargement depuis localStorage, réinitialisation:', e);
      const initialData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
  }

  constructor() {
    this.mockClusters = this.loadDataFromLocalStorage();
  }

  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 2000).pipe(
    map(() => {
      // ** MODIFICATION : Nous ne simulons plus 'isActive' aléatoirement **
      // La boucle 'for (const res of node.reservations)' qui changeait l'état est SUPPRIMÉE.

      for (const cluster of this.mockClusters) {
        let clusterTotalUsedGpus = 0;
        let clusterTotalUsagePercent = 0;
        let nodeCount = 0;

        for (const nodeName in cluster.nodes) {
          const node = cluster.nodes[nodeName];
          nodeCount++;

          node.reservations = node.reservations || [];

          // 1. 'reserved_gpus' est le total de TOUTES les réservations
          node.reserved_gpus = node.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);

          // 2. 'used_gpus' est le total des réservations ACTIVES
          node.used_gpus = node.reservations
            .filter(res => res.isActive) // Prend seulement les actives
            .reduce((sum, res) => sum + res.gpusRequested, 0);

          // 3. Mettre à jour le pourcentage d'utilisation
          if (node.physical_gpus > 0) {
            node.gpu_usage_percent = Math.round((node.used_gpus / node.physical_gpus) * 100);
          } else {
            node.gpu_usage_percent = 0;
          }

          clusterTotalUsedGpus += node.used_gpus;
          clusterTotalUsagePercent += node.gpu_usage_percent;
        }

        cluster.total_used_gpus = clusterTotalUsedGpus;
        if (nodeCount > 0) {
          cluster.global_gpu_usage_percent = Math.round(clusterTotalUsagePercent / nodeCount);
        } else {
          cluster.global_gpu_usage_percent = 0;
        }
      }

      // Pas besoin de sauvegarder ici, car rien n'a changé

      return JSON.parse(JSON.stringify(this.mockClusters));
    }),
    shareReplay(1)
  );

  createNamespaceReservation(data: NamespaceReservation): Observable<any> {
    // ... (Logique inchangée, elle ajoute une nouvelle réservation avec 'isActive: true')
    const cluster = this.mockClusters.find(c => c.cluster_name === data.cluster);
    if (!cluster) { /* ... */
    }
    const nodeMetrics = cluster!.nodes[data.node];
    if (!nodeMetrics) { /* ... */
    }

    const currentReserved = nodeMetrics.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
    const gpusAvailable = nodeMetrics.physical_gpus - currentReserved;

    if (gpusAvailable < data.gpusRequested) { /* ... (gestion d'erreur) */
    }

    const newReservation: ReservationDetail = {
      namespace: data.namespace,
      application: data.application,
      gpusRequested: data.gpusRequested,
      createdAt: new Date(),
      isActive: true // Active par défaut
    };

    nodeMetrics.reservations.push(newReservation);
    this.saveDataToLocalStorage();
    return of({message: `Réservation pour ${data.namespace} effectuée avec succès.`}).pipe(delay(1000));
  }

  reallocateGpus(nodeName: string): Observable<any> {
    // ... (Logique inchangée)
    for (const cluster of this.mockClusters) {
      if (cluster.nodes[nodeName]) {
        cluster.nodes[nodeName].reservations = [];
        this.saveDataToLocalStorage();
        break;
      }
    }
    return of({message: `GPUs sur ${nodeName} réalloués (simulation).`}).pipe(delay(500));
  }

  // **** NOUVELLE MÉTHODE ****
  // Change manuellement l'état d'une réservation et sauvegarde
  toggleReservationStatus(reservation: FlatReservation): Observable<any> {
    const cluster = this.mockClusters.find(c => c.cluster_name === reservation.clusterName);
    if (cluster) {
      const node = cluster.nodes[reservation.nodeName];
      if (node) {
        // Retrouver la réservation par son ID unique (createdAt)
        const targetReservation = node.reservations.find(
          res => new Date(res.createdAt).getTime() === new Date(reservation.createdAt).getTime()
        );
        if (targetReservation) {
          targetReservation.isActive = !targetReservation.isActive; // Inverser l'état
          this.saveDataToLocalStorage(); // Sauvegarder le changement
          return of({success: true, newState: targetReservation.isActive});
        }
      }
    }
    return of({success: false, error: 'Réservation non trouvée'});
  }
}
