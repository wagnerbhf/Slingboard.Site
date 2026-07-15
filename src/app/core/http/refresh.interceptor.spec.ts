import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { refreshInterceptor } from './refresh.interceptor';

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: { refresh: ReturnType<typeof vi.fn>; clearSession: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { refresh: vi.fn(), clearSession: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('passes through non-401 errors untouched', () => {
    let capturedStatus: number | undefined;
    http.get('/api/v1/boards').subscribe({ error: (err) => (capturedStatus = err.status) });

    httpMock.expectOne('/api/v1/boards').flush(null, { status: 500, statusText: 'Server Error' });

    expect(capturedStatus).toBe(500);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('refreshes the token on 401 and retries the original request', () => {
    authService.refresh.mockReturnValue(of({ accessToken: 'new-token', expiresIn: 3600 }));

    let result: unknown;
    http.get('/api/v1/boards').subscribe((res) => (result = res));

    httpMock.expectOne('/api/v1/boards').flush(null, { status: 401, statusText: 'Unauthorized' });

    const retried = httpMock.expectOne('/api/v1/boards');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('clears the session and redirects to login when refresh also fails', () => {
    authService.refresh.mockReturnValue(throwError(() => new Error('refresh failed')));

    let errored = false;
    http.get('/api/v1/boards').subscribe({ error: () => (errored = true) });

    httpMock.expectOne('/api/v1/boards').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errored).toBe(true);
    expect(authService.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not attempt a refresh for exempt auth paths', () => {
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });

    httpMock
      .expectOne('/api/v1/auth/login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authService.refresh).not.toHaveBeenCalled();
  });
});
