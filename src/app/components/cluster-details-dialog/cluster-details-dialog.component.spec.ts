import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ClusterDetailsDialogComponent} from './cluster-details-dialog.component';

describe('ClusterDetailsDialogComponent', () => {
  let component: ClusterDetailsDialogComponent;
  let fixture: ComponentFixture<ClusterDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClusterDetailsDialogComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClusterDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
