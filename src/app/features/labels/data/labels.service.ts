import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Label, LabelRequest } from './label.model';

@Injectable({ providedIn: 'root' })
export class LabelsService {
  private readonly http = inject(HttpClient);

  list(boardId: string): Observable<Label[]> {
    return this.http.get<Label[]>(`${environment.apiBaseUrl}/boards/${boardId}/labels`);
  }

  create(boardId: string, request: LabelRequest): Observable<Label> {
    return this.http.post<Label>(`${environment.apiBaseUrl}/boards/${boardId}/labels`, request);
  }

  update(labelId: string, request: LabelRequest): Observable<Label> {
    return this.http.put<Label>(`${environment.apiBaseUrl}/labels/${labelId}`, request);
  }

  delete(labelId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/labels/${labelId}`);
  }
}
