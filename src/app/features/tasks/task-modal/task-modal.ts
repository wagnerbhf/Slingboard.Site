import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';

import { ApiError } from '../../../core/http/api-error.model';
import { createTouchedTracker } from '../../../shared/forms/touched-tracker';
import { HlmButton } from '../../../shared/ui/button/src';
import {
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '../../../shared/ui/dialog/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { HlmLabel } from '../../../shared/ui/label/src';
import { HlmTextarea } from '../../../shared/ui/textarea/src';
import { BoardMember } from '../../boards/data/board.models';
import { Label } from '../../labels/data/label.model';
import { TaskPriority, TaskResponse } from '../data/task.models';
import { TasksService } from '../data/tasks.service';

export interface TaskModalContext {
  boardId: string;
  columnId: string;
  members: BoardMember[];
  labels: Label[];
  task?: TaskResponse;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

@Component({
  selector: 'app-task-modal',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmDialogHeader,
    HlmDialogFooter,
    HlmDialogTitle,
    HlmDialogDescription,
  ],
  templateUrl: './task-modal.html',
})
export class TaskModal {
  private readonly tasksService = inject(TasksService);
  private readonly dialogRef = inject(BrnDialogRef<TaskResponse | undefined>);
  protected readonly context = injectBrnDialogContext<TaskModalContext>();

  protected readonly isEditing = !!this.context.task;
  protected readonly priorities = PRIORITIES;

  protected readonly form = new FormGroup({
    title: new FormControl(this.context.task?.title ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl(this.context.task?.description ?? '', { nonNullable: true }),
    priority: new FormControl<TaskPriority>(this.context.task?.priority ?? 'Medium', {
      nonNullable: true,
    }),
    dueDate: new FormControl(this.toDateInputValue(this.context.task?.dueDate), {
      nonNullable: true,
    }),
    assigneeId: new FormControl(this.context.task?.assigneeId ?? '', { nonNullable: true }),
  });

  protected readonly selectedLabelIds = signal(
    new Set(this.context.task?.labels.map((label) => label.id) ?? []),
  );

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly touched = createTouchedTracker();

  protected isLabelSelected(labelId: string): boolean {
    return this.selectedLabelIds().has(labelId);
  }

  protected toggleLabel(labelId: string): void {
    const next = new Set(this.selectedLabelIds());
    if (next.has(labelId)) {
      next.delete(labelId);
    } else {
      next.add(labelId);
    }
    this.selectedLabelIds.set(next);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { title, description, priority, dueDate, assigneeId } = this.form.getRawValue();
    const labelIds = Array.from(this.selectedLabelIds());
    const dueDateIso = dueDate ? new Date(dueDate).toISOString() : null;
    const nextAssigneeId = assigneeId || null;

    if (this.context.task) {
      this.saveEdit(this.context.task, {
        title,
        description: description || null,
        priority,
        dueDate: dueDateIso,
        labelIds,
        nextAssigneeId,
      });
    } else {
      this.tasksService
        .create(this.context.boardId, {
          columnId: this.context.columnId,
          title,
          description: description || null,
          priority,
          dueDate: dueDateIso,
          labelIds,
          assigneeId: nextAssigneeId,
        })
        .subscribe({
          next: (task) => this.dialogRef.close(task),
          error: (error: unknown) => this.handleError(error),
        });
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private saveEdit(
    task: TaskResponse,
    fields: {
      title: string;
      description: string | null;
      priority: TaskPriority;
      dueDate: string | null;
      labelIds: string[];
      nextAssigneeId: string | null;
    },
  ): void {
    const { nextAssigneeId, ...updateRequest } = fields;

    this.tasksService.update(task.id, updateRequest).subscribe({
      next: (updatedTask) => {
        if (nextAssigneeId === task.assigneeId) {
          this.dialogRef.close(updatedTask);
          return;
        }

        this.tasksService.assign(task.id, nextAssigneeId).subscribe({
          next: (assignedTask) => this.dialogRef.close(assignedTask),
          error: (error: unknown) => this.handleError(error),
        });
      },
      error: (error: unknown) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.submitting.set(false);
    this.errorMessage.set(this.resolveErrorMessage(error));
  }

  private toDateInputValue(dueDate: string | null | undefined): string {
    return dueDate ? dueDate.slice(0, 10) : '';
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    if (apiError?.errors?.length) {
      return apiError.errors.join(' ');
    }
    return apiError?.title ?? 'Não foi possível salvar a task. Tente novamente.';
  }
}
