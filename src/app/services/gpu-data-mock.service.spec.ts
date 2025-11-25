import { TestBed } from '@angular/core/testing';
import { GpuDataServiceMock, NamespaceReservation, FlatReservation } from './gpu-data-mock.service';
import { take } from 'rxjs/operators';

describe('GpuDataServiceMock', () => {
  let service: GpuDataServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GpuDataServiceMock]
    });
    service = TestBed.inject(GpuDataServiceMock);
    // Reset localStorage before each test to ensure isolation
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createNamespaceReservation', () => {
    it('should create a reservation when resources are available', (done) => {
      const reservation: NamespaceReservation = {
        cluster: 'Cluster Production A',
        node: 'A100',
        namespace: 'test-ns',
        application: 'test-app',
        gpusRequested: 1,
        memoryRequest: 1,
        cpuRequest: 1
      };

      service.createNamespaceReservation(reservation).subscribe(response => {
        expect(response.message).toContain('effectuée avec succès');

        // Verify the reservation was added
        service.clusterData$.pipe(take(1)).subscribe(clusters => {
          const cluster = clusters.find(c => c.cluster_name === 'Cluster Production A');
          const node = cluster?.nodes['A100'];
          const newReservation = node?.reservations.find(r => r.namespace === 'test-ns');
          expect(newReservation).toBeDefined();
          done();
        });
      });
    });

    it('should fail to create a reservation if resources are insufficient', (done) => {
      const reservation: NamespaceReservation = {
        cluster: 'Cluster Production A',
        node: 'A100',
        namespace: 'test-ns',
        application: 'test-app',
        gpusRequested: 100, // More than available
        memoryRequest: 1,
        cpuRequest: 1
      };

      service.createNamespaceReservation(reservation).subscribe(response => {
        expect(response.message).toContain('Erreur: Pas assez de GPUs disponibles');
        done();
      });
    });
  });

  describe('moveReservationToNode', () => {
    it('should move a reservation to another node', (done) => {
      const reservationToMove: FlatReservation = {
        clusterName: 'Cluster Production A',
        nodeName: 'A100',
        namespace: 'alpha-train',
        application: 'jupyter-notebook',
        gpusRequested: 2,
        memoryRequest: 32,
        cpuRequest: 8,
        createdAt: new Date(Date.now() - 3600000),
        isActive: true
      };

      service.moveReservationToNode(reservationToMove, 'H200').subscribe(response => {
        expect(response.success).toBe(true);

        service.clusterData$.pipe(take(1)).subscribe(clusters => {
          const sourceNode = clusters.find(c => c.cluster_name === 'Cluster Production A')?.nodes['A100'];
          const destNode = clusters.find(c => c.cluster_name === 'Cluster Production A')?.nodes['H200'];

          const movedReservationInSource = sourceNode?.reservations.find(r => r.namespace === 'alpha-train');
          const movedReservationInDest = destNode?.reservations.find(r => r.namespace === 'alpha-train');

          expect(movedReservationInSource).toBeUndefined();
          expect(movedReservationInDest).toBeDefined();
          done();
        });
      });
    });

    it('should fail to move a reservation to a non-existent node', (done) => {
        const reservationToMove: FlatReservation = {
            clusterName: 'Cluster Production A',
            nodeName: 'A100',
            namespace: 'alpha-train',
            application: 'jupyter-notebook',
            gpusRequested: 2,
            memoryRequest: 32,
            cpuRequest: 8,
            createdAt: new Date(Date.now() - 3600000),
            isActive: true
          };

      service.moveReservationToNode(reservationToMove, 'non-existent-node').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.message).toContain('Nœud de destination \'non-existent-node\' non trouvé');
        done();
      });
    });
  });

  describe('deleteReservation', () => {
    it('should delete a reservation', (done) => {
      const reservationToDelete: FlatReservation = {
        clusterName: 'Cluster Production A',
        nodeName: 'A100',
        namespace: 'alpha-train',
        application: 'jupyter-notebook',
        gpusRequested: 2,
        memoryRequest: 32,
        cpuRequest: 8,
        createdAt: new Date(Date.now() - 3600000),
        isActive: true
      };

      service.deleteReservation(reservationToDelete).subscribe(response => {
        expect(response.success).toBe(true);

        service.clusterData$.pipe(take(1)).subscribe(clusters => {
          const node = clusters.find(c => c.cluster_name === 'Cluster Production A')?.nodes['A100'];
          const deletedReservation = node?.reservations.find(r => r.namespace === 'alpha-train');
          expect(deletedReservation).toBeUndefined();
          done();
        });
      });
    });

    it('should fail to delete a non-existent reservation', (done) => {
        const reservationToDelete: FlatReservation = {
            clusterName: 'Cluster Production A',
            nodeName: 'A100',
            namespace: 'non-existent-ns',
            application: 'test-app',
            gpusRequested: 1,
            memoryRequest: 1,
            cpuRequest: 1,
            createdAt: new Date(),
            isActive: true
          };

      service.deleteReservation(reservationToDelete).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.message).toContain('Réservation non trouvée à supprimer');
        done();
      });
    });
  });
});
