import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {shareReplay} from 'rxjs/operators';
import {Cluster} from '../models/gpu.model';
import {HttpClient} from '@angular/common/http';

// Données de base avec le nouveau statut
const MOCK_CLUSTERS: Cluster[] = [
  {
    id: 'cluster-1', name: 'HPIA',
    gpus: [
      {
        id: 'gpu-1a',
        name: 'H100',
        status: 'En charge',
        temperature: 65,
        utilization: 92,
        fanSpeed: 75,
        power: 280,
        history: []
      },
      {
        id: 'gpu-1b',
        name: 'L40S',
        status: 'Inactif',
        temperature: 40,
        utilization: 5,
        fanSpeed: 30,
        power: 90,
        history: []
      }
    ]
  },
  {
    id: 'cluster-2', name: 'HPIB',
    gpus: [
      {
        id: 'gpu-2a',
        name: 'H200',
        status: 'En charge',
        temperature: 55,
        utilization: 60,
        fanSpeed: 65,
        power: 320,
        history: []
      },
      {
        id: 'gpu-2b',
        name: 'H100',
        status: 'Inactif',
        temperature: 38,
        utilization: 2,
        fanSpeed: 25,
        power: 85,
        history: []
      },
      {
        id: 'gpu-2c',
        name: 'L40S',
        status: 'Erreur',
        temperature: 30,
        utilization: 0,
        fanSpeed: 0,
        power: null,
        history: []
      }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class GpuDataService {
  // Injection du HttpClient
  private http = inject(HttpClient);

  // URL de votre API (à remplacer par votre véritable endpoint)
  private apiUrl = '/api/clusters'; // Exemple

  // L'observable gpuData$ va maintenant chercher les données via une requête HTTP
  public gpuData$: Observable<Cluster[]> = this.http.get<Cluster[]>(this.apiUrl).pipe(
    // shareReplay(1) est conservé pour mettre en cache la dernière réponse
    // et éviter les multiples appels si plusieurs composants s'abonnent.
    shareReplay(1)
  );
}
