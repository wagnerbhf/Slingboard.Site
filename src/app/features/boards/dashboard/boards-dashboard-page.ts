import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { ApiError } from '../../../core/http/api-error.model';
import { HlmButton } from '../../../shared/ui/button/src';
import { HlmDialogService } from '../../../shared/ui/dialog/src';
import { HlmInput } from '../../../shared/ui/input/src';
import { BoardDetail, BoardSummary } from '../data/board.models';
import { BoardsService } from '../data/boards.service';
import { BoardCard } from './board-card';
import { CreateBoardDialog } from './create-board-dialog';

@Component({
  selector: 'app-boards-dashboard-page',
  imports: [ReactiveFormsModule, HlmButton, HlmInput, BoardCard],
  templateUrl: './boards-dashboard-page.html',
})
export class BoardsDashboardPage {
  private readonly boardsService = inject(BoardsService);
  private readonly dialogService = inject(HlmDialogService);
  private readonly router = inject(Router);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly boards = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.loading.set(true);
        this.errorMessage.set(null);
      }),
      switchMap((search) =>
        this.boardsService.list(search || undefined).pipe(
          tap(() => this.loading.set(false)),
          catchError((error: unknown) => {
            this.loading.set(false);
            this.errorMessage.set(this.resolveErrorMessage(error));
            return of<BoardSummary[]>([]);
          }),
        ),
      ),
    ),
    { initialValue: [] as BoardSummary[] },
  );

  protected openCreateBoardDialog(): void {
    const ref = this.dialogService.open<BoardDetail>(CreateBoardDialog);
    ref.closed$.subscribe((board) => {
      if (board) {
        this.router.navigate(['/boards', board.id]);
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    const apiError = error as Partial<ApiError> | null;
    return apiError?.title ?? 'Não foi possível carregar os boards.';
  }
}
