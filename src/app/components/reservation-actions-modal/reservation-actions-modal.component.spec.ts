import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationActionsModalComponent } from './reservation-actions-modal.component';

describe('ReservationActionsModalComponent', () => {
  let component: ReservationActionsModalComponent;
  let fixture: ComponentFixture<ReservationActionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationActionsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationActionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
