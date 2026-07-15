import { TestBed } from '@angular/core/testing';

import { FiltersBar } from './filters-bar';

describe('FiltersBar', () => {
  it('emits the current filters whenever a control changes', () => {
    const fixture = TestBed.createComponent(FiltersBar);
    const component = fixture.componentInstance;

    const emitted: unknown[] = [];
    component.filtersChanged.subscribe((filters) => emitted.push(filters));

    component['form'].controls.priority.setValue('High');
    component['emitFilters']();

    expect(emitted.at(-1)).toEqual({
      priority: 'High',
      labelId: undefined,
      assigneeId: undefined,
      dueDateFrom: undefined,
      dueDateTo: undefined,
    });
  });

  it('clearFilters resets the form and emits empty filters', () => {
    const fixture = TestBed.createComponent(FiltersBar);
    const component = fixture.componentInstance;

    const emitted: unknown[] = [];
    component.filtersChanged.subscribe((filters) => emitted.push(filters));

    component['form'].controls.priority.setValue('Urgent');
    component['clearFilters']();

    expect(emitted.at(-1)).toEqual({
      priority: undefined,
      labelId: undefined,
      assigneeId: undefined,
      dueDateFrom: undefined,
      dueDateTo: undefined,
    });
    expect(component['form'].controls.priority.value).toBe('');
  });
});
