import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gpu, GpuHistoryPoint } from '../../models/gpu.model';

// --- IMPORTS ANGULAR MATERIAL ---
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';      // CORRECTION : Import manquant
import { MatDividerModule } from '@angular/material/divider';  // CORRECTION : Import manquant

// --- IMPORT DU GRAPHIQUE ---
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import {MatCard} from '@angular/material/card';

@Component({
  selector: 'app-gpu-history-chart',
  standalone: true,
  imports: [
    // --- LISTE DES DÉPENDANCES DU COMPOSANT ---
    CommonModule,
    NgxChartsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule, // CORRECTION : Module ajouté à la liste
    MatChipsModule,
    MatCard,
    // CORRECTION : Module ajouté à la liste
  ],
  templateUrl: './gpu-history-chart.component.html',
  styleUrls: ['./gpu-history-chart.component.scss']
})
export class GpuHistoryChartComponent {
  public chartData: { name: string; series: GpuHistoryPoint[] }[] = [];
  public referenceLines = [{ value: 90, name: 'Critique' }];

  // Configuration du graphique
  public showGridLines: boolean = true;
  public xAxis: boolean = true;
  public yAxis: boolean = true;
  public showYAxisLabel: boolean = true;
  public yAxisLabel: string = 'Température (°C)';
  public colorScheme: Color = {
    name: 'gpuTemp',
    selectable: true,
    group: ScaleType.Linear,
    domain: ['#3b82f6'],
  };
  public schemeType: ScaleType = ScaleType.Linear;
  public gradient: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<GpuHistoryChartComponent>,
    @Inject(MAT_DIALOG_DATA) public gpu: Gpu
  ) {
    if (gpu && gpu.history) {
      this.chartData = [{
        name: 'Température',
        series: gpu.history
      }];
    }
  }
}
