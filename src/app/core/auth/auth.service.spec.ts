import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

function buildJwt(payload: Record<string, unknown>): string {
  const base64url = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'none' })}.${base64url(payload)}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login sets the access token and decodes the current user from the JWT', () => {
    const token = buildJwt({ sub: 'user-1', name: 'Ana', email: 'ana@example.com' });

    service.login({ email: 'ana@example.com', password: 'Secret123!' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ accessToken: token, expiresIn: 3600 });

    expect(service.accessToken()).toBe(token);
    expect(service.currentUser()).toEqual({ id: 'user-1', name: 'Ana', email: 'ana@example.com' });
    expect(service.isAuthenticated()).toBe(true);
  });

  it('register posts the payload without starting a session', () => {
    service.register({ name: 'Ana', email: 'ana@example.com', password: 'Secret123!' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
    req.flush({ id: '1', name: 'Ana', email: 'ana@example.com' });

    expect(service.accessToken()).toBeNull();
  });

  it('refresh dedupes concurrent calls into a single HTTP request', () => {
    const token = buildJwt({ sub: 'user-1', name: 'Ana', email: 'ana@example.com' });

    service.refresh().subscribe();
    service.refresh().subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
    req.flush({ accessToken: token, expiresIn: 3600 });

    expect(service.accessToken()).toBe(token);
  });

  it('logout clears the session even when the request fails', () => {
    const token = buildJwt({ sub: 'user-1', name: 'Ana', email: 'ana@example.com' });
    service.login({ email: 'ana@example.com', password: 'Secret123!' }).subscribe();
    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush({ accessToken: token, expiresIn: 3600 });

    service.logout().subscribe();
    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/logout`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('clearSession resets the access token and current user', () => {
    service.clearSession();

    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
