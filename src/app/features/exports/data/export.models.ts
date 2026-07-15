export type ExportFormat = 'csv' | 'pdf';

export interface ExportRequest {
  format: ExportFormat;
  includeCompleted: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
}
