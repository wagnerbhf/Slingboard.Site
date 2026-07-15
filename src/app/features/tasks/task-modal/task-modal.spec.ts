import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { of, throwError } from 'rxjs';

import { TaskResponse } from '../data/task.models';
import { TasksService } from '../data/tasks.service';
import { TaskModal, TaskModalContext } from './task-modal';

function buildTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 'task-1',
    boardId: 'board-1',
    columnId: 'col-1',
    title: 'Existing task',
    description: null,
    priority: 'Medium',
    dueDate: null,
    order: 0,
    assigneeId: null,
    createdById: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    labels: [],
    ...overrides,
  };
}

describe('TaskModal', () => {
  let tasksService: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    assign: ReturnType<typeof vi.fn>;
  };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  function createComponent(context: TaskModalContext) {
    tasksService = { create: vi.fn(), update: vi.fn(), assign: vi.fn() };
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: TasksService, useValue: tasksService },
        { provide: BrnDialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: context },
      ],
    });

    return TestBed.createComponent(TaskModal).componentInstance;
  }

  it('does not submit when the title is empty, marking the form as touched', () => {
    const component = createComponent({
      boardId: 'board-1',
      columnId: 'col-1',
      members: [],
      labels: [],
    });

    component['submit']();

    expect(tasksService.create).not.toHaveBeenCalled();
    expect(component['form'].controls.title.touched).toBe(true);
  });

  it('creates a task with the selected labels and closes the dialog on success', () => {
    const component = createComponent({
      boardId: 'board-1',
      columnId: 'col-1',
      members: [],
      labels: [{ id: 'label-1', boardId: 'board-1', name: 'Bug', color: '#ff0000' }],
    });
    const created = buildTask({ id: 'new-task' });
    tasksService.create.mockReturnValue(of(created));

    component['form'].controls.title.setValue('Nova task');
    component['toggleLabel']('label-1');
    component['submit']();

    expect(tasksService.create).toHaveBeenCalledWith('board-1', {
      columnId: 'col-1',
      title: 'Nova task',
      description: null,
      priority: 'Medium',
      dueDate: null,
      labelIds: ['label-1'],
      assigneeId: null,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(created);
  });

  it('surfaces the API error message when creation fails', () => {
    const component = createComponent({
      boardId: 'board-1',
      columnId: 'col-1',
      members: [],
      labels: [],
    });
    tasksService.create.mockReturnValue(
      throwError(() => ({ title: 'Título inválido', status: 400 })),
    );

    component['form'].controls.title.setValue('X');
    component['submit']();

    expect(component['errorMessage']()).toBe('Título inválido');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('editing a task updates it and re-assigns when the assignee changed', () => {
    const task = buildTask({ assigneeId: 'user-1' });
    const component = createComponent({
      boardId: 'board-1',
      columnId: 'col-1',
      members: [
        { userId: 'user-1', name: 'Ana', email: 'a@a.com', role: 'Member' },
        { userId: 'user-2', name: 'Bea', email: 'b@b.com', role: 'Member' },
      ],
      labels: [],
      task,
    });
    const updated = buildTask({ ...task, title: 'Renomeada' });
    const assigned = buildTask({ ...task, title: 'Renomeada', assigneeId: 'user-2' });
    tasksService.update.mockReturnValue(of(updated));
    tasksService.assign.mockReturnValue(of(assigned));

    component['form'].controls.title.setValue('Renomeada');
    component['form'].controls.assigneeId.setValue('user-2');
    component['submit']();

    expect(tasksService.update).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ title: 'Renomeada' }),
    );
    expect(tasksService.assign).toHaveBeenCalledWith('task-1', 'user-2');
    expect(dialogRef.close).toHaveBeenCalledWith(assigned);
  });

  it('closes without re-assigning when the assignee did not change', () => {
    const task = buildTask({ assigneeId: 'user-1' });
    const component = createComponent({
      boardId: 'board-1',
      columnId: 'col-1',
      members: [],
      labels: [],
      task,
    });
    const updated = buildTask({ ...task, title: 'Renomeada' });
    tasksService.update.mockReturnValue(of(updated));

    component['form'].controls.title.setValue('Renomeada');
    component['submit']();

    expect(tasksService.assign).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(updated);
  });
});
