import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { BoardsService } from './boards.service';

describe('BoardsService', () => {
  let service: BoardsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BoardsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() requests the boards collection with an optional search param', () => {
    service.list('kanban').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/boards` && r.params.get('search') === 'kanban',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('get() requests a single board by id', () => {
    service.get('board-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() posts the new board payload', () => {
    const request = { title: 'Sprint 1' };
    service.create(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/boards`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('update() puts the board payload', () => {
    service.update('board-1', { title: 'Renamed' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('addMember() posts the userId and role', () => {
    service.addMember('board-1', { userId: 'user-1', role: 'Member' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 'user-1', role: 'Member' });
    req.flush({});
  });
});
