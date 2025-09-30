import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, of, timer} from 'rxjs';
import {catchError, map, shareReplay, switchMap} from 'rxjs/operators';
import {Cluster} from '../models/gpu.model';

@Injectable({
  providedIn: 'root'
})
export class GpuDataService {
  private http = inject(HttpClient);

  // Définissez l'URL de base de votre API
  private apiUrl = 'https://ai-manager-tu1.ia1.metier.devpass.sf.intra.laposte.fr/api/admin/'; // J'ai supposé le protocole http et un chemin /api
  // Observable qui interroge l'API toutes les 5 secondes (5000ms)
  public gpuData$: Observable<Cluster[]> = timer(0, 5000).pipe(
    // switchMap annule la requête précédente si une nouvelle arrive
    switchMap(() =>
      // On fait un appel GET à l'endpoint qui retourne les clusters
      this.http.get<Cluster[]>(`${this.apiUrl}/infra/v2/dashboard/total_ressource_infrastructures`).pipe(
        // En cas d'erreur de connexion à l'API, on retourne un tableau vide pour ne pas casser l'application
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur de connexion à l\'API :', error.message);
          return of([]); // Retourne un observable avec un tableau vide
        }),
        // On s'assure que chaque GPU a un tableau 'history' pour éviter les erreurs
        map(clusters => this.ensureHistoryArray(clusters))
      )
    ),
    // shareReplay partage la dernière réponse de l'API avec tous les abonnés
    shareReplay(1)
  );

  /**
   * S'assure que chaque objet GPU a une propriété 'history' initialisée comme un tableau.
   * C'est une sécurité pour éviter les erreurs si l'API ne retourne pas cette propriété.
   */
  private ensureHistoryArray(clusters: Cluster[]): Cluster[] {
    if (!clusters) return [];

    return clusters.map(cluster => ({
      ...cluster,
      gpus: cluster.gpus.map(gpu => ({
        ...gpu,
        history: gpu.history || [] // Si 'history' n'existe pas, on le crée
      }))
    }));
  }
}
