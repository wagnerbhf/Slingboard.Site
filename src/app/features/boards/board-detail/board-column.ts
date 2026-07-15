import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash } from '@ng-icons/lucide';

import { ApiError } from '../../../core/http/api-error.model';
import { HlmButton } from '../../../shared/ui/button/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { TaskCard } from '../../tasks/task-card/task-card';
import { TaskResponse } from '../../tasks/data/task.models';
import { BoardColumn as BoardColumnModel, BoardMember } from '../data/board.models';
import { ColumnsService } from '../data/columns.service';

@Component({
  selector: 'app-board-column',
  imports: [ReactiveFormsModule, HlmButton, HlmInput, NgIcon, TaskCard, CdkDropList, CdkDrag],
  providers: [provideIcons({ lucidePencil, lucideTrash })],
  templateUrl: './board-column.html',
})
export class BoardColumnComponent {
  private readonly columnsService = inject(ColumnsService);

  readonly column = input.required<BoardColumnModel>();
  readonly tasks = input.required<TaskResponse[]>();
  readonly members = input<BoardMember[]>([]);
  readonly createTask = output<string>();
  readonly taskDropped = output<CdkDragDrop<TaskResponse[]>>();
  readonly taskClicked = output<TaskResponse>();
  readonly changed = output<void>();

  protected readonly isOverLimit = computed(() => {
    const limit = this.column().limit;
    return limit !== null && this.tasks().length > limit;
  });

  protected readonly countBadgeClass = computed(() =>
    this.isOverLimit() ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
  );

  protected readonly addingTask = signal(false);
  protected readonly newTaskTitle = new FormControl('', { nonNullable: true });

  protected startAddingTask(): void {
    this.addingTask.set(true);
  }

  protected cancelAddingTask(): void {
    this.newTaskTitle.setValue('');
    this.addingTask.set(false);
  }

  protected submitNewTask(): void {
    const title = this.newTaskTitle.value.trim();
    if (!title) {
      this.cancelAddingTask();
      return;
    }
    this.createTask.emit(title);
    this.cancelAddingTask();
  }

  protected readonly editingColumn = signal(false);
  protected readonly editTitle = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly editLimit = new FormControl('', { nonNullable: true });
  protected readonly savingColumn = signal(false);
  protected readonly deletingColumn = signal(false);
  protected readonly columnError = signal<string | null>(null);

  protected startEditingColumn(): void {
    const column = this.column();
    this.editTitle.setValue(column.title);
    this.editLimit.setValue(column.limit !== null ? String(column.limit) : '');
    this.columnError.set(null);
    this.editingColumn.set(true);
  }

  protected cancelEditingColumn(): void {
    this.editingColumn.set(false);
  }

  protected saveColumnEdit(): void {
    if (this.editTitle.invalid) {
      this.editTitle.markAsTouched();
      return;
    }

    this.savingColumn.set(true);
    this.columnError.set(null);

    const limitValue = this.editLimit.value.trim();

    this.columnsService
      .update(this.column().id, {
        title: this.editTitle.value.trim(),
        limit: limitValue ? Number(limitValue) : null,
      })
      .subscribe({
        next: () => {
          this.savingColumn.set(false);
          this.editingColumn.set(false);
          this.changed.emit();
        },
        error: (error: unknown) => {
          this.savingColumn.set(false);
          this.columnError.set(this.resolveErrorMessage(error));
        },
      });
  }

  protected deleteColumn(): void {
    const column = this.column();
    if (!confirm(`Remover a coluna "${column.title}"? As tasks serão movidas para outra coluna.`)) {
      return;
    }

    this.deletingColumn.set(true);

    this.columnsService.delete(column.id).subscribe({
      next: () => {
        this.deletingColumn.set(false);
        this.changed.emit();
      },
      error: () => this.deletingColumn.set(false),
    });
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    return apiError?.title ?? 'Não foi possível salvar a coluna. Tente novamente.';
  }
}
