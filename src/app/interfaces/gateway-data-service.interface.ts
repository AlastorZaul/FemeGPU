import {Observable} from 'rxjs';
import {Gateway} from '../models/gpu.model';

export interface IGatewayDataService {
  // La liste observable des gateways
  gateways$: Observable<Gateway[]>;

  // L'action de redémarrage
  restartGateway(gatewayId: string): Observable<any>;
}
