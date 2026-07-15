import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';

import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/api-error.model';
import { createTouchedTracker } from '../../../shared/forms/touched-tracker';
import { HlmButton } from '../../../shared/ui/button/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { HlmLabel } from '../../../shared/ui/label/src';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, HlmButton, HlmInput, HlmLabel, NgIcon],
  providers: [provideIcons({ lucideEye, lucideEyeOff })],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly passwordVisible = signal(false);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly touched = createTouchedTracker();

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/boards'),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error));
      },
    });
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    if (apiError?.status === 401) {
      return 'Email ou senha inválidos.';
    }
    if (apiError?.status === 429) {
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    }
    return apiError?.title ?? 'Não foi possível entrar. Tente novamente.';
  }
}
