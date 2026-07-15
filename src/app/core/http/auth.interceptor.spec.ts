import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let accessToken: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    accessToken = signal<string | null>(null);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { accessToken } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the Authorization header when a token is present', () => {
    accessToken.set('token-123');

    http.get('/api/v1/boards').subscribe();

    const req = httpMock.expectOne('/api/v1/boards');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush([]);
  });

  it('does not add the header when there is no token', () => {
    http.get('/api/v1/boards').subscribe();

    const req = httpMock.expectOne('/api/v1/boards');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('skips exempt auth paths even with a token present', () => {
    accessToken.set('token-123');

    http.post('/api/v1/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
