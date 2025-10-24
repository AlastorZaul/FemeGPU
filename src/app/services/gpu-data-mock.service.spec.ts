import {TestBed} from '@angular/core/testing';

import {GpuDataMockService} from './gpu-data-mock.service';

describe('GpuDataMockService', () => {
  let service: GpuDataMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpuDataMockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
