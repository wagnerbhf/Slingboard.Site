import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { errorInterceptor } from './error.interceptor';

vi.mock('@spartan-ng/brain/sonner', () => ({
  toast: { error: vi.fn() },
}));

import { toast } from '@spartan-ng/brain/sonner';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalizes an ApiError body, rethrows it and toasts the title', () => {
    let captured: unknown;
    http.get('/api/v1/boards/1').subscribe({ error: (err) => (captured = err) });

    httpMock
      .expectOne('/api/v1/boards/1')
      .flush(
        { title: 'Board não encontrado', status: 404 },
        { status: 404, statusText: 'Not Found' },
      );

    expect(captured).toEqual({ title: 'Board não encontrado', status: 404 });
    expect(toast.error).toHaveBeenCalledWith('Board não encontrado');
  });

  it('joins validation errors into a single toast message', () => {
    http.post('/api/v1/boards', {}).subscribe({ error: () => undefined });

    httpMock.expectOne('/api/v1/boards').flush(
      {
        title: 'Validation failed',
        status: 400,
        errors: ['Título é obrigatório.', 'Cor inválida.'],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(toast.error).toHaveBeenCalledWith('Título é obrigatório. Cor inválida.');
  });

  it('shows a generic message for errors that are not shaped like ApiError', () => {
    http.get('/api/v1/boards').subscribe({ error: () => undefined });

    httpMock
      .expectOne('/api/v1/boards')
      .flush('unexpected', { status: 500, statusText: 'Server Error' });

    expect(toast.error).toHaveBeenCalledWith(
      'Não foi possível completar a requisição. Tente novamente.',
    );
  });
});
