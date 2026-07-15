import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HlmToaster } from './shared/ui/sonner/src';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
