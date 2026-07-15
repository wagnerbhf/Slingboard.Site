// Mirrors TaskPriority (features/tasks/data/task.models.ts) and BoardMemberRole
// (features/boards/data/board.models.ts) locally instead of importing them, so core/ doesn't
// depend on features/ - the string unions mirror the backend's fixed C# enums, so drift is
// unlikely.
type RealtimeTaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
type RealtimeBoardMemberRole = 'Owner' | 'Admin' | 'Member';

export interface TaskCreatedPayload {
  taskId: string;
  columnId: string;
  title: string;
  createdByUserId: string;
}

export interface TaskUpdatedPayload {
  taskId: string;
  title: string;
  priority: RealtimeTaskPriority;
  updatedByUserId: string;
}

export interface TaskMovedPayload {
  taskId: string;
  oldColumnId: string;
  newColumnId: string;
  newOrder: number;
  movedByUserId: string;
  timestamp: string;
}

export interface TaskDeletedPayload {
  taskId: string;
  deletedByUserId: string;
}

export interface TaskAssignedPayload {
  taskId: string;
  assigneeId: string | null;
  assignedByUserId: string;
}

export interface BoardUpdatedPayload {
  boardId: string;
  title: string;
  updatedByUserId: string;
}

export interface MemberJoinedPayload {
  boardId: string;
  userId: string;
  name: string;
  role: RealtimeBoardMemberRole;
  addedByUserId: string;
}

export interface LabelCreatedPayload {
  labelId: string;
  name: string;
  color: string;
  createdByUserId: string;
}

export interface LabelUpdatedPayload {
  labelId: string;
  name: string;
  color: string;
  updatedByUserId: string;
}

export interface LabelDeletedPayload {
  labelId: string;
  deletedByUserId: string;
}

export type RealtimeEvent =
  | { type: 'TaskCreated'; payload: TaskCreatedPayload }
  | { type: 'TaskUpdated'; payload: TaskUpdatedPayload }
  | { type: 'TaskMoved'; payload: TaskMovedPayload }
  | { type: 'TaskDeleted'; payload: TaskDeletedPayload }
  | { type: 'TaskAssigned'; payload: TaskAssignedPayload }
  | { type: 'BoardUpdated'; payload: BoardUpdatedPayload }
  | { type: 'MemberJoined'; payload: MemberJoinedPayload }
  | { type: 'LabelCreated'; payload: LabelCreatedPayload }
  | { type: 'LabelUpdated'; payload: LabelUpdatedPayload }
  | { type: 'LabelDeleted'; payload: LabelDeletedPayload };

export const REALTIME_EVENT_NAMES = [
  'TaskCreated',
  'TaskUpdated',
  'TaskMoved',
  'TaskDeleted',
  'TaskAssigned',
  'BoardUpdated',
  'MemberJoined',
  'LabelCreated',
  'LabelUpdated',
  'LabelDeleted',
] as const satisfies readonly RealtimeEvent['type'][];
