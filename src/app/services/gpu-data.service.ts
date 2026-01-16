import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable, timer} from 'rxjs';
import {catchError, shareReplay, switchMap} from 'rxjs/operators';
import {ClusterApiResponse, ReservationDetail} from '../models/gpu.model';
import {AiModel} from '../models/aimodel.model';
import {ENV_CONFIG} from '../core/env.config';

// Interfaces de réponse API
export interface ApiMessageResponse {
  message: string;
}

export interface ReservationCreationResponse extends ApiMessageResponse {
  reservation: ReservationDetail; // Assurez-vous que ReservationDetail correspond bien à l'objet renvoyé par le serveur
}

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

export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

@Injectable({
  providedIn: 'root'
})
export class GpuDataService {
  constructor(private http: HttpClient) {
    console.log('%c✅ SERVICE RÉEL (HTTP) INSTANCIÉ', 'background: green; color: white; padding: 4px; font-size: 14px');
  }
  private env = inject(ENV_CONFIG);
  // Utilisation de l'environnement pour l'URL de l'API
  private readonly apiUrl = this.env.apiUrl;

  // 1. POLLING DES CLUSTERS
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 5000).pipe(
    switchMap(() =>
      this.http.get<ClusterApiResponse[]>(`${this.apiUrl}/clusters`).pipe(
        // Si le serveur est coupé, on capture l'erreur ICI
        catchError(err => {
          console.warn('⚠️ Serveur injoignable, nouvelle tentative dans 5s...');
          // On retourne EMPTY pour dire "pas de nouvelle valeur pour ce tour",
          // mais on ne tue PAS le flux principal du timer.
          return EMPTY;
        })
      )
    ),
    shareReplay(1)
  );

  // 2. DONNÉES STATIQUES
  getAvailableApplications(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/config/applications`);
  }

  getAvailableModels(): Observable<AiModel[]> {
    return this.http.get<AiModel[]>(`${this.apiUrl}/config/models`);
  }

  // 3. ACTIONS SUR LES RÉSERVATIONS (Typage strict appliqué)

  /**
   * Créer une nouvelle réservation
   * Le serveur renvoie { message: string, reservation: object }
   */
  createNamespaceReservation(data: NamespaceReservation): Observable<ReservationCreationResponse> {
    return this.http.post<ReservationCreationResponse>(`${this.apiUrl}/reservations`, data);
  }

  /**
   * Activer / Désactiver une réservation
   * Le serveur renvoie { message: string }
   */
  toggleReservationStatus(reservation: FlatReservation): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/reservations/toggle`, {
      cluster: reservation.clusterName,
      node: reservation.nodeName,
      namespace: reservation.namespace
    });
  }

  /**
   * Déplacer une réservation vers un autre nœud
   * Le serveur renvoie { message: string }
   */
  moveReservationToNode(reservation: FlatReservation, targetNodeName: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/reservations/move`, {
      cluster: reservation.clusterName,
      sourceNode: reservation.nodeName,
      targetNode: targetNodeName,
      namespace: reservation.namespace
    });
  }

  /**
   * Supprimer une réservation
   * Le serveur renvoie { message: string }
   */
  deleteReservation(reservation: FlatReservation): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/reservations`, {
      body: {
        cluster: reservation.clusterName,
        node: reservation.nodeName,
        namespace: reservation.namespace
      }
    });
  }

  /**
   * Mettre à jour le modèle associé à une réservation
   * Le serveur renvoie { message: string }
   */
  updateReservationModel(reservation: FlatReservation, newModelName: string): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(`${this.apiUrl}/reservations/model`, {
      cluster: reservation.clusterName,
      node: reservation.nodeName,
      namespace: reservation.namespace,
      modelName: newModelName
    });
  }

  /**
   * Déployer le namespace
   * Le serveur renvoie { message: string }
   */
  deployNamespace(reservation: FlatReservation): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/reservations/deploy`, {
      cluster: reservation.clusterName,
      namespace: reservation.namespace
    });
  }

  /**
   * Active ou désactive le drainage d'un nœud.
   * Le serveur renvoie { message: string }
   * @param nodeName Le nom du nœud à drainer ou undrainer.
   */
  toggleNodeDrain(nodeName: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/nodes/toggle-drain`, {
      nodeName
    });
  }

}
