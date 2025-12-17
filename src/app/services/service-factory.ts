import {HttpClient} from '@angular/common/http';
import {GpuDataService} from './gpu-data.service';
import {GpuDataServiceMock} from './gpu-data-mock.service';
import {GatewayDataService} from './gateway-data.service';
import {GatewayDataMockService} from './gateway-data-mock.service';

export function shouldUseMock(): boolean {
  const localForce = localStorage.getItem('FORCE_MOCK');
  console.log('%c[Factory] Vérification du mode...', 'color: blue; font-weight: bold;');
  console.log(`[Factory] Valeur de FORCE_MOCK dans localStorage : "${localForce}"`);

  if (localForce === 'true') return true;
  if (localForce === 'false') return false;

  // Par défaut : Mock (changez à false si vous voulez le Live par défaut)
  return true;
}

export function gpuDataServiceFactory(http: HttpClient) {
  if (shouldUseMock()) {
    console.warn('⚡ [Factory] Retourne : MOCK Service (GPU)');
    return new GpuDataServiceMock();
  }
  console.log('🌐 [Factory] Retourne : LIVE Service (GPU)');
  return new GpuDataService(http);
}

export function gatewayDataServiceFactory(http: HttpClient) {
  if (shouldUseMock()) {
    return new GatewayDataMockService();
  }
  return new GatewayDataService(http);
}
