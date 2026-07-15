import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BoardSummary } from '../data/board.models';

@Component({
  selector: 'app-board-card',
  imports: [RouterLink],
  templateUrl: './board-card.html',
})
export class BoardCard {
  readonly board = input.required<BoardSummary>();
}
