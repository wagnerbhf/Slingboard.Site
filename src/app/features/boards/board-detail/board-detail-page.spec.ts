import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { RealtimeService } from '../../../core/realtime/realtime.service';
import { TaskResponse } from '../../tasks/data/task.models';
import { TasksService } from '../../tasks/data/tasks.service';
import { BoardDetail } from '../data/board.models';
import { BoardDetailPage } from './board-detail-page';

function buildTask(overrides: Partial<TaskResponse>): TaskResponse {
  return {
    id: overrides.id ?? 'task-1',
    boardId: 'board-1',
    columnId: overrides.columnId ?? 'col-1',
    title: 'Task',
    description: null,
    priority: 'Medium',
    dueDate: null,
    order: overrides.order ?? 0,
    assigneeId: null,
    createdById: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    labels: [],
    ...overrides,
  };
}

const BOARD: BoardDetail = {
  id: 'board-1',
  title: 'Board',
  description: null,
  ownerId: 'user-1',
  backgroundColor: null,
  isPublic: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  columns: [
    { id: 'col-1', title: 'To Do', order: 0, limit: null },
    { id: 'col-2', title: 'Doing', order: 1, limit: null },
  ],
  members: [],
};

describe('BoardDetailPage', () => {
  let tasksService: { move: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let httpMock: HttpTestingController;

  async function createComponent(tasks: TaskResponse[]) {
    tasksService = { move: vi.fn(), create: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TasksService, useValue: tasksService },
        {
          provide: RealtimeService,
          useValue: {
            joinBoard: vi.fn().mockResolvedValue(undefined),
            leaveBoard: vi.fn().mockResolvedValue(undefined),
            events$: NEVER,
          },
        },
        { provide: AuthService, useValue: { currentUser: signal(null) } },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(BoardDetailPage);
    fixture.componentRef.setInput('boardId', 'board-1');
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1`).flush(BOARD);
    httpMock
      .expectOne((r) => r.url === `${environment.apiBaseUrl}/boards/board-1/tasks`)
      .flush(tasks);
    httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1/labels`).flush([]);
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  afterEach(() => httpMock.verify());

  it('does nothing when a task is dropped back in its original position', async () => {
    const a = buildTask({ id: 'a', order: 0 });
    const component = await createComponent([a]);
    const columnList = { id: 'col-1', data: [a] };

    const event = {
      previousContainer: columnList,
      container: columnList,
      previousIndex: 0,
      currentIndex: 0,
      item: { data: a },
    } as unknown as CdkDragDrop<TaskResponse[]>;

    component['onTaskDropped'](event);

    expect(tasksService.move).not.toHaveBeenCalled();
  });

  it('reorders tasks within the same column optimistically and persists the new order', async () => {
    const a = buildTask({ id: 'a', order: 0 });
    const b = buildTask({ id: 'b', order: 1 });
    const component = await createComponent([a, b]);
    const columnList = { id: 'col-1', data: [a, b] };
    tasksService.move.mockReturnValue(of(buildTask({ id: 'b', order: 0 })));

    const event = {
      previousContainer: columnList,
      container: columnList,
      previousIndex: 1,
      currentIndex: 0,
      item: { data: b },
    } as unknown as CdkDragDrop<TaskResponse[]>;

    component['onTaskDropped'](event);

    expect(component['tasksForColumn']('col-1').map((t) => t.id)).toEqual(['b', 'a']);
    expect(tasksService.move).toHaveBeenCalledWith('b', 'col-1', 0);
    expect(component['dragErrorMessage']()).toBeNull();
  });

  it('moves a task to a different column optimistically', async () => {
    const a = buildTask({ id: 'a', columnId: 'col-1', order: 0 });
    const component = await createComponent([a]);
    tasksService.move.mockReturnValue(of(buildTask({ id: 'a', columnId: 'col-2', order: 0 })));

    const event = {
      previousContainer: { id: 'col-1', data: [a] },
      container: { id: 'col-2', data: [] },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: a },
    } as unknown as CdkDragDrop<TaskResponse[]>;

    component['onTaskDropped'](event);

    expect(component['tasksForColumn']('col-1')).toEqual([]);
    expect(component['tasksForColumn']('col-2').map((t) => t.id)).toEqual(['a']);
    expect(tasksService.move).toHaveBeenCalledWith('a', 'col-2', 0);
  });

  it('rolls back the optimistic update and shows an error when the move request fails', async () => {
    const a = buildTask({ id: 'a', columnId: 'col-1', order: 0 });
    const b = buildTask({ id: 'b', columnId: 'col-1', order: 1 });
    const component = await createComponent([a, b]);
    const columnList = { id: 'col-1', data: [a, b] };
    tasksService.move.mockReturnValue(throwError(() => ({ title: 'Erro', status: 500 })));

    const event = {
      previousContainer: columnList,
      container: columnList,
      previousIndex: 1,
      currentIndex: 0,
      item: { data: b },
    } as unknown as CdkDragDrop<TaskResponse[]>;

    component['onTaskDropped'](event);

    expect(component['tasksForColumn']('col-1').map((t) => t.id)).toEqual(['a', 'b']);
    expect(component['dragErrorMessage']()).toBe('Não foi possível mover a task. Tente novamente.');
  });
});
