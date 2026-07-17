import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme/theme.service';
import { getInitials } from '../shared/text/initials';
import { HlmButton } from '../shared/ui/button/src';

@Component({
  selector: 'app-authenticated-layout',
  imports: [RouterOutlet, RouterLink, HlmButton],
  templateUrl: './authenticated-layout.html',
})
export class AuthenticatedLayout {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  protected initials(name: string): string {
    return getInitials(name);
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
