import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { HlmButton } from '../../../shared/ui/button/src';
import { Label } from '../../labels/data/label.model';
import { TaskFilters, TaskPriority } from '../../tasks/data/task.models';
import { BoardMember } from '../data/board.models';

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

@Component({
  selector: 'app-filters-bar',
  imports: [ReactiveFormsModule, HlmButton],
  templateUrl: './filters-bar.html',
})
export class FiltersBar {
  readonly labels = input<Label[]>([]);
  readonly members = input<BoardMember[]>([]);
  readonly filtersChanged = output<TaskFilters>();

  protected readonly priorities = PRIORITIES;

  protected readonly form = new FormGroup({
    priority: new FormControl<TaskPriority | ''>('', { nonNullable: true }),
    labelId: new FormControl('', { nonNullable: true }),
    assigneeId: new FormControl('', { nonNullable: true }),
    dueDateFrom: new FormControl('', { nonNullable: true }),
    dueDateTo: new FormControl('', { nonNullable: true }),
  });

  protected emitFilters(): void {
    const { priority, labelId, assigneeId, dueDateFrom, dueDateTo } = this.form.getRawValue();
    this.filtersChanged.emit({
      priority: priority || undefined,
      labelId: labelId || undefined,
      assigneeId: assigneeId || undefined,
      dueDateFrom: dueDateFrom || undefined,
      dueDateTo: dueDateTo || undefined,
    });
  }

  protected clearFilters(): void {
    this.form.reset({ priority: '', labelId: '', assigneeId: '', dueDateFrom: '', dueDateTo: '' });
    this.emitFilters();
  }
}
