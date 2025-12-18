import {HttpClient} from '@angular/common/http';
import {GpuDataService} from './gpu-data.service';
import {GpuDataServiceMock} from './gpu-data-mock.service';
import {GatewayDataService} from './gateway-data.service';
import {GatewayDataMockService} from './gateway-data-mock.service';
// Importez l'environnement pour la valeur par défaut
import {environment} from '../../environments/environment';

export function shouldUseMock(): boolean {
  const rawValue = localStorage.getItem('FORCE_MOCK');

  // Nettoyage : suppression des espaces et mise en minuscule
  const localForce = rawValue ? rawValue.trim().toLowerCase() : null;

  console.groupCollapsed('[Factory] Debug Decision Mock/Live');
  console.log(`1. Valeur brute localStorage (FORCE_MOCK) : "${rawValue}"`);
  console.log(`2. Valeur nettoyée : "${localForce}"`);
  console.log(`3. Valeur environment.useMock : ${environment.useMock}`);

  // Vérification prioritaire sur le localStorage
  if (localForce === 'true') {
    console.log('=> Décision : MOCK (Forcé via localStorage)');
    console.groupEnd();
    return true;
  }

  if (localForce === 'false') {
    console.log('=> Décision : LIVE (Forcé via localStorage)');
    console.groupEnd();
    return false;
  }

  // Fallback sur l'environnement
  const defaultMode = environment.useMock;
  console.log(`=> Décision : ${defaultMode ? 'MOCK' : 'LIVE'} (Via environment.ts)`);
  console.groupEnd();

  return defaultMode;
}

export function gpuDataServiceFactory(http: HttpClient) {
  if (shouldUseMock()) {
    return new GpuDataServiceMock();
  }
  return new GpuDataService(http);
}

export function gatewayDataServiceFactory(http: HttpClient) {
  if (shouldUseMock()) {
    return new GatewayDataMockService();
  }
  return new GatewayDataService(http);
}
