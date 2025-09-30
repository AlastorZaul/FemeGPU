import {Component, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {FarmAllocationMetrics, MetricsService} from '../../services/metrics.service';

// Imports Material
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';

@Component({
  selector: 'app-farm-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule],
  templateUrl: './farm-summary.component.html',
  styleUrls: ['./farm-summary.component.scss']
})
export class FarmSummaryComponent {
  private metricsService = inject(MetricsService);

  // On transforme l'observable des métriques en Signal
  public metrics: Signal<FarmAllocationMetrics | undefined>;

  constructor() {
    this.metrics = toSignal(this.metricsService.farmMetrics$);
  }
}
