export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface TaskResponse {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  order: number;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  labels: TaskLabel[];
}

export interface CreateTaskRequest {
  columnId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  labelIds?: string[] | null;
  assigneeId?: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  labelIds?: string[] | null;
}

export interface TaskFilters {
  columnId?: string;
  priority?: TaskPriority;
  labelId?: string;
  assigneeId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}
