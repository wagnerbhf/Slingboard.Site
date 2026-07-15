import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiError } from '../../../core/http/api-error.model';
import { HlmButton } from '../../../shared/ui/button/src';
import {
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '../../../shared/ui/dialog/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { HlmLabel } from '../../../shared/ui/label/src';
import { BoardDetail } from '../data/board.models';
import { BoardsService } from '../data/boards.service';
import { UserSummary } from '../data/user.model';
import { UsersService } from '../data/users.service';

export interface MembersManagerModalContext {
  boardId: string;
}

@Component({
  selector: 'app-members-manager-modal',
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
  templateUrl: './members-manager-modal.html',
})
export class MembersManagerModal {
  private readonly boardsService = inject(BoardsService);
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject(BrnDialogRef<void>);
  protected readonly context = injectBrnDialogContext<MembersManagerModalContext>();

  protected readonly boardResource = httpResource<BoardDetail>(
    () => `${environment.apiBaseUrl}/boards/${this.context.boardId}`,
  );

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly searchText = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  protected readonly searching = signal(false);
  protected readonly addingUserId = signal<string | null>(null);
  protected readonly addError = signal<string | null>(null);

  private readonly searchResults = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((search) => {
        const query = search.trim();
        if (!query) {
          this.searching.set(false);
          return of<UserSummary[]>([]);
        }
        this.searching.set(true);
        return this.usersService.search(query).pipe(
          tap(() => this.searching.set(false)),
          catchError(() => {
            this.searching.set(false);
            return of<UserSummary[]>([]);
          }),
        );
      }),
    ),
    { initialValue: [] as UserSummary[] },
  );

  protected readonly searchResultsExcludingMembers = computed(() => {
    const existingIds = new Set(
      (this.boardResource.value()?.members ?? []).map((member) => member.userId),
    );
    return this.searchResults().filter((user) => !existingIds.has(user.id));
  });

  protected addMember(user: UserSummary): void {
    this.addingUserId.set(user.id);
    this.addError.set(null);

    this.boardsService
      .addMember(this.context.boardId, { userId: user.id, role: 'Member' })
      .subscribe({
        next: () => {
          this.addingUserId.set(null);
          this.searchControl.setValue('');
          this.boardResource.reload();
        },
        error: (error: unknown) => {
          this.addingUserId.set(null);
          this.addError.set(this.resolveErrorMessage(error));
        },
      });
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    if (apiError?.status === 403) {
      return 'Você não tem permissão para adicionar membros a este board.';
    }
    return apiError?.title ?? 'Não foi possível adicionar o membro. Tente novamente.';
  }
}
