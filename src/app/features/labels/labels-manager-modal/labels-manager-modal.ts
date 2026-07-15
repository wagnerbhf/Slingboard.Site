import { httpResource } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';

import { environment } from '../../../../environments/environment';
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
import { Label } from '../data/label.model';
import { LabelsService } from '../data/labels.service';

export interface LabelsManagerModalContext {
  boardId: string;
}

const DEFAULT_COLOR = '#2563eb';

@Component({
  selector: 'app-labels-manager-modal',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmDialogHeader,
    HlmDialogFooter,
    HlmDialogTitle,
    HlmDialogDescription,
  ],
  templateUrl: './labels-manager-modal.html',
})
export class LabelsManagerModal {
  private readonly labelsService = inject(LabelsService);
  private readonly dialogRef = inject(BrnDialogRef<void>);
  protected readonly context = injectBrnDialogContext<LabelsManagerModalContext>();

  protected readonly labelsResource = httpResource<Label[]>(
    () => `${environment.apiBaseUrl}/boards/${this.context.boardId}/labels`,
    { defaultValue: [] },
  );

  protected readonly createForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    color: new FormControl(DEFAULT_COLOR, { nonNullable: true }),
  });
  protected readonly createTouched = createTouchedTracker();
  protected readonly createPreview = toSignal(this.createForm.valueChanges, {
    initialValue: this.createForm.getRawValue(),
  });
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly editingLabelId = signal<string | null>(null);
  protected readonly editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    color: new FormControl(DEFAULT_COLOR, { nonNullable: true }),
  });
  protected readonly editTouched = createTouchedTracker();
  protected readonly editPreview = toSignal(this.editForm.valueChanges, {
    initialValue: this.editForm.getRawValue(),
  });
  protected readonly savingEdit = signal(false);
  protected readonly editError = signal<string | null>(null);

  protected readonly deletingLabelId = signal<string | null>(null);

  protected createLabel(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    this.labelsService.create(this.context.boardId, this.createForm.getRawValue()).subscribe({
      next: () => {
        this.creating.set(false);
        this.createForm.reset({ name: '', color: DEFAULT_COLOR });
        this.labelsResource.reload();
      },
      error: (error: unknown) => {
        this.creating.set(false);
        this.createError.set(this.resolveErrorMessage(error));
      },
    });
  }

  protected startEditing(label: Label): void {
    this.editingLabelId.set(label.id);
    this.editForm.reset({ name: label.name, color: label.color });
    this.editError.set(null);
  }

  protected cancelEditing(): void {
    this.editingLabelId.set(null);
  }

  protected saveEdit(labelId: string): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.savingEdit.set(true);
    this.editError.set(null);

    this.labelsService.update(labelId, this.editForm.getRawValue()).subscribe({
      next: () => {
        this.savingEdit.set(false);
        this.editingLabelId.set(null);
        this.labelsResource.reload();
      },
      error: (error: unknown) => {
        this.savingEdit.set(false);
        this.editError.set(this.resolveErrorMessage(error));
      },
    });
  }

  protected deleteLabel(label: Label): void {
    if (!confirm(`Remover a label "${label.name}"? Ela também será removida de todas as tasks.`)) {
      return;
    }

    this.deletingLabelId.set(label.id);

    this.labelsService.delete(label.id).subscribe({
      next: () => {
        this.deletingLabelId.set(null);
        this.labelsResource.reload();
      },
      error: () => this.deletingLabelId.set(null),
    });
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    if (apiError?.errors?.length) {
      return apiError.errors.join(' ');
    }
    return apiError?.title ?? 'Não foi possível salvar a label. Tente novamente.';
  }
}
