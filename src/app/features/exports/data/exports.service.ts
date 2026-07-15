import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ExportFormat, ExportRequest, ExportResult } from './export.models';

@Injectable({ providedIn: 'root' })
export class ExportsService {
  private readonly http = inject(HttpClient);

  export(boardId: string, request: ExportRequest): Observable<ExportResult> {
    let params = new HttpParams()
      .set('format', request.format)
      .set('includeCompleted', String(request.includeCompleted));

    if (request.dateFrom) {
      params = params.set('dateFrom', request.dateFrom);
    }
    if (request.dateTo) {
      params = params.set('dateTo', request.dateTo);
    }

    return this.http
      .get(`${environment.apiBaseUrl}/boards/${boardId}/export`, {
        params,
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: this.resolveFileName(
            response.headers.get('content-disposition'),
            request.format,
          ),
        })),
      );
  }

  private resolveFileName(contentDisposition: string | null, format: ExportFormat): string {
    const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
    return match?.[1] ?? `board-export.${format}`;
  }
}
