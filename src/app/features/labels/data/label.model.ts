export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface LabelRequest {
  name: string;
  color: string;
}
