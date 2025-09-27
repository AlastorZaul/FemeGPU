import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import {CommonModule, DecimalPipe, LowerCasePipe, NgClass} from '@angular/common';
import { Gpu } from '../../models/gpu.model';
import {MatCard, MatCardContent, MatCardHeader, MatCardModule, MatCardTitle} from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {CustomGaugeComponent} from '../custom-gauge/custom-gauge.component';

// Interface pour la configuration d'une métrique
interface MetricConfig {
  label: string;
  value: number;
  append: string;
  max: number;
}

@Component({
  selector: 'app-gpu-card',
  standalone: true,
  imports: [
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatCard,
    CustomGaugeComponent,
    DecimalPipe,
    NgClass,
    LowerCasePipe,
    /* ... Vos imports ... */],
  templateUrl: './gpu-card.component.html',
  styleUrls: ['./gpu-card.component.scss']
})
export class GpuCardComponent {
  @Input({ required: true }) gpu!: Gpu;
  @Input() index: number = 0; // On reçoit l'index du parent
  @Output() viewHistory = new EventEmitter<void>();

  gaugeType = 'arch' as const;
  gaugeThresholds = { /* ... */ };

  // Toutes les métriques disponibles sous forme de tableau
  private allMetrics = computed<MetricConfig[]>(() => [
    { label: 'Utilisation', value: this.gpu.utilization, append: '%', max: 100 },
    { label: 'Température', value: this.gpu.temperature, append: '°C', max: 110 },
    { label: 'Ventilateur', value: this.gpu.fanSpeed, append: '%', max: 100 }
  ]);

  // Signal calculé pour la métrique PRINCIPALE
  primaryMetric = computed<MetricConfig>(() => {
    // On utilise le modulo (%) pour faire un roulement : 0, 1, 2, 0, 1, 2...
    const primaryIndex = this.index % this.allMetrics().length;
    return this.allMetrics()[primaryIndex];
  });

  // Signal calculé pour les métriques SECONDAIRES
  secondaryMetrics = computed<MetricConfig[]>(() => {
    const primaryLabel = this.primaryMetric().label;
    // On retourne toutes les métriques sauf la principale
    return this.allMetrics().filter(m => m.label !== primaryLabel);
  });
}
