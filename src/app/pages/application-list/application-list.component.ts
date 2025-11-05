import { Component, computed, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion'; // Pour un affichage "accordéon"
import { MatTooltipModule } from '@angular/material/tooltip'; // Pour les infobulles

// Importer le service et les types de données
import { GpuDataServiceMock } from '../../services/gpu-data-mock.service';
import { ClusterApiResponse, ReservationDetail } from '../../models/gpu.model';
import { RouterLink } from '@angular/router';

// L'interface pour une réservation plate (copiée de reservation-list)
export interface FlatReservation extends ReservationDetail {
  clusterName: string;
  nodeName: string;
}

// NOTRE NOUVELLE INTERFACE pour les données regroupées
export interface ApplicationGroup {
  applicationName: string;
  totalGpus: number;
  // La liste des namespaces liés à cette application
  namespaces: {
    namespace: string;
    clusterName: string;
    nodeName: string;
    isActive: boolean;
    gpusRequested: number;
  }[];
}

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule, // Important
    MatTooltipModule,  // Important
    RouterLink
  ],
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.scss']
})
export class ApplicationListComponent {
  private gpuDataService = inject(GpuDataServiceMock);

  // 1. Obtenir les données brutes des clusters
  private clusters: Signal<ClusterApiResponse[]> = toSignal(this.gpuDataService.clusterData$, { initialValue: [] });

  // 2. Créer la même liste plate que 'reservation-list'
  public allReservations: Signal<FlatReservation[]> = computed(() => {
    const flatList: FlatReservation[] = [];
    const allClusters = this.clusters();
    for (const cluster of allClusters) {
      for (const nodeName in cluster.nodes) {
        const node = cluster.nodes[nodeName];
        if (node.reservations && node.reservations.length > 0) {
          for (const res of node.reservations) {
            flatList.push({
              ...res,
              clusterName: cluster.cluster_name,
              nodeName: nodeName
            });
          }
        }
      }
    }
    return flatList;
  });

  // 3. LA MAGIE : Transformer la liste plate en liste groupée par application
  public applicationsList: Signal<ApplicationGroup[]> = computed(() => {
    const allRes = this.allReservations();

    // Utiliser un Map pour regrouper efficacement
    const groups = allRes.reduce((acc, res) => {
      const appName = res.application;

      // Chercher si on a déjà un groupe pour cette app
      let group = acc.get(appName);

      // Si non, le créer
      if (!group) {
        group = {
          applicationName: appName,
          totalGpus: 0,
          namespaces: []
        };
        acc.set(appName, group);
      }

      // Ajouter les détails du namespace au groupe
      group.totalGpus += res.gpusRequested;
      group.namespaces.push({
        namespace: res.namespace,
        clusterName: res.clusterName,
        nodeName: res.nodeName,
        isActive: res.isActive,
        gpusRequested: res.gpusRequested
      });

      return acc;
    }, new Map<string, ApplicationGroup>());

    // Convertir le Map en tableau et le trier par nom
    return Array.from(groups.values())
      .sort((a, b) => a.applicationName.localeCompare(b.applicationName));
  });

}
