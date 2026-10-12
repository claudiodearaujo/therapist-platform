import { vi, type Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AdminAppointmentListComponent } from './appointment-list.component';
import { AppointmentsService, Appointment } from '../../../../core/services/appointments.service';
import { NotificationService } from '../../../../core/services/notification.service';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      admin: {
        appointments: {
          title: 'Appointments',
          subtitle: 'Manage appointments',
          upcoming: 'Upcoming',
          today: 'Today',
          completed: 'Completed',
          cancelled: 'Cancelled',
          statusScheduled: 'Scheduled',
          statusConfirmed: 'Confirmed',
          statusInProgress: 'In Progress',
          statusCompleted: 'Completed',
          statusCancelled: 'Cancelled',
          statusNoShow: 'No Show',
          searchClient: 'Search client...',
          client: 'Client',
          service: 'Service',
          dateTime: 'Date/Time',
          duration: 'Duration',
          cancelConfirm: 'Cancel this appointment?',
          confirmCancellation: 'Confirm Cancellation',
          yesCancel: 'Yes, cancel',
          cancelledSuccess: 'Appointment cancelled',
          errorUpdatingStatus: 'Error updating status',
        },
      },
      common: {
        all: 'All',
        no: 'No',
        status: 'Status',
        actions: 'Actions',
        search: 'Search',
      },
    });
  }
}

const today = new Date();

const mockAppointment: Appointment = {
  id: 'appt-1',
  scheduledDate: today,
  startTime: '09:00',
  endTime: '10:00',
  durationMinutes: 60,
  status: 'CONFIRMED',
  createdAt: today,
  updatedAt: today,
};

describe('AdminAppointmentListComponent', () => {
  let component: AdminAppointmentListComponent;
  let fixture: ComponentFixture<AdminAppointmentListComponent>;
  let appointmentsServiceSpy: Mocked<AppointmentsService>;
  let notificationSpy: Mocked<NotificationService>;

  beforeEach(async () => {
    appointmentsServiceSpy = { 'findAll': vi.fn(), 'updateStatus': vi.fn(), 'reschedule': vi.fn(), 'update': vi.fn() } as unknown as Mocked<AppointmentsService>;
    notificationSpy = { 'success': vi.fn(), 'error': vi.fn() } as unknown as Mocked<NotificationService>;

    appointmentsServiceSpy.findAll.mockReturnValue(
      of({ data: [mockAppointment], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } })
    );

    await TestBed.configureTestingModule({
      imports: [
        AdminAppointmentListComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        { provide: AppointmentsService, useValue: appointmentsServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAppointmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments on init', () => {
    expect(appointmentsServiceSpy.findAll).toHaveBeenCalled();
    expect(component.appointments().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should compute upcomingCount for CONFIRMED appointments', () => {
    expect(component.upcomingCount()).toBe(1);
  });

  it('should compute completedCount as 0', () => {
    expect(component.completedCount()).toBe(0);
  });

  it('should compute cancelledCount as 0', () => {
    expect(component.cancelledCount()).toBe(0);
  });

  it('should handle error when loading appointments', async () => {
    appointmentsServiceSpy.findAll.mockReturnValue(throwError(() => new Error('HTTP error')));
    component.loadAppointments();
    await Promise.resolve();
    expect(component.appointments()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  describe('statusOptions getter', () => {
    it('should return all status options', () => {
      const options = component.statusOptions;
      expect(options.length).toBe(7);
    });
  });

  it('should map appointment statuses to semantic tones', () => {
    expect(component.getStatusTone('CONFIRMED')).toBe('success');
    expect(component.getStatusTone('IN_PROGRESS')).toBe('brand');
    expect(component.getStatusTone('CANCELLED')).toBe('error');
    expect(component.getStatusTone('UNKNOWN')).toBe('neutral');
  });

  it('should open reschedule dialog', () => {
    component.openRescheduleDialog(mockAppointment);
    expect(component.rescheduleDialogVisible()).toBe(true);
    expect(component.selectedAppointment()).toEqual(mockAppointment);
  });

  it('should open notes dialog', () => {
    component.openNotesDialog(mockAppointment);
    expect(component.notesDialogVisible()).toBe(true);
  });
});
