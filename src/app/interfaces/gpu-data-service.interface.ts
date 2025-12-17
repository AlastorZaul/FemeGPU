import {Observable} from 'rxjs';
import {ClusterApiResponse} from '../models/gpu.model';
import {AiModel} from '../models/aimodel.model';
import {FlatReservation, NamespaceReservation} from '../services/gpu-data.service';

export interface IGpuDataService {
  clusterData$: Observable<ClusterApiResponse[]>;

  getAvailableApplications(): Observable<string[]>;

  getAvailableModels(): Observable<AiModel[]>;

  createNamespaceReservation(data: NamespaceReservation): Observable<any>;

  toggleReservationStatus(reservation: FlatReservation): Observable<any>;

  moveReservationToNode(reservation: FlatReservation, targetNodeName: string): Observable<any>;

  deleteReservation(reservation: FlatReservation): Observable<any>;

  updateReservationModel(reservation: FlatReservation, newModelName: string): Observable<any>;

  deployNamespace(reservation: FlatReservation): Observable<any>;
}
