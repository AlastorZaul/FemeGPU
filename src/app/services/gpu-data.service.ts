import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, timer} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';
// Importer tous les modèles nécessaires
import {ClusterApiResponse} from '../models/gpu.model';

// Interface pour le formulaire de réservation
export interface NamespaceReservation {
  cluster: string;
  node: string;
  namespace: string;
  application: string;
  gpusRequested: number;
}

// !! TOUTE LA LOGIQUE MOCK (INITIAL_MOCK_DATA, STORAGE_KEY, etc.) EST SUPPRIMÉE !!

@Injectable({
  providedIn: 'root'
})
export class GpuDataService {

  // 1. Injecter HttpClient et définir l'URL de base de l'API
  private http = inject(HttpClient);
  // L'URL de votre backend.
  // Si vous utilisez le proxy (proxy.conf.json), '/api' est correct.
  private apiUrl = '/api';

  // 2. Remplacer la simulation par un appel HTTP
  // Nous gardons le timer pour "poller" (rafraîchir) les données toutes les 5 secondes.
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 5000).pipe( // 5000ms = 5 secondes
    switchMap(() => {
      // À chaque tick du timer, fait un nouvel appel HTTP GET
      return this.http.get<ClusterApiResponse[]>(`${this.apiUrl}/clusters`);
    }),
    shareReplay(1) // Garde la dernière émission en cache pour les nouveaux abonnés
  );

  /**
   * Appelle le backend pour créer un namespace et réserver des GPUs.
   */
  createNamespaceReservation(data: NamespaceReservation): Observable<any> {
    console.log('[GpuDataService] Appel API POST /namespaces/create');
    return this.http.post(`${this.apiUrl}/namespaces/create`, data);
  }

  /**
   * Appelle le backend pour réallouer (libérer) les GPUs d'un nœud.
   */
  reallocateGpus(nodeName: string): Observable<any> {
    console.log(`[GGpuDataService] Appel API POST /nodes/${nodeName}/reallocate`);
    return this.http.post(`${this.apiUrl}/nodes/${nodeName}/reallocate`, {});
  }
}
