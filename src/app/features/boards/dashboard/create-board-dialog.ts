import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';

import { ApiError } from '../../../core/http/api-error.model';
import { createTouchedTracker } from '../../../shared/forms/touched-tracker';
import { HlmButton } from '../../../shared/ui/button/src';
import {
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '../../../shared/ui/dialog/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { HlmLabel } from '../../../shared/ui/label/src';
import { HlmTextarea } from '../../../shared/ui/textarea/src';
import { BoardDetail } from '../data/board.models';
import { BoardsService } from '../data/boards.service';

@Component({
  selector: 'app-create-board-dialog',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmDialogHeader,
    HlmDialogFooter,
    HlmDialogTitle,
    HlmDialogDescription,
  ],
  templateUrl: './create-board-dialog.html',
})
export class CreateBoardDialog {
  private readonly boardsService = inject(BoardsService);
  private readonly dialogRef = inject(BrnDialogRef<BoardDetail>);

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    backgroundColor: new FormControl('#2563eb', { nonNullable: true }),
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly touched = createTouchedTracker();

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { title, description, backgroundColor } = this.form.getRawValue();

    this.boardsService
      .create({ title, description: description || undefined, backgroundColor })
      .subscribe({
        next: (board) => this.dialogRef.close(board),
        error: (error: unknown) => {
          this.submitting.set(false);
          this.errorMessage.set(this.resolveErrorMessage(error));
        },
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    if (apiError?.errors?.length) {
      return apiError.errors.join(' ');
    }
    return apiError?.title ?? 'Não foi possível criar o board. Tente novamente.';
  }
}
