import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';

import {routes} from './app.routes';
import {environment} from '../environments/environment'; // Import de l'environnement
import {GpuDataService} from './services/gpu-data.service';
import {GpuDataServiceMock} from './services/gpu-data-mock.service';
import {GatewayDataMockService} from './services/gateway-data-mock.service';
import {GatewayDataService} from './services/gateway-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: GpuDataService,
      // Si environment.useMock est vrai, on utilise le MockService, sinon le Service réel
      useClass: environment.useMock ? GpuDataServiceMock : GpuDataService
    },
    {
      provide: GatewayDataService,
      useClass: environment.useMock ? GatewayDataMockService : GatewayDataService
    }
  ]
};
