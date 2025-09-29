import {discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing'; // Importez discardPeriodicTasks
import {GpuDataService} from './gpu-data.service';
import {Cluster} from '../models/gpu.model';

describe('GpuDataService', () => {
  let service: GpuDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpuDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // On utilise fakeAsync pour contrôler le temps
  it('should emit cluster data periodically', fakeAsync(() => {
    let emittedClusters: Cluster[] | undefined;

    const subscription = service.gpuData$.subscribe(clusters => {
      emittedClusters = clusters;
    });

    // On s'assure que la première émission a lieu
    tick(1);
    expect(emittedClusters).toBeDefined();
    expect(emittedClusters!.length).toBeGreaterThan(0);

    const initialTemp = emittedClusters![0].gpus[0].temperature;

    // --- CORRECTION ---
    // On s'assure que Math.random() ne retourne pas une valeur qui annule le changement
    spyOn(Math, 'random').and.returnValue(0.9);

    // On avance le temps de l'intervalle
    tick(1500);
    const newTemp = emittedClusters![0].gpus[0].temperature;

    // La température doit maintenant avoir changé
    expect(newTemp).not.toBe(initialTemp);

    subscription.unsubscribe();

    // --- CORRECTION ---
    // On nettoie tous les timers restants à la fin du test
    discardPeriodicTasks();
  }));
});
