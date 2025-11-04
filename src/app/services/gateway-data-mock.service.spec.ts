import { TestBed } from '@angular/core/testing';

import { GatewayDataMockService } from './gateway-data-mock.service';

describe('GatewayDataMockService', () => {
  let service: GatewayDataMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GatewayDataMockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
