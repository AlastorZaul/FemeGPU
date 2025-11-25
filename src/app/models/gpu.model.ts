export interface ReservationDetail {
  namespace: string;
  application: string;
  gpusRequested: number;
  memoryRequest: number; // NOUVEAU (ex: en Go)
  cpuRequest: number;    // NOUVEAU (ex: en Cores)
  createdAt: Date; // Pour savoir quand elle a été créée
  isActive: boolean;
}


// Interface pour les métriques d'un nœud (node)
export interface NodeMetrics {
  owner: string;
  physical_gpus: number;
  virtual_gpus: number;
  reserved_gpus: number;
  used_gpus: number;
  used_mig_units: number;
  gpu_usage_percent: number;
  reservations: ReservationDetail[];
  total_memory_gb: number;
  reserved_memory_gb: number;
  total_cpu_cores: number;
  reserved_cpu_cores: number;
}

// Interface principale pour la réponse de l'API
export interface ClusterApiResponse {
  total_physical_gpus: number;
  total_virtual_gpus: number;
  total_used_gpus: number;
  global_gpu_usage_percent: number;
  nodes: {
    // La clé est le nom du nœud (ex: "syy0ia1017")
    [nodeName: string]: NodeMetrics;
  };
  cluster_name: string;

  // NOUVEAUX TOTAUX GLOBAUX (Optionnel, mais cohérent)
  total_memory_gb: number;
  total_cpu_cores: number;
  total_used_memory_gb: number; // Calculé par le backend
  total_used_cpu_cores: number; // Calculé par le backend
}

export interface Gateway {
  id: string;
  name: string;
  ipAddress: string;
  // Statut étendu pour inclure un état de transition
  status: 'Online' | 'Offline' | 'Restarting';
  // Champ optionnel pour les messages d'erreur
  errorMessage?: string;
}
