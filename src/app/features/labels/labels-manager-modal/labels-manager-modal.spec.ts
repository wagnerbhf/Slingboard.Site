import { DIALOG_DATA } from '@angular/cdk/dialog';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { LabelsService } from '../data/labels.service';
import { LabelsManagerModal, LabelsManagerModalContext } from './labels-manager-modal';

describe('LabelsManagerModal', () => {
  let labelsService: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let httpMock: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<LabelsManagerModal>>;

  async function createComponent(context: LabelsManagerModalContext = { boardId: 'board-1' }) {
    labelsService = { create: vi.fn(), update: vi.fn(), delete: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LabelsService, useValue: labelsService },
        { provide: BrnDialogRef, useValue: { close: vi.fn() } },
        { provide: DIALOG_DATA, useValue: context },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LabelsManagerModal);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1/labels`).flush([]);
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  afterEach(() => httpMock.verify());

  it('does not create a label with an empty name', async () => {
    const component = await createComponent();

    component['createLabel']();

    expect(labelsService.create).not.toHaveBeenCalled();
    expect(component['createForm'].controls.name.touched).toBe(true);
  });

  it('creates a label, resets the form and reloads the list on success', async () => {
    const component = await createComponent();
    labelsService.create.mockReturnValue(
      of({ id: 'l1', boardId: 'board-1', name: 'Bug', color: '#ff0000' }),
    );

    component['createForm'].controls.name.setValue('Bug');
    component['createForm'].controls.color.setValue('#ff0000');
    component['createLabel']();

    expect(labelsService.create).toHaveBeenCalledWith('board-1', { name: 'Bug', color: '#ff0000' });
    expect(component['createForm'].controls.name.value).toBe('');

    fixture.detectChanges();
    httpMock
      .expectOne(`${environment.apiBaseUrl}/boards/board-1/labels`)
      .flush([{ id: 'l1', boardId: 'board-1', name: 'Bug', color: '#ff0000' }]);
    await fixture.whenStable();
  });

  it('surfaces the error message when creation fails', async () => {
    const component = await createComponent();
    labelsService.create.mockReturnValue(
      throwError(() => ({ title: 'Nome já utilizado', status: 409 })),
    );

    component['createForm'].controls.name.setValue('Bug');
    component['createLabel']();

    expect(component['createError']()).toBe('Nome já utilizado');
  });

  it('deletes a label only after user confirmation', async () => {
    const component = await createComponent();
    const label = { id: 'l1', boardId: 'board-1', name: 'Bug', color: '#ff0000' };

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component['deleteLabel'](label);
    expect(labelsService.delete).not.toHaveBeenCalled();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    labelsService.delete.mockReturnValue(of(undefined));
    component['deleteLabel'](label);

    expect(labelsService.delete).toHaveBeenCalledWith('l1');
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1/labels`).flush([]);
    await fixture.whenStable();
  });
});
