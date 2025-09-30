import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Gpu} from '../../models/gpu.model';

// Imports Angular Material
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDividerModule} from '@angular/material/divider';

@Component({
  selector: 'app-cluster-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  templateUrl: './cluster-details-dialog.component.html',
  styleUrls: ['./cluster-details-dialog.component.scss']
})
export class ClusterDetailsDialogComponent {
  // On injecte les données passées par le DashboardComponent
  constructor(
    public dialogRef: MatDialogRef<ClusterDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clusterName: string, gpus: Gpu[] }
  ) {
  }
}
