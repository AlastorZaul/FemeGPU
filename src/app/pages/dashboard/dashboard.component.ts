import {Component, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {FarmAllocationMetrics, MetricsService} from '../../services/metrics.service'; // Importez le service de métriques
// Imports Angular Material
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private metricsService = inject(MetricsService);

  // On transforme l'observable des métriques en Signal
  public metrics: Signal<FarmAllocationMetrics | undefined>;

  constructor() {
    this.metrics = toSignal(this.metricsService.farmMetrics$);
  }
}
