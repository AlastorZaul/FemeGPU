import {Injectable} from '@angular/core';
import {Observable, of, timer} from 'rxjs';
import {delay, map, shareReplay} from 'rxjs/operators';
import {ClusterApiResponse, ReservationDetail} from '../models/gpu.model';
import {AiModel} from '../models/aimodel.model';
import {IGpuDataService} from '../interfaces/gpu-data-service.interface';

// Interface pour le formulaire de réservation (MISE À JOUR)
export interface NamespaceReservation {
  cluster: string;
  node: string;
  namespace: string;
  application: string;
  modelName?: string;
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
            application: 'Jupyter Notebook',
            modelName: 'Jupyter + PyTorch 2.0',
            gpusRequested: 2,
            memoryRequest: 32,
            cpuRequest: 8,
            createdAt: new Date(Date.now() - 3600000),
            isActive: true
          },
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
            application: 'Triton Inference Server',
            modelName: 'Llama 3 70B Instruct',
            gpusRequested: 2,
            memoryRequest: 64,
            cpuRequest: 16,
            createdAt: new Date(Date.now() - 86400000),
            isActive: false
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
            application: 'LLM Training',
            modelName: 'Llama 3 70B Instruct',
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
export class GpuDataServiceMock implements IGpuDataService {

  private readonly mockClusters: ClusterApiResponse[];

  constructor() {
    this.mockClusters = this.loadDataFromLocalStorage();
  }

  // 3. RETOUR ARRIÈRE : Retourne la liste simple des applications génériques
  getAvailableApplications(): Observable<string[]> {
    return of(MOCK_APPLICATIONS_LIST);
  }

  getAvailableModels(): Observable<AiModel[]> {
    return of(MOCK_AI_MODELS).pipe(delay(300));
  }

  // ... (Le reste du service reste identique : saveData, loadData, clusterData$, createNamespaceReservation...)
  // Copiez le reste des méthodes (saveDataToLocalStorage, loadDataFromLocalStorage, clusterData$, etc.) depuis votre fichier actuel.
  // Elles ne nécessitent pas de modification de logique.

  private saveDataToLocalStorage(): void {
    try {
      const dataToStore = JSON.stringify(this.mockClusters);
      localStorage.setItem(STORAGE_KEY, dataToStore);
    } catch (e) {
      console.error('Erreur save storage', e);
    }
  }

  private loadDataFromLocalStorage(): ClusterApiResponse[] {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      const initialData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    } catch (e) {
      const initialData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      return initialData;
    }
  }

  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 2000).pipe(
    map(() => {
      // Recalcul des totaux (logique identique)
      for (const cluster of this.mockClusters) {
        let clusterTotalUsedGpus = 0;
        let clusterTotalUsedMemory = 0;
        let clusterTotalUsedCpu = 0;
        let nodeCount = 0;
        let clusterGpuUsagePercent = 0;

        for (const nodeName in cluster.nodes) {
          const node = cluster.nodes[nodeName];
          nodeCount++;
          node.reservations = node.reservations || [];
          const activeReservations = node.reservations.filter(res => res.isActive);

          node.reserved_gpus = node.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
          node.reserved_memory_gb = node.reservations.reduce((sum, res) => sum + res.memoryRequest, 0);
          node.reserved_cpu_cores = node.reservations.reduce((sum, res) => sum + res.cpuRequest, 0);

          node.used_gpus = activeReservations.reduce((sum, res) => sum + res.gpusRequested, 0);
          const nodeUsedMemory = activeReservations.reduce((sum, res) => sum + res.memoryRequest, 0);
          const nodeUsedCpu = activeReservations.reduce((sum, res) => sum + res.cpuRequest, 0);

          if (node.physical_gpus > 0) {
            node.gpu_usage_percent = Math.round((node.used_gpus / node.physical_gpus) * 100);
          } else {
            node.gpu_usage_percent = 0;
          }

          clusterTotalUsedGpus += node.used_gpus;
          clusterTotalUsedMemory += nodeUsedMemory;
          clusterTotalUsedCpu += nodeUsedCpu;
          clusterGpuUsagePercent += node.gpu_usage_percent;
        }
        cluster.total_used_gpus = clusterTotalUsedGpus;
        cluster.total_used_memory_gb = clusterTotalUsedMemory;
        cluster.total_used_cpu_cores = clusterTotalUsedCpu;
        cluster.global_gpu_usage_percent = nodeCount > 0 ? Math.round(clusterGpuUsagePercent / nodeCount) : 0;
      }
      return JSON.parse(JSON.stringify(this.mockClusters));
    }),
    shareReplay(1)
  );

  createNamespaceReservation(data: NamespaceReservation): Observable<any> {
    const cluster = this.mockClusters.find(c => c.cluster_name === data.cluster);
    if (!cluster) return of({message: 'Cluster non trouvé'});
    const node = cluster.nodes[data.node];
    if (!node) return of({message: 'Nœud non trouvé'});

    const currentReservedGpus = node.reservations.reduce((sum, res) => sum + res.gpusRequested, 0);
    if ((node.physical_gpus - currentReservedGpus) < data.gpusRequested) {
      return of({message: 'Pas assez de GPUs'});
    }

    const newReservation: ReservationDetail = {
      namespace: data.namespace,
      application: data.application,
      modelName: data.modelName, // Ajout du modelName
      gpusRequested: data.gpusRequested,
      memoryRequest: data.memoryRequest,
      cpuRequest: data.cpuRequest,
      createdAt: new Date(),
      isActive: true
    };
    node.reservations.push(newReservation);
    this.saveDataToLocalStorage();
    return of({message: 'Réservation réussie'}).pipe(delay(500));
  }

  toggleReservationStatus(reservation: FlatReservation): Observable<any> {
    const cluster = this.mockClusters.find(c => c.cluster_name === reservation.clusterName);
    if (cluster) {
      const node = cluster.nodes[reservation.nodeName];
      if (node) {
        const targetReservation = node.reservations.find(
          res => new Date(res.createdAt).getTime() === new Date(reservation.createdAt).getTime()
        );
        if (targetReservation) {
          targetReservation.isActive = !targetReservation.isActive;
          this.saveDataToLocalStorage();
          return of({success: true, newState: targetReservation.isActive});
        }
      }
    }
    return of({success: false, error: 'Réservation non trouvée'});
  }

  moveReservationToNode(reservation: FlatReservation, targetNodeName: string): Observable<any> {
    const sourceCluster = this.mockClusters.find(c => c.cluster_name === reservation.clusterName);
    if (!sourceCluster) return of({success: false, message: 'Cluster source non trouvé'});
    const sourceNode = sourceCluster.nodes[reservation.nodeName];
    const targetNode = sourceCluster.nodes[targetNodeName];

    if (!sourceNode || !targetNode) return of({success: false, message: 'Nœud introuvable'});

    const resIndex = sourceNode.reservations.findIndex(
      res => new Date(res.createdAt).getTime() === new Date(reservation.createdAt).getTime()
    );
    if (resIndex === -1) return of({success: false, message: 'Réservation non trouvée'});

    const [movedReservation] = sourceNode.reservations.splice(resIndex, 1);
    targetNode.reservations.push(movedReservation);

    this.saveDataToLocalStorage();
    return of({success: true, message: `Déplacé vers ${targetNodeName}`});
  }

  deleteReservation(reservation: FlatReservation): Observable<any> {
    const cluster = this.mockClusters.find(c => c.cluster_name === reservation.clusterName);
    if (!cluster) return of({success: false});
    const node = cluster.nodes[reservation.nodeName];
    if (!node) return of({success: false});

    const resIndex = node.reservations.findIndex(
      res => new Date(res.createdAt).getTime() === new Date(reservation.createdAt).getTime()
    );
    if (resIndex !== -1) {
      node.reservations.splice(resIndex, 1);
      this.saveDataToLocalStorage();
      return of({success: true, message: 'Supprimé'});
    }
    return of({success: false});
  }

  updateReservationModel(reservation: FlatReservation, newModelName: string): Observable<any> {
    const cluster = this.mockClusters.find(c => c.cluster_name === reservation.clusterName);
    if (!cluster) return of({success: false, message: 'Cluster non trouvé'});

    const node = cluster.nodes[reservation.nodeName];
    if (!node) return of({success: false, message: 'Nœud non trouvé'});

    const targetReservation = node.reservations.find(
      res => new Date(res.createdAt).getTime() === new Date(reservation.createdAt).getTime()
    );

    if (targetReservation) {
      targetReservation.modelName = newModelName; // Mise à jour du champ
      this.saveDataToLocalStorage();
      console.log(`[Mock Service] Modèle mis à jour pour ${reservation.namespace} : ${newModelName}`);
      return of({success: true, message: 'Modèle attaché avec succès.'});
    }

    return of({success: false, message: 'Réservation introuvable.'});
  }

  deployNamespace(reservation: FlatReservation): Observable<any> {
    console.log(`[Mock] Deploy namespace: ${reservation.namespace}`);
    return of({success: true, message: 'Déploiement Mock OK'}).pipe(delay(800));
  }
}
