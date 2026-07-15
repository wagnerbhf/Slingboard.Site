import { httpResource } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { HlmButton } from '../../../shared/ui/button/src';
import { HlmDialogService } from '../../../shared/ui/dialog/src';
import {
  LabelsManagerModal,
  LabelsManagerModalContext,
} from '../../labels/labels-manager-modal/labels-manager-modal';
import { BoardDetail } from '../data/board.models';
import {
  MembersManagerModal,
  MembersManagerModalContext,
} from '../members-manager-modal/members-manager-modal';

@Component({
  selector: 'app-board-settings-page',
  imports: [RouterLink, HlmButton],
  templateUrl: './board-settings-page.html',
})
export class BoardSettingsPage {
  readonly boardId = input.required<string>();

  private readonly dialogService = inject(HlmDialogService);

  protected readonly boardResource = httpResource<BoardDetail>(
    () => `${environment.apiBaseUrl}/boards/${this.boardId()}`,
  );

  protected openLabelsManager(): void {
    this.dialogService.open<void, LabelsManagerModalContext>(LabelsManagerModal, {
      context: { boardId: this.boardId() },
    });
  }

  protected openMembersManager(): void {
    this.dialogService.open<void, MembersManagerModalContext>(MembersManagerModal, {
      context: { boardId: this.boardId() },
    });
  }
}
