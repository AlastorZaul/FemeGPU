import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, timer} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';
import {ClusterApiResponse} from '../models/gpu.model'; // Import du nouveau modèle

@Injectable({ providedIn: 'root' })
export class GpuDataService {
  private http = inject(HttpClient);

  // Remplacez cette URL par l'endpoint de votre API
  private apiUrl = 'https://ai-manager-tu1.ia1.metier.devpass.sf.intra.laposte.fr/api/admin/v2/dashboard/total_ressource_infrastructures';

  // L'observable va maintenant chercher les données toutes les 5 secondes
  public clusterData$: Observable<ClusterApiResponse[]> = timer(0, 5000).pipe(
    switchMap(() => this.http.get<ClusterApiResponse[]>(this.apiUrl)),
    shareReplay(1) // Met en cache la dernière réponse
  );
}
