import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateTaskRequest, TaskFilters, TaskResponse, UpdateTaskRequest } from './task.models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);

  list(boardId: string, filters?: TaskFilters): Observable<TaskResponse[]> {
    let params = new HttpParams();
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      }
    }
    return this.http.get<TaskResponse[]>(`${environment.apiBaseUrl}/boards/${boardId}/tasks`, {
      params,
    });
  }

  create(boardId: string, request: CreateTaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(
      `${environment.apiBaseUrl}/boards/${boardId}/tasks`,
      request,
    );
  }

  move(taskId: string, newColumnId: string, newOrder: number): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${environment.apiBaseUrl}/tasks/${taskId}/move`, {
      newColumnId,
      newOrder,
    });
  }

  update(taskId: string, request: UpdateTaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${environment.apiBaseUrl}/tasks/${taskId}`, request);
  }

  assign(taskId: string, assigneeId: string | null): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${environment.apiBaseUrl}/tasks/${taskId}/assign`, {
      assigneeId,
    });
  }

  delete(taskId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/tasks/${taskId}`);
  }
}
