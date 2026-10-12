import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestimonialsService, Testimonial, CreateTestimonialDTO } from './testimonials.service';

describe('TestimonialsService', () => {
  let service: TestimonialsService;
  let httpMock: HttpTestingController;

  const mockTestimonial: Testimonial = {
    id: '1',
    clientName: 'Maria Silva',
    content: 'Atendimento maravilhoso!',
    rating: 5,
    isApproved: true,
    isFeatured: false,
    displayOrder: 1,
    createdAt: new Date(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestimonialsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TestimonialsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findPublic', () => {
    it('should return public testimonials', () => {
      const mockResponse = { data: [mockTestimonial], success: true };

      service.findPublic().subscribe(response => {
        expect(response.data).toEqual([mockTestimonial]);
      });

      const req = httpMock.expectOne('/api/testimonials');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return testimonials with limit', () => {
      const mockResponse = { data: [mockTestimonial], success: true };

      service.findPublic(5).subscribe(response => {
        expect(response.data).toEqual([mockTestimonial]);
      });

      const req = httpMock.expectOne(req => 
        req.url === '/api/testimonials' && 
        req.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('findFeatured', () => {
    it('should return featured testimonials', () => {
      const mockResponse = { data: [mockTestimonial], success: true };

      service.findFeatured().subscribe(response => {
        expect(response.data).toEqual([mockTestimonial]);
      });

      const req = httpMock.expectOne('/api/testimonials/featured');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should create new testimonial', () => {
      const createData: CreateTestimonialDTO = { content: 'Ótimo serviço!', rating: 5 };
      const mockResponse = { data: mockTestimonial, success: true };

      service.create(createData).subscribe(response => {
        expect(response.data).toEqual(mockTestimonial);
      });

      const req = httpMock.expectOne('/api/testimonials');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush(mockResponse);
    });
  });

  describe('findAll (admin)', () => {
    it('should return all testimonials', () => {
      const mockResponse = { data: [mockTestimonial], total: 1, page: 1, limit: 10 };

      service.findAll().subscribe(response => {
        expect(response.data).toEqual([mockTestimonial]);
      });

      const req = httpMock.expectOne('/api/admin/testimonials');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return testimonials with filters', () => {
      const mockResponse = { data: [mockTestimonial], total: 1, page: 1, limit: 10 };

      service.findAll({ isApproved: true, page: 1 }).subscribe(response => {
        expect(response.data).toEqual([mockTestimonial]);
      });

      const req = httpMock.expectOne(req => 
        req.url === '/api/admin/testimonials' && 
        req.params.get('isApproved') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getStats', () => {
    it('should return testimonials stats', () => {
      const mockStats = { total: 50, approved: 40, pending: 10, averageRating: 4.5 };
      const mockResponse = { data: mockStats, success: true };

      service.getStats().subscribe(response => {
        expect(response.data).toEqual(mockStats);
      });

      const req = httpMock.expectOne('/api/admin/testimonials/stats');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should update testimonial', () => {
      const mockResponse = { data: { ...mockTestimonial, isApproved: true }, success: true };

      service.update('1', { isApproved: true }).subscribe(response => {
        expect(response.data.isApproved).toBe(true);
      });

      const req = httpMock.expectOne('/api/admin/testimonials/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ isApproved: true });
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete testimonial', () => {
      const mockResponse = { message: 'Depoimento excluído' };

      service.delete('1').subscribe(response => {
        expect(response.message).toBe('Depoimento excluído');
      });

      const req = httpMock.expectOne('/api/admin/testimonials/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
