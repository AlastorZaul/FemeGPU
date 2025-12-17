import {HttpClient} from '@angular/common/http';
import {GpuDataService} from './gpu-data.service';
import {GpuDataServiceMock} from './gpu-data-mock.service';
import {GatewayDataService} from './gateway-data.service';
import {GatewayDataMockService} from './gateway-data-mock.service';

function shouldUseMock(): boolean {
  const localForce = localStorage.getItem('FORCE_MOCK');
  console.log('[Factory] Valeur de FORCE_MOCK :', localForce); // <-- LOG DEBUG

  if (localForce === 'true') return true;
  if (localForce === 'false') return false;

  return false; // Par défaut : Réel
}

export function gpuDataServiceFactory(http: HttpClient) {
  if (shouldUseMock()) {
    console.log('🏭 [Factory] Création du service GPU : MOCK');
    return new GpuDataServiceMock();
  }
  console.log('🏭 [Factory] Création du service GPU : LIVE API');
  return new GpuDataService(http);
}

export function gatewayDataServiceFactory(http: HttpClient) {
  if (shouldUseMock()) {
    return new GatewayDataMockService();
  }
  return new GatewayDataService(http);
}
