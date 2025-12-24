import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, timer} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';
import {Gateway} from '../models/gpu.model';

@Injectable({
  providedIn: 'root'
})
export class GatewayDataService {
  constructor(private http: HttpClient) {
  }
  private readonly apiUrl = '/api';


  // POLLING DES GATEWAYS
  // Rafraîchit la liste toutes les 5 secondes
  public gateways$: Observable<Gateway[]> = timer(0, 5000).pipe(
    switchMap(() => this.http.get<Gateway[]>(`${this.apiUrl}/gateways`)),
    shareReplay(1)
  );

  /**
   * Redémarrer une gateway spécifique
   */
  restartGateway(gatewayId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/gateways/${gatewayId}/restart`, {});
  }
}
