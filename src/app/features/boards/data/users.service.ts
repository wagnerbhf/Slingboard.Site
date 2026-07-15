import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { UserSummary } from './user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<UserSummary[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<UserSummary[]>(`${environment.apiBaseUrl}/users`, { params });
  }
}
