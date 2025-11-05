import {Component, computed, input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-custom-gauge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-gauge.component.html',
  styleUrls: ['./custom-gauge.component.scss'],
})
export class CustomGaugeComponent {
  // --- Inputs ---
  value = input.required<number>();
  label = input.required<string>();
  append = input.required<string>();
  max = input.required<number>();

  // --- Propriétés pour le SVG ---
  stroke = 10;
  radius = 50;
  viewBox = '0 0 120 120';
  circumference = 2 * Math.PI * this.radius;

  // --- Signaux "Computed" ---

  // Calcule le décalage du trait pour animer la jauge
  strokeOffset = computed(() => {
    const val = this.value();
    const max = this.max();
    if (max === 0) {
      return this.circumference;
    }
    // On s'assure que la valeur est entre 0 et max
    const clampedValue = Math.max(0, Math.min(val, max));
    const percentage = clampedValue / max;
    return this.circumference * (1 - percentage);
  });

  // Détermine la classe de couleur en fonction du pourcentage
  colorClass = computed(() => {
    const percentage = (this.value() / this.max()) * 100;
    if (percentage > 85) {
      return 'color-critical';
    }
    if (percentage > 60) {
      return 'color-warning';
    }
    return 'color-normal';
  });
}
