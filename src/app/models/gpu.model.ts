export interface GpuHistoryPoint {
  name: string | Date;
  value: number;
}

export interface Gpu {
  id: string;
  name: string;
  temperature: number;
  utilization: number;
  fanSpeed: number;
  status: 'En charge' | 'Inactif' | 'Erreur'; // Ajout du statut
  power: number | null;
  history: GpuHistoryPoint[];
}

export interface Cluster {
  id: string;
  name: string;
  gpus: Gpu[];
}
