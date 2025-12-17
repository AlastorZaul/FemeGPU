import {TestBed} from '@angular/core/testing';

import {ServiceFactoryService} from './service-factory.service';

describe('ServiceFactoryService', () => {
  let service: ServiceFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
