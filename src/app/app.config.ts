import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {HttpClient, provideHttpClient} from '@angular/common/http';
import {provideAnimations} from '@angular/platform-browser/animations';

import {routes} from './app.routes';
import {GpuDataService} from './services/gpu-data.service';
import {GatewayDataService} from './services/gateway-data.service';
import {gatewayDataServiceFactory, gpuDataServiceFactory} from './services/service-factory.service';

console.log('🚀 [DEBUG] Le fichier app.config.ts est bien chargé !');


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),

    // --- C'EST ICI QUE TOUT SE JOUE ---

    // 1. Configuration pour le service GPU
    {
      provide: GpuDataService,
      useFactory: gpuDataServiceFactory, // <-- Doit utiliser la Factory !
      deps: [HttpClient]                 // <-- Nécessaire pour passer 'http'
    },

    // 2. Configuration pour le service Gateway
    {
      provide: GatewayDataService,
      useFactory: gatewayDataServiceFactory,
      deps: [HttpClient]
    }
  ]
};
