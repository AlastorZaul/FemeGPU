import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, timer} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';
import {ClusterApiResponse, ReservationDetail} from '../models/gpu.model';
import {AiModel} from '../models/aimodel.model';

// On réutilise les interfaces définies (ou importées depuis vos modèles si elles y sont)
export interface NamespaceReservation {
  cluster: string;
  node: string;
  namespace: string;
  application: string;
  modelName?: string;
  gpusRequested: number;
  memoryRequest: number;
  cpuRequest: number;
}

// On reprend l'interface FlatReservation utilisée dans les composants
export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

@Injectable({
  providedIn: 'root'
})
export class GpuDataService {
  private http = inject(HttpClient);
  // Préfixe de l'API (à configurer dans proxy.conf.json pour le dev)
  private readonly apiUrl = '/api';

  // 1. POLLING DES CLUSTERS
  // Rafraîchit les données toutes les 5 secondes
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 5000).pipe(
    switchMap(() => this.http.get<ClusterApiResponse[]>(`${this.apiUrl}/clusters`)),
    shareReplay(1)
  );

  // 2. DONNÉES STATIQUES (Applications & Modèles)
  getAvailableApplications(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/config/applications`);
  }

  getAvailableModels(): Observable<AiModel[]> {
    return this.http.get<AiModel[]>(`${this.apiUrl}/config/models`);
  }

  // 3. ACTIONS SUR LES RÉSERVATIONS

  /**
   * Créer une nouvelle réservation (Namespace)
   */
  createNamespaceReservation(data: NamespaceReservation): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservations`, data);
  }

  /**
   * Activer / Désactiver une réservation
   */
  toggleReservationStatus(reservation: FlatReservation): Observable<any> {
    // On envoie un payload identifiant la réservation
    return this.http.post(`${this.apiUrl}/reservations/toggle`, {
      cluster: reservation.clusterName,
      node: reservation.nodeName,
      namespace: reservation.namespace
    });
  }

  /**
   * Déplacer une réservation vers un autre nœud
   */
  moveReservationToNode(reservation: FlatReservation, targetNodeName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservations/move`, {
      cluster: reservation.clusterName,
      sourceNode: reservation.nodeName,
      targetNode: targetNodeName,
      namespace: reservation.namespace
    });
  }

  /**
   * Supprimer une réservation
   */
  deleteReservation(reservation: FlatReservation): Observable<any> {
    // Pour un DELETE avec body, on utilise l'option 'body'
    return this.http.delete(`${this.apiUrl}/reservations`, {
      body: {
        cluster: reservation.clusterName,
        node: reservation.nodeName,
        namespace: reservation.namespace
      }
    });
  }

  /**
   * Mettre à jour le modèle associé à une réservation
   */
  updateReservationModel(reservation: FlatReservation, newModelName: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reservations/model`, {
      cluster: reservation.clusterName,
      node: reservation.nodeName,
      namespace: reservation.namespace,
      modelName: newModelName
    });
  }

  /**
   * (Nouveau) Déployer le namespace (Action que nous avons ajoutée à la modale)
   */
  deployNamespace(reservation: FlatReservation): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservations/deploy`, {
      cluster: reservation.clusterName,
      namespace: reservation.namespace
    });
  }
}
