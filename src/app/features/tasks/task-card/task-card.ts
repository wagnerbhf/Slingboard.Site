import { Component, computed, input, output } from '@angular/core';

import { BoardMember } from '../../boards/data/board.models';
import { TaskResponse } from '../data/task.models';

const PRIORITY_BORDER_CLASS: Record<TaskResponse['priority'], string> = {
  Low: 'border-l-muted-foreground/40',
  Medium: 'border-l-primary',
  High: 'border-l-orange-500',
  Urgent: 'border-l-destructive',
};

const PRIORITY_LABEL: Record<TaskResponse['priority'], string> = {
  Low: 'Baixa',
  Medium: 'Média',
  High: 'Alta',
  Urgent: 'Urgente',
};

const DUE_SOON_THRESHOLD_DAYS = 3;

type DueDateStatus = 'overdue' | 'soon' | 'normal';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.html',
})
export class TaskCard {
  readonly task = input.required<TaskResponse>();
  readonly members = input<BoardMember[]>([]);
  readonly opened = output<void>();

  protected readonly priorityBorderClass = computed(
    () => PRIORITY_BORDER_CLASS[this.task().priority],
  );
  protected readonly priorityLabel = computed(() => PRIORITY_LABEL[this.task().priority]);

  protected readonly assignee = computed(() => {
    const assigneeId = this.task().assigneeId;
    return assigneeId ? (this.members().find((m) => m.userId === assigneeId) ?? null) : null;
  });

  protected readonly assigneeInitials = computed(() => {
    const name = this.assignee()?.name;
    if (!name) {
      return null;
    }
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  protected readonly dueDateStatus = computed<DueDateStatus | null>(() => {
    const dueDate = this.task().dueDate;
    if (!dueDate) {
      return null;
    }
    const diffDays = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      return 'overdue';
    }
    return diffDays <= DUE_SOON_THRESHOLD_DAYS ? 'soon' : 'normal';
  });

  protected readonly dueDateBadgeClass = computed(() => {
    switch (this.dueDateStatus()) {
      case 'overdue':
        return 'bg-destructive/10 text-destructive';
      case 'soon':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  });

  protected formattedDueDate(): string {
    const dueDate = this.task().dueDate;
    return dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : '';
  }
}
