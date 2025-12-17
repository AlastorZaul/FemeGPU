import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {HttpClient, provideHttpClient} from '@angular/common/http';
import {provideAnimations} from '@angular/platform-browser/animations';

import {routes} from './app.routes';
import {GpuDataService} from './services/gpu-data.service';
import {GatewayDataService} from './services/gateway-data.service';

// On importe les factories
import {gatewayDataServiceFactory, gpuDataServiceFactory} from './services/service-factory';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),

    // --- CONFIGURATION DU GPU SERVICE ---
    {
      provide: GpuDataService,        // Quand un composant demande "GpuDataService"
      useFactory: gpuDataServiceFactory, // Angular exécute cette fonction
      deps: [HttpClient]              // Avec cette dépendance
    },

    // --- CONFIGURATION DU GATEWAY SERVICE ---
    {
      provide: GatewayDataService,
      useFactory: gatewayDataServiceFactory,
      deps: [HttpClient]
    }
  ]
};
