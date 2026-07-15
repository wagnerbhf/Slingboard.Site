import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from './auth.models';
import { decodeJwtPayload } from './jwt.util';

const REFRESH_MARGIN_SECONDS = 60;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly currentUserSignal = signal<CurrentUser | null>(null);

  private refreshTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private refreshInProgress$: Observable<LoginResponse> | null = null;

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiBaseUrl}/auth/register`, request);
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, request, {
        withCredentials: true,
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  refresh(): Observable<LoginResponse> {
    if (!this.refreshInProgress$) {
      this.refreshInProgress$ = this.http
        .post<LoginResponse>(`${environment.apiBaseUrl}/auth/refresh`, null, {
          withCredentials: true,
        })
        .pipe(
          tap((response) => this.setSession(response)),
          finalize(() => (this.refreshInProgress$ = null)),
          shareReplay(1),
        );
    }
    return this.refreshInProgress$;
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiBaseUrl}/auth/logout`, null, { withCredentials: true })
      .pipe(
        tap(() => this.clearSession()),
        catchError(() => {
          this.clearSession();
          return of(undefined);
        }),
      );
  }

  setCurrentUser(user: CurrentUser): void {
    this.currentUserSignal.set(user);
  }

  clearSession(): void {
    clearTimeout(this.refreshTimeoutId);
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  private setSession(response: LoginResponse): void {
    this.accessTokenSignal.set(response.accessToken);

    if (!this.currentUserSignal()) {
      const claims = decodeJwtPayload(response.accessToken);
      const user = claims ? this.mapClaimsToUser(claims) : null;
      if (user) {
        this.currentUserSignal.set(user);
      }
    }

    this.scheduleProactiveRefresh(response.expiresIn);
  }

  // Nomes de claim assumidos (sub/name/email); confirmar contra o JWT real emitido
  // pelo backend assim que o login estiver integrado — se não baterem, currentUser
  // fica null e a UI deve degradar (ex: sem nome/avatar) em vez de quebrar.
  private mapClaimsToUser(claims: Record<string, unknown>): CurrentUser | null {
    const id = this.firstString(claims, ['sub', 'nameid', 'id']);
    const name = this.firstString(claims, ['name', 'unique_name']);
    const email = this.firstString(claims, ['email']);

    if (!id || !name || !email) {
      return null;
    }

    return { id, name, email };
  }

  private firstString(claims: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = claims[key];
      if (typeof value === 'string') {
        return value;
      }
    }
    return undefined;
  }

  private scheduleProactiveRefresh(expiresInSeconds: number): void {
    clearTimeout(this.refreshTimeoutId);
    const refreshInMs = Math.max((expiresInSeconds - REFRESH_MARGIN_SECONDS) * 1000, 0);
    this.refreshTimeoutId = setTimeout(() => this.refresh().subscribe(), refreshInMs);
  }
}
