import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {delay, tap} from 'rxjs/operators';
import {Gateway} from '../models/gpu.model'; // Nous importons le modèle

// Clé pour le stockage local
const GATEWAY_STORAGE_KEY = 'gpuGatewayMockData';

// Données initiales pour les gateways
const INITIAL_MOCK_GATEWAYS: Gateway[] = [
  { id: 'gw-001', name: 'Gateway Principale - Datacenter A', ipAddress: '192.168.1.1', status: 'Online' },
  { id: 'gw-002', name: 'Gateway Secondaire - Datacenter A', ipAddress: '192.168.1.2', status: 'Offline', errorMessage: 'Erreur de connexion (Timeout)' },
  { id: 'gw-003', name: 'Gateway - Datacenter B', ipAddress: '10.10.0.1', status: 'Online' },
  { id: 'gw-004', name: 'Gateway - Dev', ipAddress: '10.20.0.1', status: 'Offline', errorMessage: 'Service arrêté par l\'utilisateur' },
];

@Injectable({
  providedIn: 'root'
})
export class GatewayDataMockService {

  private mockGateways: Gateway[] = this.loadGatewaysFromLocalStorage();
  private gateways = new BehaviorSubject<Gateway[]>(this.mockGateways);

  /** Observable public pour la liste des gateways */
  public gateways$ = this.gateways.asObservable();

  constructor() { }

  // --- Helpers pour les Gateways ---
  private loadGatewaysFromLocalStorage(): Gateway[] {
    const data = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    } else {
      localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_GATEWAYS));
      return INITIAL_MOCK_GATEWAYS;
    }
  }

  private saveGatewaysToLocalStorage(): void {
    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(this.mockGateways));
    // Émettre la nouvelle valeur
    this.gateways.next(this.mockGateways);
  }

  /**
   * Simule la relance d'une gateway.
   * Passe le statut à 'Restarting', attend, puis passe à 'Online'.
   */
  public restartGateway(gatewayId: string): Observable<{ success: boolean; message: string }> {
    const gwIndex = this.mockGateways.findIndex(g => g.id === gatewayId);
    if (gwIndex === -1) {
      return of({ success: false, message: 'Gateway non trouvée' }).pipe(delay(300));
    }

    // 1. Mettre la gateway en état "Restarting"
    this.mockGateways[gwIndex] = {
      ...this.mockGateways[gwIndex],
      status: 'Restarting',
      errorMessage: undefined
    };
    this.mockGateways = [...this.mockGateways]; // Cloner pour la détection de changement
    this.saveGatewaysToLocalStorage();

    // 2. Simuler le temps de redémarrage (2 secondes)
    return of({ success: true, message: 'Relance réussie' }).pipe(
      delay(2000),
      tap(() => {
        // 3. Mettre la gateway en "Online"
        const finalGwIndex = this.mockGateways.findIndex(g => g.id === gatewayId);
        if (finalGwIndex !== -1) {
          this.mockGateways[finalGwIndex] = {
            ...this.mockGateways[finalGwIndex],
            status: 'Online'
          };
          this.mockGateways = [...this.mockGateways];
          this.saveGatewaysToLocalStorage();
        }
      })
    );
  }
}
