import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: '',
  host: {
    '[class]': 'hostClass()',
  },
})
export class Skeleton {
  readonly class = input('', { alias: 'class' });

  protected readonly hostClass = computed(() =>
    `animate-pulse rounded-md bg-muted ${this.class()}`.trim(),
  );
}
