import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ExportResult } from './export.models';
import { ExportsService } from './exports.service';

describe('ExportsService', () => {
  let service: ExportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests a blob with the given filters and resolves the filename from Content-Disposition', () => {
    let result: ExportResult | undefined;

    service
      .export('board-1', { format: 'csv', includeCompleted: true, dateFrom: '2026-01-01' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/boards/board-1/export`,
    );
    expect(req.request.params.get('format')).toBe('csv');
    expect(req.request.params.get('includeCompleted')).toBe('true');
    expect(req.request.params.get('dateFrom')).toBe('2026-01-01');
    expect(req.request.responseType).toBe('blob');

    req.flush(new Blob(['a,b,c'], { type: 'text/csv' }), {
      headers: { 'Content-Disposition': 'attachment; filename="board-export.csv"' },
    });

    expect(result?.fileName).toBe('board-export.csv');
    expect(result?.blob).toBeInstanceOf(Blob);
  });

  it('falls back to a default filename when Content-Disposition is missing', () => {
    let result: ExportResult | undefined;

    service
      .export('board-1', { format: 'pdf', includeCompleted: false })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/boards/board-1/export`,
    );
    expect(req.request.params.has('dateFrom')).toBe(false);
    req.flush(new Blob(['%PDF']));

    expect(result?.fileName).toBe('board-export.pdf');
  });
});
