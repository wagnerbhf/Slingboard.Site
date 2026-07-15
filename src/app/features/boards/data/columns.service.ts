import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BoardColumn, CreateColumnRequest, UpdateColumnRequest } from './board.models';

@Injectable({ providedIn: 'root' })
export class ColumnsService {
  private readonly http = inject(HttpClient);

  create(boardId: string, request: CreateColumnRequest): Observable<BoardColumn> {
    return this.http.post<BoardColumn>(
      `${environment.apiBaseUrl}/boards/${boardId}/columns`,
      request,
    );
  }

  update(columnId: string, request: UpdateColumnRequest): Observable<BoardColumn> {
    return this.http.put<BoardColumn>(`${environment.apiBaseUrl}/columns/${columnId}`, request);
  }

  delete(columnId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/columns/${columnId}`);
  }
}
