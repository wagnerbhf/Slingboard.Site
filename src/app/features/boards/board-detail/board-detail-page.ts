import {
  CdkDragDrop,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/api-error.model';
import { RealtimeEvent } from '../../../core/realtime/realtime.models';
import { RealtimeService } from '../../../core/realtime/realtime.service';
import { getInitials } from '../../../shared/text/initials';
import { HlmButton } from '../../../shared/ui/button/src';
import { HlmDialogService } from '../../../shared/ui/dialog/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { ExportModal, ExportModalContext } from '../../exports/export-modal/export-modal';
import { Label } from '../../labels/data/label.model';
import { TaskFilters, TaskResponse } from '../../tasks/data/task.models';
import { TasksService } from '../../tasks/data/tasks.service';
import { TaskModal, TaskModalContext } from '../../tasks/task-modal/task-modal';
import { BoardDetail } from '../data/board.models';
import { BoardsService } from '../data/boards.service';
import { ColumnsService } from '../data/columns.service';
import { FiltersBar } from '../filters-bar/filters-bar';
import { BoardColumnComponent } from './board-column';

@Component({
  selector: 'app-board-detail-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmButton,
    HlmInput,
    BoardColumnComponent,
    FiltersBar,
    CdkDropListGroup,
    Skeleton,
  ],
  templateUrl: './board-detail-page.html',
})
export class BoardDetailPage {
  readonly boardId = input.required<string>();

  private readonly boardsService = inject(BoardsService);
  private readonly columnsService = inject(ColumnsService);
  private readonly tasksService = inject(TasksService);
  private readonly dialogService = inject(HlmDialogService);
  private readonly authService = inject(AuthService);
  private readonly realtimeService = inject(RealtimeService);

  protected readonly boardResource = httpResource<BoardDetail>(
    () => `${environment.apiBaseUrl}/boards/${this.boardId()}`,
  );

  protected readonly filters = signal<TaskFilters>({});

  protected readonly tasksResource = httpResource<TaskResponse[]>(
    () => ({
      url: `${environment.apiBaseUrl}/boards/${this.boardId()}/tasks`,
      params: this.buildTaskParams(this.filters()),
    }),
    { defaultValue: [] },
  );

  protected readonly labelsResource = httpResource<Label[]>(
    () => `${environment.apiBaseUrl}/boards/${this.boardId()}/labels`,
    { defaultValue: [] },
  );

  protected readonly sortedColumns = computed(() =>
    [...(this.boardResource.value()?.columns ?? [])].sort((a, b) => a.order - b.order),
  );

  protected readonly editingTitle = signal(false);
  protected readonly titleControl = new FormControl('', { nonNullable: true });
  protected readonly dragErrorMessage = signal<string | null>(null);

  protected readonly addingColumn = signal(false);
  protected readonly creatingColumn = signal(false);
  protected readonly columnError = signal<string | null>(null);
  protected readonly newColumnTitle = new FormControl('', { nonNullable: true });

  constructor() {
    // JoinBoard(boardId) ao entrar/trocar de board, LeaveBoard(boardId) ao sair ou desmontar.
    effect((onCleanup) => {
      const boardId = this.boardId();
      void this.realtimeService.joinBoard(boardId);
      onCleanup(() => void this.realtimeService.leaveBoard(boardId));
    });

    this.realtimeService.events$
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.handleRealtimeEvent(event));
  }

  protected onFiltersChanged(filters: TaskFilters): void {
    this.filters.set(filters);
  }

  protected tasksForColumn(columnId: string): TaskResponse[] {
    return this.tasksResource
      .value()
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }

  private buildTaskParams(filters: TaskFilters): Record<string, string> {
    const params: Record<string, string> = {};
    if (filters.priority) {
      params['priority'] = filters.priority;
    }
    if (filters.labelId) {
      params['labelId'] = filters.labelId;
    }
    if (filters.assigneeId) {
      params['assigneeId'] = filters.assigneeId;
    }
    if (filters.dueDateFrom) {
      params['dueDateFrom'] = filters.dueDateFrom;
    }
    if (filters.dueDateTo) {
      params['dueDateTo'] = filters.dueDateTo;
    }
    return params;
  }

  protected initials(name: string): string {
    return getInitials(name);
  }

  protected startEditingTitle(): void {
    this.titleControl.setValue(this.boardResource.value()?.title ?? '');
    this.editingTitle.set(true);
  }

  protected saveTitle(): void {
    const board = this.boardResource.value();
    const title = this.titleControl.value.trim();

    if (!board || !title || title === board.title) {
      this.editingTitle.set(false);
      return;
    }

    this.boardsService
      .update(board.id, {
        title,
        description: board.description ?? undefined,
        backgroundColor: board.backgroundColor ?? undefined,
      })
      .subscribe({
        next: () => {
          this.editingTitle.set(false);
          this.boardResource.reload();
        },
        error: () => this.editingTitle.set(false),
      });
  }

  protected createTask(columnId: string, title: string): void {
    this.tasksService
      .create(this.boardId(), { columnId, title, priority: 'Medium' })
      .subscribe(() => this.tasksResource.reload());
  }

  protected startAddingColumn(): void {
    this.columnError.set(null);
    this.addingColumn.set(true);
  }

  protected cancelAddingColumn(): void {
    this.newColumnTitle.setValue('');
    this.addingColumn.set(false);
  }

  protected submitNewColumn(): void {
    const title = this.newColumnTitle.value.trim();
    if (!title) {
      this.cancelAddingColumn();
      return;
    }

    this.creatingColumn.set(true);
    this.columnError.set(null);

    this.columnsService.create(this.boardId(), { title }).subscribe({
      next: () => {
        this.creatingColumn.set(false);
        this.cancelAddingColumn();
        this.boardResource.reload();
      },
      error: (error: unknown) => {
        this.creatingColumn.set(false);
        this.columnError.set(this.resolveColumnErrorMessage(error));
      },
    });
  }

  private resolveColumnErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    return apiError?.title ?? 'Não foi possível criar a coluna. Tente novamente.';
  }

  protected openExportModal(): void {
    this.dialogService.open<void, ExportModalContext>(ExportModal, {
      context: { boardId: this.boardId() },
    });
  }

  protected openTaskModal(task: TaskResponse, columnId: string): void {
    const board = this.boardResource.value();
    if (!board) {
      return;
    }

    const ref = this.dialogService.open<TaskResponse | 'deleted' | undefined, TaskModalContext>(
      TaskModal,
      {
        context: {
          boardId: this.boardId(),
          columnId,
          members: board.members,
          labels: this.labelsResource.value(),
          task,
        },
      },
    );

    ref.closed$.subscribe((result) => {
      if (result) {
        this.tasksResource.reload();
      }
    });
  }

  protected onTaskDropped(event: CdkDragDrop<TaskResponse[]>): void {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    const task = event.item.data as TaskResponse;
    const targetColumnId = event.container.id;
    const previousTasks = this.tasksResource.value();

    const sourceColumnTasks = [...event.previousContainer.data];
    const targetColumnTasks =
      event.previousContainer === event.container ? sourceColumnTasks : [...event.container.data];

    if (event.previousContainer === event.container) {
      moveItemInArray(targetColumnTasks, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        sourceColumnTasks,
        targetColumnTasks,
        event.previousIndex,
        event.currentIndex,
      );
    }

    const reorderedById = new Map<string, TaskResponse>();
    for (const [columnId, columnTasks] of [
      [event.previousContainer.id, sourceColumnTasks],
      [targetColumnId, targetColumnTasks],
    ] as const) {
      columnTasks.forEach((columnTask, index) => {
        reorderedById.set(columnTask.id, { ...columnTask, columnId, order: index });
      });
    }

    this.dragErrorMessage.set(null);
    this.tasksResource.set(previousTasks.map((t) => reorderedById.get(t.id) ?? t));

    const newOrder = reorderedById.get(task.id)?.order ?? event.currentIndex;

    this.tasksService.move(task.id, targetColumnId, newOrder).subscribe({
      error: () => {
        this.tasksResource.set(previousTasks);
        this.dragErrorMessage.set('Não foi possível mover a task. Tente novamente.');
      },
    });
  }

  // Eventos SignalR chegam pro próprio autor da ação também (ver api-contract.md); quando o
  // *ByUserId bate com o usuário atual, a UI já foi atualizada via optimistic update e o evento
  // é ignorado para não duplicar/reprocessar a mudança.
  private handleRealtimeEvent(event: RealtimeEvent): void {
    const currentUserId = this.authService.currentUser()?.id;

    switch (event.type) {
      case 'TaskCreated':
        if (event.payload.createdByUserId !== currentUserId) {
          this.tasksResource.reload();
        }
        break;

      case 'TaskUpdated':
        if (event.payload.updatedByUserId !== currentUserId) {
          this.tasksResource.update((tasks) =>
            tasks.map((task) =>
              task.id === event.payload.taskId
                ? { ...task, title: event.payload.title, priority: event.payload.priority }
                : task,
            ),
          );
        }
        break;

      case 'TaskMoved':
        if (event.payload.movedByUserId !== currentUserId) {
          this.tasksResource.update((tasks) =>
            tasks.map((task) =>
              task.id === event.payload.taskId
                ? { ...task, columnId: event.payload.newColumnId, order: event.payload.newOrder }
                : task,
            ),
          );
        }
        break;

      case 'TaskDeleted':
        if (event.payload.deletedByUserId !== currentUserId) {
          this.tasksResource.update((tasks) =>
            tasks.filter((task) => task.id !== event.payload.taskId),
          );
        }
        break;

      case 'TaskAssigned':
        if (event.payload.assignedByUserId !== currentUserId) {
          this.tasksResource.update((tasks) =>
            tasks.map((task) =>
              task.id === event.payload.taskId
                ? { ...task, assigneeId: event.payload.assigneeId }
                : task,
            ),
          );
        }
        break;

      case 'ColumnCreated':
        if (event.payload.createdByUserId !== currentUserId) {
          this.boardResource.reload();
        }
        break;

      case 'ColumnUpdated':
        if (event.payload.updatedByUserId !== currentUserId) {
          this.boardResource.reload();
        }
        break;

      case 'ColumnDeleted':
        if (event.payload.deletedByUserId !== currentUserId) {
          this.boardResource.reload();
          this.tasksResource.reload();
        }
        break;

      case 'BoardUpdated':
        if (event.payload.updatedByUserId !== currentUserId) {
          this.boardResource.reload();
        }
        break;

      case 'MemberJoined':
        if (event.payload.addedByUserId !== currentUserId) {
          this.boardResource.reload();
        }
        break;

      case 'LabelCreated':
        if (event.payload.createdByUserId !== currentUserId) {
          this.labelsResource.reload();
        }
        break;

      case 'LabelUpdated':
        if (event.payload.updatedByUserId !== currentUserId) {
          this.labelsResource.reload();
        }
        break;

      case 'LabelDeleted':
        if (event.payload.deletedByUserId !== currentUserId) {
          this.labelsResource.reload();
        }
        break;
    }
  }
}
