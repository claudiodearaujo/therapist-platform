import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should make GET request to correct URL', () => {
      const mockData = { data: [{ id: 1, name: 'Test' }] };

      service.get<any>('/test').subscribe((response) => {
        expect(response).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/test`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should append query params correctly', () => {
      service.get<any>('/test', { params: { page: 1, limit: 10 } }).subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}/test` &&
          request.params.get('page') === '1' &&
          request.params.get('limit') === '10'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should ignore null and undefined params', () => {
      service.get<any>('/test', { params: { page: 1, empty: null, undef: undefined } }).subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}/test` &&
          request.params.get('page') === '1' &&
          !request.params.has('empty') &&
          !request.params.has('undef')
        );
      });
      req.flush({});
    });
  });

  describe('post', () => {
    it('should make POST request with body', () => {
      const postData = { email: 'test@test.com', password: 'password' };
      const mockResponse = { success: true };

      service.post<any>('/auth/login', postData).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(postData);
      req.flush(mockResponse);
    });
  });

  describe('put', () => {
    it('should make PUT request with body', () => {
      const putData = { name: 'Updated Name' };

      service.put<any>('/users/1', putData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(putData);
      req.flush({});
    });
  });

  describe('patch', () => {
    it('should make PATCH request with body', () => {
      const patchData = { isActive: false };

      service.patch<any>('/products/1', patchData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/products/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patchData);
      req.flush({});
    });
  });

  describe('delete', () => {
    it('should make DELETE request', () => {
      service.delete<any>('/users/1').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('upload', () => {
    it('should upload file with FormData', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      service.upload<any>('/upload', file).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ url: 'https://example.com/file.txt' });
    });

    it('should include additional data in FormData', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const additionalData = { folder: 'images', description: 'Test file' };

      service.upload<any>('/upload', file, additionalData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/upload`);
      const body = req.request.body as FormData;
      expect(body.get('folder')).toBe('images');
      expect(body.get('description')).toBe('Test file');
      req.flush({});
    });
  });
});
