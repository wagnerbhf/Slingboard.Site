import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() sends only the provided, non-empty filters as query params', () => {
    service.list('board-1', { priority: 'High', assigneeId: '', labelId: undefined }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/boards/board-1/tasks`,
    );
    expect(req.request.params.get('priority')).toBe('High');
    expect(req.request.params.has('assigneeId')).toBe(false);
    expect(req.request.params.has('labelId')).toBe(false);
    req.flush([]);
  });

  it('create() posts the new task', () => {
    const request = { columnId: 'col-1', title: 'Nova task', priority: 'Medium' as const };
    service.create('board-1', request).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('move() patches the new column and order', () => {
    service.move('task-1', 'col-2', 3).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/tasks/task-1/move`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ newColumnId: 'col-2', newOrder: 3 });
    req.flush({});
  });

  it('assign() patches the assigneeId', () => {
    service.assign('task-1', null).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/tasks/task-1/assign`);
    expect(req.request.body).toEqual({ assigneeId: null });
    req.flush({});
  });
});
