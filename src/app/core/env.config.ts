import { InjectionToken } from '@angular/core';

// 1. Définition de l'interface
export interface EnvConfig {
  apiUrl: string;
}

// 2. Création du Token
export const ENV_CONFIG = new InjectionToken<EnvConfig>('ENV_CONFIG', {
  providedIn: 'root',
  factory: () => {
    // Récupération de la variable globale injectée par env.js
    const env = (window as any).__env || {};
    return {
      apiUrl: env.apiUrl || '/api' // Fallback si env.js est absent
    };
  }
});
