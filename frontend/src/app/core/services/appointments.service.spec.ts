import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppointmentsService, Appointment, TimeSlot } from './appointments.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let httpMock: HttpTestingController;

  const mockAppointment: Appointment = {
    id: '1',
    scheduledDate: new Date(),
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    status: 'SCHEDULED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTimeSlot: TimeSlot = {
    startTime: '14:00',
    endTime: '15:00',
    available: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AppointmentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAvailableSlots', () => {
    it('should return available slots for date', () => {
      const date = new Date('2024-02-15');
      const mockResponse = { data: [mockTimeSlot], success: true };

      service.getAvailableSlots(date).subscribe(response => {
        expect(response.data).toEqual([mockTimeSlot]);
        expect(response.data[0].available).toBe(true);
      });

      const req = httpMock.expectOne(req =>
        req.url === '/api/appointments/available-slots' &&
        req.params.get('date') === date.toISOString()
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getMyAppointments', () => {
    it('should return client appointments', () => {
      const mockResponse = { data: [mockAppointment], success: true };

      service.getMyAppointments().subscribe(response => {
        expect(response.data).toEqual([mockAppointment]);
      });

      const req = httpMock.expectOne('/api/appointments');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('cancel', () => {
    it('should cancel appointment', () => {
      const mockResponse = { data: { ...mockAppointment, status: 'CANCELLED' }, success: true };

      service.cancel('1', 'Compromisso pessoal').subscribe(response => {
        expect(response.data.status).toBe('CANCELLED');
      });

      const req = httpMock.expectOne('/api/appointments/1/cancel');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reason: 'Compromisso pessoal' });
      req.flush(mockResponse);
    });

    it('should cancel appointment without reason', () => {
      const mockResponse = { data: { ...mockAppointment, status: 'CANCELLED' }, success: true };

      service.cancel('1').subscribe(response => {
        expect(response.data.status).toBe('CANCELLED');
      });

      const req = httpMock.expectOne('/api/appointments/1/cancel');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reason: undefined });
      req.flush(mockResponse);
    });
  });

  describe('findAll (admin)', () => {
    it('should return all appointments', () => {
      const mockResponse = { data: [mockAppointment], total: 1, page: 1, limit: 10 };

      service.findAll().subscribe(response => {
        expect(response.data).toEqual([mockAppointment]);
      });

      const req = httpMock.expectOne('/api/admin/appointments');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return appointments with filters', () => {
      const mockResponse = { data: [mockAppointment], total: 1, page: 1, limit: 10 };

      service.findAll({ status: 'SCHEDULED' }).subscribe(response => {
        expect(response.data).toEqual([mockAppointment]);
      });

      const req = httpMock.expectOne(req =>
        req.url === '/api/admin/appointments' &&
        req.params.get('status') === 'SCHEDULED'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
