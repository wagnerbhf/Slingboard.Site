export interface BoardSummary {
  id: string;
  title: string;
  description: string | null;
  backgroundColor: string | null;
  taskCount: number;
  memberCount: number;
  updatedAt: string;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
  backgroundColor?: string;
}

export type UpdateBoardRequest = CreateBoardRequest;

export type BoardMemberRole = 'Owner' | 'Admin' | 'Member';

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  limit: number | null;
}

export interface CreateColumnRequest {
  title: string;
  limit?: number | null;
}

export type UpdateColumnRequest = CreateColumnRequest;

export interface BoardMember {
  userId: string;
  name: string;
  email: string;
  role: BoardMemberRole;
}

export interface BoardDetail {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  backgroundColor: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  columns: BoardColumn[];
  members: BoardMember[];
}
