import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';

import { ApiError } from '../../../core/http/api-error.model';
import { HlmButton } from '../../../shared/ui/button/src';
import {
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '../../../shared/ui/dialog/src';
import { HlmLabel } from '../../../shared/ui/label/src';
import { ExportFormat } from '../data/export.models';
import { ExportsService } from '../data/exports.service';

export interface ExportModalContext {
  boardId: string;
}

@Component({
  selector: 'app-export-modal',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmLabel,
    HlmDialogHeader,
    HlmDialogFooter,
    HlmDialogTitle,
    HlmDialogDescription,
  ],
  templateUrl: './export-modal.html',
})
export class ExportModal {
  private readonly exportsService = inject(ExportsService);
  private readonly dialogRef = inject(BrnDialogRef<void>);
  protected readonly context = injectBrnDialogContext<ExportModalContext>();

  protected readonly form = new FormGroup({
    format: new FormControl<ExportFormat>('csv', { nonNullable: true }),
    includeCompleted: new FormControl(true, { nonNullable: true }),
    dateFrom: new FormControl('', { nonNullable: true }),
    dateTo: new FormControl('', { nonNullable: true }),
  });

  protected readonly exporting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    this.exporting.set(true);
    this.errorMessage.set(null);

    const { format, includeCompleted, dateFrom, dateTo } = this.form.getRawValue();

    this.exportsService
      .export(this.context.boardId, {
        format,
        includeCompleted,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      .subscribe({
        next: ({ blob, fileName }) => {
          this.exporting.set(false);
          this.downloadBlob(blob, fileName);
          this.dialogRef.close();
        },
        error: (error: unknown) => {
          this.exporting.set(false);
          this.errorMessage.set(this.resolveErrorMessage(error));
        },
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    return apiError?.title ?? 'Não foi possível exportar o board. Tente novamente.';
  }
}
