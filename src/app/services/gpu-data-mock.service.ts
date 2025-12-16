import {Injectable} from '@angular/core';
import {Observable, of, timer} from 'rxjs';
import {delay, map, shareReplay} from 'rxjs/operators';
import {ClusterApiResponse, NodeMetrics, ReservationDetail} from '../models/gpu.model';
import {AiModel} from '../models/aimodel.model';

// Interface pour le formulaire de réservation (MISE À JOUR)
export interface NamespaceReservation {
  cluster: string;
  node: string;
  namespace: string;
  application: string;
  gpusRequested: number;
  memoryRequest: number; // NOUVEAU
  cpuRequest: number;    // NOUVEAU
}

// Interface pour la liste (MISE À JOUR)
export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

// Clé pour le stockage local
const STORAGE_KEY = 'gpuFarmMockData';

export const MOCK_APPLICATIONS_LIST = [
  'Jupyter Notebook',
  'Triton Inference Server',
  'LLM Training',
  'Stable Diffusion',
  'TensorFlow Job',
  'PyTorch Job',
  'Autre'
];

// Données initiales (utilisées uniquement si localStorage est vide) (MISE À JOUR)
const INITIAL_MOCK_DATA: ClusterApiResponse[] = [
  {
    total_physical_gpus: 12,
    cluster_name: 'HPI A',
    // ... (autres champs inchangés)
    total_virtual_gpus: 12, total_used_gpus: 0, global_gpu_usage_percent: 0,
    total_memory_gb: 512, total_cpu_cores: 128, total_used_memory_gb: 0, total_used_cpu_cores: 0,
    nodes: {
      "A100": {
        owner: 'Équipe IA', status: 'En ligne',
        physical_gpus: 4, virtual_gpus: 4, reserved_gpus: 3, used_gpus: 3,
        used_mig_units: 0, gpu_usage_percent: 88,
        total_memory_gb: 128, reserved_memory_gb: 48, total_cpu_cores: 32, reserved_cpu_cores: 12,
        reservations: [
          {
            namespace: 'alpha-train',
            application: 'Jupyter + PyTorch 2.0', // Nom mis à jour
            gpusRequested: 2, memoryRequest: 32, cpuRequest: 8,
            createdAt: new Date(Date.now() - 3600000), isActive: true
          }
        ]
      },
      "H200": {
        owner: 'Infrastructure', status: 'Maintenance',
        physical_gpus: 8, virtual_gpus: 8, reserved_gpus: 2, used_gpus: 1,
        used_mig_units: 0, gpu_usage_percent: 13,
        total_memory_gb: 256, reserved_memory_gb: 64, total_cpu_cores: 64, reserved_cpu_cores: 16,
        reservations: [
          {
            namespace: 'beta-inference',
            application: 'Llama 3 70B Instruct', // Nom mis à jour
            gpusRequested: 2, memoryRequest: 64, cpuRequest: 16,
            createdAt: new Date(Date.now() - 86400000), isActive: false
          }
        ]
      },
    }
  },
  {
    total_physical_gpus: 16,
    cluster_name: 'HPI B',
    // ... (autres champs inchangés)
    total_virtual_gpus: 16, total_used_gpus: 0, global_gpu_usage_percent: 0,
    total_memory_gb: 1024, total_cpu_cores: 256, total_used_memory_gb: 0, total_used_cpu_cores: 0,
    nodes: {
      "H200": {
        owner: 'Mistral', status: 'Blocked',
        physical_gpus: 8, virtual_gpus: 8, reserved_gpus: 0, used_gpus: 0,
        used_mig_units: 0, gpu_usage_percent: 0,
        total_memory_gb: 512, reserved_memory_gb: 80, total_cpu_cores: 128, reserved_cpu_cores: 32,
        reservations: [
          {
            namespace: 'data-science',
            application: 'Mixtral 8x7B (MoE)', // Nom mis à jour
            gpusRequested: 4, memoryRequest: 64, cpuRequest: 24,
            createdAt: new Date(Date.now() - 1800000), isActive: true
          }
        ]
      },
      "L40S": {
        owner: 'Data Science', status: 'En Ligne',
        physical_gpus: 4, virtual_gpus: 4, reserved_gpus: 0, used_gpus: 0,
        used_mig_units: 0, gpu_usage_percent: 0,
        total_memory_gb: 512, reserved_memory_gb: 0, total_cpu_cores: 128, reserved_cpu_cores: 0,
        reservations: []
      }
    }
  }
];

export const MOCK_AI_MODELS: AiModel[] = [
  // --- Environnements de Développement (IDE) ---
  {
    id: 'jupyter-lab-std',
    name: 'Jupyter Lab Standard',
    type: 'IDE',
    description: 'Environnement Python générique (NumPy, Pandas).',
    vramRequiredGb: 2,
    source: 'Interne',
    tags: ['Dev', 'Python', 'CPU']
  },
  {
    id: 'jupyter-pytorch',
    name: 'Jupyter + PyTorch 2.0',
    type: 'IDE',
    description: 'Notebook optimisé pour le Deep Learning avec CUDA 12.',
    vramRequiredGb: 8,
    source: 'NVIDIA NGC',
    tags: ['Dev', 'AI', 'PyTorch']
  },
  {
    id: 'jupyter-tensorflow',
    name: 'Jupyter + TensorFlow',
    type: 'IDE',
    description: 'Environnement complet pour TensorFlow / Keras.',
    vramRequiredGb: 8,
    source: 'Google',
    tags: ['Dev', 'AI', 'TensorFlow']
  },
  {
    id: 'vscode-server',
    name: 'VS Code Server',
    type: 'IDE',
    description: 'IDE complet accessible via navigateur.',
    vramRequiredGb: 4,
    source: 'Microsoft',
    tags: ['Dev', 'IDE', 'Code']
  },

  // --- Modèles LLM & IA ---
  {
    id: 'llama-3-8b',
    name: 'Llama 3 8B Instruct',
    type: 'LLM',
    description: 'Modèle rapide pour assistants et tâches simples.',
    vramRequiredGb: 16,
    source: 'Meta',
    tags: ['NLP', 'Chat', 'Fast']
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B Instruct',
    type: 'LLM',
    description: 'Modèle haute performance pour raisonnement complexe.',
    vramRequiredGb: 48,
    source: 'Meta',
    tags: ['NLP', 'Reasoning', 'High-VRAM']
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B v0.3',
    type: 'LLM',
    description: 'Modèle très efficient avec fenêtre de contexte étendue.',
    vramRequiredGb: 14,
    source: 'Mistral AI',
    tags: ['NLP', 'Efficient']
  },
  {
    id: 'mixtral-8x7b',
    name: 'Mixtral 8x7B (MoE)',
    type: 'LLM',
    description: 'Mixture of Experts, rivalise avec GPT-3.5.',
    vramRequiredGb: 32,
    source: 'Mistral AI',
    tags: ['NLP', 'MoE', 'Advanced']
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    type: 'Vision',
    description: 'Génération d\'images photoréalistes.',
    vramRequiredGb: 12,
    source: 'Stability AI',
    tags: ['Image', 'GenAI']
  },
  {
    id: 'whisper-large',
    name: 'Whisper Large v3',
    type: 'Audio',
    description: 'Transcription audio multilingue précise.',
    vramRequiredGb: 10,
    source: 'OpenAI',
    tags: ['Audio', 'ASR']
  }
];

@Injectable({
  providedIn: 'root'
})
export class GpuDataServiceMock {

  private readonly mockClusters: ClusterApiResponse[];

  getAvailableApplications(): Observable<string[]> {
    return of(MOCK_APPLICATIONS_LIST);
  }

  getAvailableModels(): Observable<AiModel[]> {
    return of(MOCK_AI_MODELS).pipe(delay(500)); // Simule un petit délai réseau
  }

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
        // Nettoyage des dates et états
        parsedData.forEach(cluster => {
          Object.values(cluster.nodes).forEach(node => {
            if (!node.owner) {
              node.owner = 'Non assigné';
            }
            if (!node.status) {
              node.status = 'En ligne';
            }
            if (node.reservations) {
              node.reservations.forEach(res => {
                res.createdAt = new Date(res.createdAt);
                res.isActive = res.isActive ?? true;
                res.memoryRequest = res.memoryRequest || 0;
                res.cpuRequest = res.cpuRequest || 0;
              });
            }
          });
        });
        return parsedData;
      } else {
        console.log('[Mock Service] Pas de données. Initialisation avec les données mock.');
        // Copie profonde pour éviter les mutations de l'original
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

  // L'observable qui recalcule tout (MISE À JOUR)
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 2000).pipe(
    map(() => {

      // Boucle pour recalculer tous les totaux à partir des réservations
      for (const cluster of this.mockClusters) {
        let clusterTotalUsedGpus = 0;
        let clusterTotalUsedMemory = 0;
        let clusterTotalUsedCpu = 0;
        let clusterGpuUsagePercent = 0;
        let nodeCount = 0;

        for (const nodeName in cluster.nodes) {
          const node = cluster.nodes[nodeName] as NodeMetrics;
          nodeCount++;
          node.reservations = node.reservations || [];

          const activeReservations = node.reservations.filter(res => res.isActive);

          // 1. 'reserved_...' = total de TOUTES les réservations (actives ou non)
          node.reserved_gpus = node.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
          node.reserved_memory_gb = node.reservations.reduce((sum, res) => sum + res.memoryRequest, 0);
          node.reserved_cpu_cores = node.reservations.reduce((sum, res) => sum + res.cpuRequest, 0);

          // 2. 'used_...' = total des réservations ACTIVES
          node.used_gpus = activeReservations.reduce((sum, res) => sum + res.gpusRequested, 0);
          // (Nous n'avons pas de 'used_memory' ou 'used_cpu' dans le modèle, mais nous les calculons pour le cluster)
          const nodeUsedMemory = activeReservations.reduce((sum, res) => sum + res.memoryRequest, 0);
          const nodeUsedCpu = activeReservations.reduce((sum, res) => sum + res.cpuRequest, 0);

          // 3. Mettre à jour le pourcentage d'utilisation GPU du nœud
          if (node.physical_gpus > 0) {
            node.gpu_usage_percent = Math.round((node.used_gpus / node.physical_gpus) * 100);
          } else {
            node.gpu_usage_percent = 0;
          }

          // 4. Cumuler pour les totaux du cluster
          clusterTotalUsedGpus += node.used_gpus;
          clusterTotalUsedMemory += nodeUsedMemory;
          clusterTotalUsedCpu += nodeUsedCpu;
          clusterGpuUsagePercent += node.gpu_usage_percent;
        }

        // Mettre à jour les totaux du cluster
        cluster.total_used_gpus = clusterTotalUsedGpus;
        cluster.total_used_memory_gb = clusterTotalUsedMemory;
        cluster.total_used_cpu_cores = clusterTotalUsedCpu;

        if (nodeCount > 0) {
          cluster.global_gpu_usage_percent = Math.round(clusterGpuUsagePercent / nodeCount);
        } else {
          cluster.global_gpu_usage_percent = 0;
        }
      }

      // Retourne une copie profonde pour éviter les mutations
      return JSON.parse(JSON.stringify(this.mockClusters));
    }),
    shareReplay(1)
  );

  // Création de réservation (MISE À JOUR)
  createNamespaceReservation(data: NamespaceReservation): Observable<any> {
    console.log('[Mock Service] Tentative de réservation:', data);

    const cluster = this.mockClusters.find(c => c.cluster_name === data.cluster);
    if (!cluster) {
      return of({message: `Erreur: Cluster ${data.cluster} non trouvé.`}).pipe(delay(1000));
    }
    const nodeMetrics = cluster.nodes[data.node];
    if (!nodeMetrics) {
      return of({message: `Erreur: Nœud ${data.node} non trouvé.`}).pipe(delay(1000));
    }

    // Calculer les ressources déjà réservées sur ce nœud
    const currentReservedGpus = nodeMetrics.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
    const currentReservedMem = nodeMetrics.reservations.reduce((sum, res) => sum + res.memoryRequest, 0);
    const currentReservedCpu = nodeMetrics.reservations.reduce((sum, res) => sum + res.cpuRequest, 0);

    // Calculer les ressources disponibles
    const gpusAvailable = nodeMetrics.physical_gpus - currentReservedGpus;
    const memAvailable = nodeMetrics.total_memory_gb - currentReservedMem;
    const cpuAvailable = nodeMetrics.total_cpu_cores - currentReservedCpu;

    // Vérifier si la demande dépasse les disponibilités
    if (gpusAvailable < data.gpusRequested) {
      return of({message: `Erreur: Pas assez de GPUs disponibles (demandé: ${data.gpusRequested}, dispo: ${gpusAvailable}).`})
        .pipe(delay(1000));
    }
    if (memAvailable < data.memoryRequest) {
      return of({message: `Erreur: Pas assez de mémoire disponible (demandé: ${data.memoryRequest}Go, dispo: ${memAvailable}Go).`})
        .pipe(delay(1000));
    }
    if (cpuAvailable < data.cpuRequest) {
      return of({message: `Erreur: Pas assez de CPU disponibles (demandé: ${data.cpuRequest}, dispo: ${cpuAvailable}).`})
        .pipe(delay(1000));
    }

    // Tout est bon, créer la réservation
    const newReservation: ReservationDetail = {
      namespace: data.namespace,
      application: data.application,
      gpusRequested: data.gpusRequested,
      memoryRequest: data.memoryRequest, // NOUVEAU
      cpuRequest: data.cpuRequest,       // NOUVEAU
      createdAt: new Date(),
      isActive: true // Active par défaut
    };

    nodeMetrics.reservations.push(newReservation);
    this.saveDataToLocalStorage(); // Sauvegarder

    return of({message: `Réservation pour ${data.namespace} effectuée avec succès.`}).pipe(delay(1000));
  }

// Basculement de statut (logique inchangée, elle change 'isActive')
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
          console.log(`[Mock Service] Statut changé pour ${reservation.namespace}: ${targetReservation.isActive}`);
          return of({success: true, newState: targetReservation.isActive});
        }
      }
    }
    console.error('[Mock Service] Réservation non trouvée pour basculement:', reservation);
    return of({success: false, error: 'Réservation non trouvée'});
  }

  // **** NOUVELLE FONCTION HELPER (pour vérifier les ressources) ****
  private getNodeAvailableResources(node: NodeMetrics): { gpus: number, memory: number, cpu: number } {
    if (!node) {
      return { gpus: 0, memory: 0, cpu: 0 };
    }

    const reservedGpus = node.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
    const reservedMem = node.reservations.reduce((sum, res) => sum + res.memoryRequest, 0);
    const reservedCpu = node.reservations.reduce((sum, res) => sum + res.cpuRequest, 0);

    return {
      gpus: node.physical_gpus - reservedGpus,
      memory: node.total_memory_gb - reservedMem,
      cpu: node.total_cpu_cores - reservedCpu
    };
  }

  moveReservationToNode(reservation: FlatReservation, targetNodeName: string): Observable<any> {
    // 1. Trouver le cluster source
    const sourceCluster = this.mockClusters.find(c => c.cluster_name === reservation.clusterName);
    if (!sourceCluster) {
      return of({ success: false, message: 'Cluster source non trouvé' });
    }

    // 2. Trouver le nœud source
    const sourceNode = sourceCluster.nodes[reservation.nodeName];
    if (!sourceNode) {
      return of({ success: false, message: 'Nœud source non trouvé' });
    }

    // 3. Trouver le nœud de destination (UNIQUEMENT DANS LE MÊME CLUSTER)
    // On ne cherche plus dans tous les clusters via une boucle globale
    const targetNode = sourceCluster.nodes[targetNodeName];

    if (!targetNode) {
      // Petite vérification supplémentaire pour donner un message clair
      const existsElsewhere = this.mockClusters.some(c => c.nodes[targetNodeName]);
      if (existsElsewhere) {
        return of({ success: false, message: `Interdit : Le nœud '${targetNodeName}' appartient à un autre cluster.` });
      }
      return of({ success: false, message: `Nœud de destination '${targetNodeName}' introuvable dans le cluster ${sourceCluster.cluster_name}.` });
    }

    // 4. Vérifier la capacité de la destination (Code existant inchangé)
    const available = this.getNodeAvailableResources(targetNode);

    if (available.gpus < reservation.gpusRequested) {
      return of({ success: false, message: `Pas assez de GPUs sur ${targetNodeName} (Dispo: ${available.gpus})` });
    }
    if (available.memory < reservation.memoryRequest) {
      return of({ success: false, message: `Pas assez de mémoire sur ${targetNodeName} (Dispo: ${available.memory}Go)` });
    }
    if (available.cpu < reservation.cpuRequest) {
      return of({ success: false, message: `Pas assez de CPU sur ${targetNodeName} (Dispo: ${available.cpu})` });
    }

    // 5. Retrouver et déplacer la réservation (Code existant inchangé)
    const resIndex = sourceNode.reservations.findIndex(
      res => new Date(res.createdAt).getTime() === new Date(reservation.createdAt).getTime()
    );

    if (resIndex === -1) {
      return of({ success: false, message: 'Réservation non trouvée dans le nœud source' });
    }

    const [movedReservation] = sourceNode.reservations.splice(resIndex, 1);
    targetNode.reservations.push(movedReservation);

    this.saveDataToLocalStorage();
    console.log(`[Mock Service] Réservation ${reservation.namespace} déplacée de ${reservation.nodeName} à ${targetNodeName} (Même Cluster)`);

    return of({
      success: true,
      message: `Réservation déplacée vers ${targetNodeName}`
    }).pipe(delay(500));
  }

  deleteReservation(reservation: FlatReservation): Observable<any> {
    const cluster = this.mockClusters.find(c => c.cluster_name === reservation.clusterName);
    if (!cluster) {
      return of({ success: false, message: 'Cluster non trouvé' });
    }

    const node = cluster.nodes[reservation.nodeName];
    if (!node) {
      return of({ success: false, message: 'Nœud non trouvé' });
    }

    // Retrouver l'index de la réservation dans le nœud
    // Nous utilisons 'createdAt' comme identifiant unique
    const resIndex = node.reservations.findIndex(
      res => new Date(res.createdAt).getTime() === new Date(reservation.createdAt).getTime()
    );

    if (resIndex === -1) {
      // La réservation n'a pas été trouvée
      return of({ success: false, message: 'Réservation non trouvée à supprimer' });
    }

    // Supprimer la réservation du tableau en utilisant son index
    node.reservations.splice(resIndex, 1);

    // Sauvegarder les changements dans le localStorage
    this.saveDataToLocalStorage();
    console.log(`[Mock Service] Réservation ${reservation.namespace} supprimée de ${reservation.nodeName}`);

    // Renvoyer un succès
    return of({ success: true, message: 'Réservation supprimée avec succès.' }).pipe(delay(500));
  }
}
