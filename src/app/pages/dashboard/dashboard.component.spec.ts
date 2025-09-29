import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DashboardComponent} from './dashboard.component';
import {GpuDataService} from '../../services/gpu-data.service';
import {of} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

// Mock du service de données
const mockGpuDataService = {
  gpuData$: of([
    {
      id: 'cluster-1', name: 'Test Cluster', gpus: [
        {
          id: 'gpu-1a',
          name: 'TEST GPU',
          temperature: 50,
          utilization: 50,
          fanSpeed: 50,
          power: 100,
          history: [],
          status: 'En charge'
        }
      ]
    }
  ])
};

// On crée un "faux" service MatDialog qui a une méthode `open`
const mockMatDialog = {
  open: () => {
  } // Une fonction qui ne fait rien
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        // On dit à Angular : "Quand quelqu'un demande MatDialog, donne-lui notre faux service"
        {provide: MatDialog, useValue: mockMatDialog},
        // On simule aussi le service de données
        {provide: GpuDataService, useValue: {gpuData$: of([])}}
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
