export interface ReservationDetail {
  namespace: string;
  application: string;
  gpusRequested: number;
  createdAt: Date; // Pour savoir quand elle a été créée
  isActive: boolean;
}


// Interface pour les métriques d'un nœud (node)
export interface NodeMetrics {
  physical_gpus: number;
  virtual_gpus: number;
  reserved_gpus: number;
  used_gpus: number;
  used_mig_units: number;
  gpu_usage_percent: number;
  reservations: ReservationDetail[]
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
}
