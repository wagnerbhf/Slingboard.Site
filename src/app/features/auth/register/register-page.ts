import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/api-error.model';
import { createTouchedTracker } from '../../../shared/forms/touched-tracker';
import { HlmButton } from '../../../shared/ui/button/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { HlmLabel } from '../../../shared/ui/label/src';
import {
  checkPasswordComplexity,
  passwordComplexityValidator,
} from '../validators/password.validator';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, HlmButton, HlmInput, HlmLabel],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordComplexityValidator],
    }),
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly touched = createTouchedTracker();

  // Reflects the password value through a signal so the requirements checklist re-renders on
  // every keystroke under zoneless change detection (see shared/forms/touched-tracker.ts).
  private readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });
  protected readonly passwordErrors = computed(() => checkPasswordComplexity(this.passwordValue()));

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { name, email, password } = this.form.getRawValue();

    this.authService.register({ name, email, password }).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);
        this.authService.login({ email, password }).subscribe({
          next: () => this.router.navigateByUrl('/boards'),
          error: (error: unknown) => {
            this.submitting.set(false);
            this.errorMessage.set(this.resolveErrorMessage(error));
          },
        });
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error));
      },
    });
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    if (apiError?.status === 409) {
      return 'Este email já está cadastrado.';
    }
    if (apiError?.errors?.length) {
      return apiError.errors.join(' ');
    }
    return apiError?.title ?? 'Não foi possível criar sua conta. Tente novamente.';
  }
}
