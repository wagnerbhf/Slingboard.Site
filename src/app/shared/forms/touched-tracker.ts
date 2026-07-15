import { signal } from '@angular/core';

// Under zoneless change detection, reading FormControl#touched directly in a template doesn't
// reliably repaint: reactive forms updates state but doesn't schedule change detection on its own
// (see https://angular.dev/guide/zoneless). Pair this with a (blur)="touched.markTouched('field')"
// on the control - blur is an Angular-bound template event, so it does trigger a CD pass, by which
// point `touched` already reflects the field the user just left.
export function createTouchedTracker() {
  const touchedFields = signal(new Set<string>());

  return {
    markTouched: (field: string): void => {
      if (!touchedFields().has(field)) {
        touchedFields.update((fields) => new Set(fields).add(field));
      }
    },
    isTouched: (field: string): boolean => touchedFields().has(field),
  };
}
