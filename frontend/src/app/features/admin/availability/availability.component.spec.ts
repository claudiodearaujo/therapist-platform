import { vi, type Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AdminAvailabilityComponent } from './availability.component';
import { SettingsService, BusinessHour } from '../../../core/services/settings.service';
import { NotificationService } from '../../../core/services/notification.service';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      admin: {
        availability: {
          title: 'Availability',
          subtitle: 'Configure hours',
          save: 'Save',
          saveAll: 'Save All',
          weeklySchedule: 'Weekly Schedule',
          generalSettings: 'General Settings',
          slotDuration: 'Slot Duration (min)',
          bufferMinutes: 'Buffer (min)',
          advanceBookingDays: 'Advance Booking (days)',
          minNoticeHours: 'Min Notice (hours)',
          saved: 'Settings saved',
          errorSaving: 'Error saving',
          open: 'Open',
          closed: 'Closed',
          from: 'From',
          to: 'To',
          dayOff: 'Day Off',
          days: {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'Sunday',
          },
        },
      },
    });
  }
}

const mockBusinessHours: BusinessHour[] = [
  { day: 'monday', dayName: 'Monday', isOpen: true, start: '08:00', end: '17:00' },
  { day: 'tuesday', dayName: 'Tuesday', isOpen: true, start: '08:00', end: '17:00' },
  { day: 'wednesday', dayName: 'Wednesday', isOpen: true, start: '08:00', end: '17:00' },
  { day: 'thursday', dayName: 'Thursday', isOpen: true, start: '08:00', end: '17:00' },
  { day: 'friday', dayName: 'Friday', isOpen: true, start: '08:00', end: '17:00' },
  { day: 'saturday', dayName: 'Saturday', isOpen: false },
  { day: 'sunday', dayName: 'Sunday', isOpen: false },
];

describe('AdminAvailabilityComponent', () => {
  let component: AdminAvailabilityComponent;
  let fixture: ComponentFixture<AdminAvailabilityComponent>;
  let settingsServiceSpy: Mocked<SettingsService>;
  let notificationSpy: Mocked<NotificationService>;

  beforeEach(async () => {
    settingsServiceSpy = { 'getBusinessHours': vi.fn(), 'updateBusinessHours': vi.fn() } as unknown as Mocked<SettingsService>;
    notificationSpy = { 'success': vi.fn(), 'error': vi.fn() } as unknown as Mocked<NotificationService>;

    settingsServiceSpy.getBusinessHours.mockReturnValue(
      of({ data: mockBusinessHours })
    );

    await TestBed.configureTestingModule({
      imports: [
        AdminAvailabilityComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', () => {
    expect(settingsServiceSpy.getBusinessHours).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('should map business hours to weekday config', () => {
    const monday = component.scheduleSettings.weekdays.find(w => w.day === 'monday');
    expect(monday).toBeDefined();
    expect(monday!.enabled).toBe(true);
    expect(monday!.startTime).toBe('08:00');
    expect(monday!.endTime).toBe('17:00');
  });

  it('should set disabled days correctly', () => {
    const saturday = component.scheduleSettings.weekdays.find(w => w.day === 'saturday');
    expect(saturday!.enabled).toBe(false);
  });

  it('should use labelKey for day names', () => {
    const monday = component.scheduleSettings.weekdays.find(w => w.day === 'monday');
    expect(monday!.labelKey).toBe('admin.availability.days.monday');
  });

  it('should have 7 weekdays configured', () => {
    expect(component.scheduleSettings.weekdays.length).toBe(7);
  });

  it('should have default schedule settings', () => {
    expect(component.scheduleSettings.slotDuration).toBe(60);
    expect(component.scheduleSettings.bufferMinutes).toBe(15);
    expect(component.scheduleSettings.advanceBookingDays).toBe(30);
    expect(component.scheduleSettings.minNoticeHours).toBe(24);
  });

  it('should handle error when loading settings', async () => {
    settingsServiceSpy.getBusinessHours.mockReturnValue(throwError(() => new Error('HTTP error')));
    component.loadSettings();
    await Promise.resolve();
    expect(component.loading()).toBe(false);
  });

  it('should call updateBusinessHours on save', async () => {
    settingsServiceSpy.updateBusinessHours.mockReturnValue(
      of({ data: mockBusinessHours })
    );
    component.saveSettings();
    await Promise.resolve();
    expect(settingsServiceSpy.updateBusinessHours).toHaveBeenCalled();
    expect(notificationSpy.success).toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('should handle error when saving settings', async () => {
    settingsServiceSpy.updateBusinessHours.mockReturnValue(throwError(() => new Error('HTTP error')));
    component.saveSettings();
    await Promise.resolve();
    expect(notificationSpy.error).toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });
});
