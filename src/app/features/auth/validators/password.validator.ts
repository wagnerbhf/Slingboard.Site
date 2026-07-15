import { AbstractControl, ValidationErrors } from '@angular/forms';

export function checkPasswordComplexity(value: string): ValidationErrors | null {
  if (!value) {
    return null;
  }

  const errors: ValidationErrors = {};
  if (value.length < 8) {
    errors['minLength'] = true;
  }
  if (!/[A-Z]/.test(value)) {
    errors['uppercase'] = true;
  }
  if (!/[0-9]/.test(value)) {
    errors['number'] = true;
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    errors['symbol'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function passwordComplexityValidator(
  control: AbstractControl<string>,
): ValidationErrors | null {
  return checkPasswordComplexity(control.value);
}
