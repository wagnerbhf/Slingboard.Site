import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  BoardDetail,
  BoardMember,
  BoardMemberRole,
  BoardSummary,
  CreateBoardRequest,
  UpdateBoardRequest,
} from './board.models';

@Injectable({ providedIn: 'root' })
export class BoardsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/boards`;

  list(search?: string): Observable<BoardSummary[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<BoardSummary[]>(this.baseUrl, { params });
  }

  get(boardId: string): Observable<BoardDetail> {
    return this.http.get<BoardDetail>(`${this.baseUrl}/${boardId}`);
  }

  create(request: CreateBoardRequest): Observable<BoardDetail> {
    return this.http.post<BoardDetail>(this.baseUrl, request);
  }

  update(boardId: string, request: UpdateBoardRequest): Observable<BoardDetail> {
    return this.http.put<BoardDetail>(`${this.baseUrl}/${boardId}`, request);
  }

  addMember(
    boardId: string,
    request: { userId: string; role: BoardMemberRole },
  ): Observable<BoardMember> {
    return this.http.post<BoardMember>(`${this.baseUrl}/${boardId}/members`, request);
  }
}
