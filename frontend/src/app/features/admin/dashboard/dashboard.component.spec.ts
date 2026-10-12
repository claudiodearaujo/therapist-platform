import { ChartModule } from 'primeng/chart';
import { ChartStubComponent } from '../../../../testing/chart.stub';
import { vi, type Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AdminDashboardComponent } from './dashboard.component';
import { DashboardService, DashboardStats, RecentOrder } from '../../../core/services/dashboard.service';
import { ReadingsService } from '../../../core/services/readings.service';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      admin: {
        dashboard: {
          title: 'Dashboard',
          subtitle: 'Overview',
          totalOrders: 'Total Orders',
          totalRevenue: 'Total Revenue',
          totalClients: 'Total Clients',
          pendingReadings: 'Pending Readings',
          upcomingAppointments: 'Upcoming Appointments',
          pendingTestimonials: 'Pending Testimonials',
          quickActions: 'Quick Actions',
          recentOrders: 'Recent Orders',
          viewAll: 'View All',
        },
        products: {
          typeQuestion: 'Questions',
          typeSession: 'Session',
          typeMonthly: 'Monthly',
          typeSpecial: 'Special',
        },
        readings: {
          statusWaiting: 'Waiting',
          statusInProgress: 'In Progress',
          noReadings: 'No pending readings',
        },
        orders: {
          noOrders: 'No orders',
        },
      },
      client: {
        orders: {
          statusPending: 'Pending',
          statusPaid: 'Paid',
          statusProcessing: 'Processing',
          statusCompleted: 'Completed',
        },
      },
    });
  }
}

const mockStats: DashboardStats = {
  totalOrders: 42,
  ordersGrowth: 10,
  totalRevenue: 5000,
  revenueGrowth: 5,
  totalUsers: 100,
  usersGrowth: 8,
  totalProducts: 10,
  pendingReadings: 3,
  upcomingAppointments: 5,
  pendingTestimonials: 2,
};

const mockRecentOrders: RecentOrder[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-001',
    total: 200,
    status: 'PAID',
    paymentStatus: 'PAID',
    createdAt: new Date('2026-01-01'),
    user: { id: 'user-1', fullName: 'John Doe', email: 'john@test.com' },
    items: [{ product: { id: 'prod-1', name: 'Product 1' }, quantity: 2 }],
  },
];

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let dashboardServiceSpy: Mocked<DashboardService>;
  let readingsServiceSpy: Mocked<ReadingsService>;

  beforeEach(async () => {
    dashboardServiceSpy = { 'getStats': vi.fn(), 'getRecentOrders': vi.fn(), 'getSalesChart': vi.fn() } as unknown as Mocked<DashboardService>;
    readingsServiceSpy = { 'findAll': vi.fn() } as unknown as Mocked<ReadingsService>;

    dashboardServiceSpy.getStats.mockReturnValue(of({ data: mockStats }));
    dashboardServiceSpy.getRecentOrders.mockReturnValue(of({ data: mockRecentOrders }));
    dashboardServiceSpy.getSalesChart.mockReturnValue(
      of({ data: { labels: ['Jan'], datasets: [{ label: 'Revenue', data: [1000] }] } })
    );
    readingsServiceSpy.findAll.mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 5, totalPages: 0 } }));

    TestBed.overrideComponent(AdminDashboardComponent, { remove: { imports: [ChartModule] }, add: { imports: [ChartStubComponent] } });
    await TestBed.configureTestingModule({
      imports: [
        AdminDashboardComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: ReadingsService, useValue: readingsServiceSpy },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');
    translate.use('en');

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    expect(dashboardServiceSpy.getStats).toHaveBeenCalled();
    expect(dashboardServiceSpy.getRecentOrders).toHaveBeenCalledWith(5);
    expect(readingsServiceSpy.findAll).toHaveBeenCalledWith({ status: 'PENDING', limit: 5 });
  });

  it('should set stats from response', () => {
    expect(component.stats()).toEqual(mockStats);
  });

  it('should set recentOrders from response', () => {
    expect(component.recentOrders().length).toBe(1);
  });

  it('should set loading to false after loading', () => {
    expect(component.loading()).toBe(false);
  });

  it('should handle stats error with default values', async () => {
    dashboardServiceSpy.getStats.mockReturnValue(throwError(() => new Error('HTTP error')));
    component.loadDashboard();
    await Promise.resolve();
    expect(component.stats()!.totalOrders).toBe(0);
    expect(component.stats()!.totalRevenue).toBe(0);
  });

  it('should return correct status label for PENDING', () => {
    expect(component.getStatusLabel('PENDING')).toBe('Pending');
  });

  it('should return correct status label for PAID', () => {
    expect(component.getStatusLabel('PAID')).toBe('Paid');
  });

  it('should return original value for unknown status', () => {
    expect(component.getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should return semantic status tone for COMPLETED', () => {
    expect(component.getStatusTone('COMPLETED')).toBe('success');
  });

  it('should return semantic status tone for PENDING', () => {
    expect(component.getStatusTone('PENDING')).toBe('warning');
  });

  it('should return neutral tone for unknown status', () => {
    expect(component.getStatusTone('UNKNOWN')).toBe('neutral');
  });

  it('should format date correctly', () => {
    const date = '2026-01-15T10:30:00';
    const formatted = component.formatDate(date);
    expect(formatted).toContain('15');
  });

  it('should initialize chart data with design system colors', () => {
    expect(component.revenueChartData).toBeDefined();
    expect(component.revenueChartData.datasets[0].borderColor).toBe('#477762');
    expect(component.revenueChartOptions).toBeDefined();
  });
});
