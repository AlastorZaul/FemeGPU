import {Injectable} from '@angular/core';
import {Observable, of, timer} from 'rxjs';
import {delay, map, shareReplay, tap} from 'rxjs/operators';
// Importer tous les modèles nécessaires
import {ClusterApiResponse, ReservationDetail} from '../models/gpu.model';

// Interface pour le formulaire de réservation
export interface NamespaceReservation {
  cluster: string;
  node: string;
  namespace: string;
  application: string;
  gpusRequested: number;
}

// Clé pour le stockage local
const STORAGE_KEY = 'gpuFarmMockData';

// Données initiales (utilisées uniquement si localStorage est vide)
const INITIAL_MOCK_DATA: ClusterApiResponse[] = [
  {
    total_physical_gpus: 8,
    total_virtual_gpus: 8,
    total_used_gpus: 6,
    global_gpu_usage_percent: 75,
    cluster_name: 'Cluster Production A',
    nodes: {
      "prod-node-01": {
        physical_gpus: 4, virtual_gpus: 4, reserved_gpus: 3, used_gpus: 3,
        used_mig_units: 0, gpu_usage_percent: 88,
        reservations: [
          {
            namespace: 'alpha-train',
            application: 'jupyter-notebook',
            gpusRequested: 2,
            createdAt: new Date(Date.now() - 3600000)
          },
          {
            namespace: 'alpha-train',
            application: 'model-builder',
            gpusRequested: 1,
            createdAt: new Date(Date.now() - 7200000)
          }
        ]
      },
      "prod-node-02": {
        physical_gpus: 4, virtual_gpus: 4, reserved_gpus: 3, used_gpus: 3,
        used_mig_units: 0, gpu_usage_percent: 62,
        reservations: [
          {
            namespace: 'beta-inference',
            application: 'triton-server',
            gpusRequested: 3,
            createdAt: new Date(Date.now() - 600000)
          }
        ]
      }
    }
  },
  {
    total_physical_gpus: 4,
    total_virtual_gpus: 4,
    total_used_gpus: 1,
    global_gpu_usage_percent: 25,
    cluster_name: 'Cluster Staging B',
    nodes: {
      "staging-node-21": {
        physical_gpus: 2, virtual_gpus: 2, reserved_gpus: 0, used_gpus: 0,
        used_mig_units: 0, gpu_usage_percent: 15,
        reservations: []
      },
      "staging-node-22": {
        physical_gpus: 2, virtual_gpus: 2, reserved_gpus: 1, used_gpus: 1,
        used_mig_units: 0, gpu_usage_percent: 40,
        reservations: [
          {
            namespace: 'dev-test',
            application: 'tensorboard',
            gpusRequested: 1,
            createdAt: new Date(Date.now() - 86400000)
          }
        ]
      }
    }
  }
];


@Injectable({
  providedIn: 'root'
})
export class GpuDataServiceMock {

  // Propriété de classe qui contient l'état actuel
  private mockClusters: ClusterApiResponse[];

  // Nouvelle méthode pour sauvegarder
  private saveDataToLocalStorage(): void {
    try {
      // Convertit tout en string pour le stockage
      const dataToStore = JSON.stringify(this.mockClusters);
      localStorage.setItem(STORAGE_KEY, dataToStore);
      console.log('[Mock Service] Données sauvegardées dans localStorage.');
    } catch (e) {
      console.error('[Mock Service] Erreur lors de la sauvegarde dans localStorage:', e);
    }
  }

  // Nouvelle méthode pour charger
  private loadDataFromLocalStorage(): ClusterApiResponse[] {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        console.log('[Mock Service] Données chargées depuis localStorage.');
        const parsedData: ClusterApiResponse[] = JSON.parse(storedData);

        // Les dates sont stockées en string, il faut les reconvertir en objets Date
        parsedData.forEach(cluster => {
          Object.values(cluster.nodes).forEach(node => {
            if (node.reservations) {
              node.reservations.forEach(res => {
                res.createdAt = new Date(res.createdAt);
              });
            }
          });
        });
        return parsedData;

      } else {
        // Pas de données, utiliser les données initiales et les sauvegarder
        console.log('[Mock Service] Pas de données. Initialisation avec les données mock.');
        // Copie profonde pour éviter les mutations
        const initialData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        return initialData;
      }
    } catch (e) {
      console.error('[Mock Service] Erreur lors du chargement depuis localStorage, réinitialisation:', e);
      // En cas d'erreur (données corrompues), réinitialiser
      const initialData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
  }

  constructor() {
    // Charger les données au démarrage du service
    this.mockClusters = this.loadDataFromLocalStorage();
  }

  // L'observable est basé sur la propriété de classe 'this.mockClusters'
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 2000).pipe(
    map(() => {
      // La logique de simulation reste la même, elle lit `this.mockClusters`
      for (const cluster of this.mockClusters) {
        let clusterTotalUsedGpus = 0;
        let clusterTotalUsagePercent = 0;
        let nodeCount = 0;

        for (const nodeName in cluster.nodes) {
          const node = cluster.nodes[nodeName];
          nodeCount++;

          node.reservations = node.reservations || []; // S'assurer que le tableau existe

          // Recalculer 'reserved_gpus' à partir de la liste 'reservations'
          node.reserved_gpus = node.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);

          // Simuler l'utilisation (used_gpus)
          const used_by_reservations = Math.floor(node.reserved_gpus * (0.8 + Math.random() * 0.2));
          const available_gpus = node.physical_gpus - node.reserved_gpus;
          let used_by_ambient = 0;
          if (available_gpus > 0 && Math.random() > 0.3) {
            used_by_ambient = 1;
          }

          node.used_gpus = used_by_reservations + used_by_ambient;
          if (node.used_gpus > node.physical_gpus) {
            node.used_gpus = node.physical_gpus;
          }

          // Mettre à jour le pourcentage d'utilisation
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

      // Retourner une copie des données mises à jour
      return JSON.parse(JSON.stringify(this.mockClusters));
    }),
    shareReplay(1)
  );

  /**
   * Crée une réservation et la sauvegarde dans le localStorage.
   */
  createNamespaceReservation(data: NamespaceReservation): Observable<any> {
    console.log('[Mock Service] Demande de réservation reçue:', data);

    const cluster = this.mockClusters.find(c => c.cluster_name === data.cluster);
    if (!cluster) { /* ... (gestion d'erreur) */
    }
    const nodeMetrics = cluster!.nodes[data.node];
    if (!nodeMetrics) { /* ... (gestion d'erreur) */
    }

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

    const newReservation: ReservationDetail = {
      namespace: data.namespace,
      application: data.application,
      gpusRequested: data.gpusRequested,
      createdAt: new Date() // Sera converti en string lors de la sauvegarde
    };

    nodeMetrics.reservations.push(newReservation);

    // SAUVEGARDER LES MODIFICATIONS
    this.saveDataToLocalStorage();

    console.log(`[Mock Service] Réservation effectuée. ${data.node} a maintenant ${nodeMetrics.reservations.length} réservations.`);

    return of({message: `Réservation pour ${data.namespace} effectuée avec succès.`}).pipe(
      delay(1000)
    );
  }

  /**
   * Réalloue (supprime) les réservations et sauvegarde dans le localStorage.
   */
  reallocateGpus(nodeName: string): Observable<any> {
    console.log(`[Mock Service] Réallocation pour ${nodeName}...`);
    for (const cluster of this.mockClusters) {
      if (cluster.nodes[nodeName]) {
        cluster.nodes[nodeName].reservations = []; // Vide la liste

        // SAUVEGARDER LES MODIFICATIONS
        this.saveDataToLocalStorage();

        console.log(`[Mock Service] Réservations pour ${nodeName} vidées.`);
        break;
      }
    }
    return of({message: `GPUs sur ${nodeName} réalloués (simulation).`}).pipe(delay(500));
  }
}
