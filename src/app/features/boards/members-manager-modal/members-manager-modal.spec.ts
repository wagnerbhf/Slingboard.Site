import { DIALOG_DATA } from '@angular/cdk/dialog';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BoardDetail } from '../data/board.models';
import { BoardsService } from '../data/boards.service';
import { UsersService } from '../data/users.service';
import { MembersManagerModal, MembersManagerModalContext } from './members-manager-modal';

const BOARD: BoardDetail = {
  id: 'board-1',
  title: 'Board',
  description: null,
  ownerId: 'user-1',
  backgroundColor: null,
  isPublic: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  columns: [],
  members: [{ userId: 'user-1', name: 'Ana', email: 'ana@a.com', role: 'Owner' }],
};

describe('MembersManagerModal', () => {
  let boardsService: { addMember: ReturnType<typeof vi.fn> };
  let usersService: { search: ReturnType<typeof vi.fn> };
  let httpMock: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<MembersManagerModal>>;

  async function createComponent(context: MembersManagerModalContext = { boardId: 'board-1' }) {
    boardsService = { addMember: vi.fn() };
    usersService = { search: vi.fn().mockReturnValue(of([])) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BoardsService, useValue: boardsService },
        { provide: UsersService, useValue: usersService },
        { provide: BrnDialogRef, useValue: { close: vi.fn() } },
        { provide: DIALOG_DATA, useValue: context },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MembersManagerModal);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1`).flush(BOARD);
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  afterEach(() => httpMock.verify());

  it('searches users after debounce and excludes existing members from the results', async () => {
    const component = await createComponent();
    usersService.search.mockReturnValue(
      of([
        { id: 'user-1', name: 'Ana', email: 'ana@a.com' },
        { id: 'user-2', name: 'Bea', email: 'bea@b.com' },
      ]),
    );

    vi.useFakeTimers();
    component['searchControl'].setValue('a');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();

    expect(usersService.search).toHaveBeenCalledWith('a');
    expect(component['searchResultsExcludingMembers']().map((u) => u.id)).toEqual(['user-2']);
  });

  it('adds a member, clears the search and reloads the board on success', async () => {
    const component = await createComponent();
    boardsService.addMember.mockReturnValue(
      of({ userId: 'user-2', name: 'Bea', email: 'bea@b.com', role: 'Member' }),
    );

    component['searchControl'].setValue('bea');
    component['addMember']({ id: 'user-2', name: 'Bea', email: 'bea@b.com' });

    expect(boardsService.addMember).toHaveBeenCalledWith('board-1', {
      userId: 'user-2',
      role: 'Member',
    });
    expect(component['searchControl'].value).toBe('');

    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiBaseUrl}/boards/board-1`).flush({
      ...BOARD,
      members: [
        ...BOARD.members,
        { userId: 'user-2', name: 'Bea', email: 'bea@b.com', role: 'Member' },
      ],
    });
    await fixture.whenStable();
  });

  it('shows a permission error message on 403', async () => {
    const component = await createComponent();
    boardsService.addMember.mockReturnValue(throwError(() => ({ status: 403 })));

    component['addMember']({ id: 'user-2', name: 'Bea', email: 'bea@b.com' });

    expect(component['addError']()).toBe(
      'Você não tem permissão para adicionar membros a este board.',
    );
  });
});
