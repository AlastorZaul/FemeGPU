import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GpuCardComponent} from './gpu-card.component';
// Nous n'avons plus besoin d'importer NgxGaugeModule directement ici,
// mais plutôt notre propre composant de jauge.
import {CustomGaugeComponent} from '../custom-gauge/custom-gauge.component';

describe('GpuCardComponent', () => {
  let component: GpuCardComponent;
  let fixture: ComponentFixture<GpuCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Dans un test de composant standalone, on importe les autres composants
      // et modules dont il dépend directement.
      imports: [GpuCardComponent, CustomGaugeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GpuCardComponent);
    component = fixture.componentInstance;

    // Fournir une donnée GPU minimale pour que le composant puisse s'initialiser sans erreur
    component.gpu = {
      id: 'test',
      name: 'Test GPU',
      temperature: 50,
      utilization: 50,
      fanSpeed: 50,
      power: 100,
      history: [],
      status: 'En charge'
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
