import { ChartModule } from 'primeng/chart';
import { ChartStubComponent } from '../../../../testing/chart.stub';
import { vi, type Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AdminReportsComponent } from './reports.component';
import { DashboardService, DashboardStats, TopProduct } from '../../../core/services/dashboard.service';
import { NotificationService } from '../../../core/services/notification.service';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      admin: {
        reports: {
          title: 'Reports',
          subtitle: 'Sales analysis',
          period: 'Period',
          week: 'Week',
          month: 'Month',
          year: 'Year',
          totalOrders: 'Total Orders',
          revenue: 'Revenue',
          totalUsers: 'Total Users',
          totalProducts: 'Total Products',
          salesChart: 'Sales Chart',
          topProducts: 'Top Products',
          product: 'Product',
          price: 'Price',
          sold: 'Sold',
          productRevenue: 'Revenue',
          errorLoading: 'Error loading',
          growth: 'growth',
          active: 'active',
          noChartData: 'No chart data',
          noProducts: 'No products',
        },
        dashboard: {
          totalOrders: 'Total Orders',
          totalRevenue: 'Total Revenue',
          totalClients: 'Total Clients',
        },
        products: {
          typeQuestion: 'Questions',
          typeSession: 'Session',
          typeMonthly: 'Monthly',
          typeSpecial: 'Special',
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

const mockTopProducts: TopProduct[] = [
  { id: '1', name: 'Product 1', price: 100, totalSold: 10 },
  { id: '2', name: 'Product 2', price: 200, totalSold: 5 },
];

describe('AdminReportsComponent', () => {
  let component: AdminReportsComponent;
  let fixture: ComponentFixture<AdminReportsComponent>;
  let dashboardServiceSpy: Mocked<DashboardService>;
  let notificationSpy: Mocked<NotificationService>;

  beforeEach(async () => {
    dashboardServiceSpy = { 'getStats': vi.fn(), 'getSalesChart': vi.fn(), 'getTopProducts': vi.fn() } as unknown as Mocked<DashboardService>;
    notificationSpy = { 'success': vi.fn(), 'error': vi.fn() } as unknown as Mocked<NotificationService>;

    dashboardServiceSpy.getStats.mockReturnValue(
      of({ data: mockStats })
    );
    dashboardServiceSpy.getSalesChart.mockReturnValue(
      of({ data: { labels: ['Jan', 'Feb'], datasets: [{ label: 'Sales', data: [100, 200] }] } })
    );
    dashboardServiceSpy.getTopProducts.mockReturnValue(
      of({ data: mockTopProducts })
    );

    TestBed.overrideComponent(AdminReportsComponent, { remove: { imports: [ChartModule] }, add: { imports: [ChartStubComponent] } });
    await TestBed.configureTestingModule({
      imports: [
        AdminReportsComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats on init', () => {
    expect(dashboardServiceSpy.getStats).toHaveBeenCalled();
    expect(component.stats()).toEqual(mockStats);
    expect(component.loading()).toBe(false);
  });

  it('should load sales chart on init', () => {
    expect(dashboardServiceSpy.getSalesChart).toHaveBeenCalledWith('month');
    expect(component.salesChartData()).toBeDefined();
    expect(component.salesChartData()!.labels).toEqual(['Jan', 'Feb']);
  });

  it('should load top products on init', () => {
    expect(dashboardServiceSpy.getTopProducts).toHaveBeenCalled();
    expect(component.topProducts().length).toBe(2);
  });

  it('should default period to month', () => {
    expect(component.period()).toBe('month');
  });

  it('should return translated period options', () => {
    const options = component.periodOptions;
    expect(options.length).toBe(3);
    expect(options[0].value).toBe('week');
    expect(options[1].value).toBe('month');
    expect(options[2].value).toBe('year');
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(1234.56);
    expect(formatted).toContain('1.234');
  });

  it('should reload sales chart when period changes', () => {
    dashboardServiceSpy.getSalesChart.mockClear();
    component.period.set('week');
    component.onPeriodChange();
    expect(dashboardServiceSpy.getSalesChart).toHaveBeenCalledWith('week');
  });

  it('should handle error when loading stats', async () => {
    dashboardServiceSpy.getStats.mockReturnValue(throwError(() => new Error('HTTP error')));
    component.loadReports();
    await Promise.resolve();
    expect(component.stats()!.totalOrders).toBe(0);
    expect(component.loading()).toBe(false);
  });

  it('should handle error when loading top products', async () => {
    dashboardServiceSpy.getTopProducts.mockReturnValue(throwError(() => new Error('HTTP error')));
    component.loadTopProducts();
    await Promise.resolve();
    expect(component.topProducts()).toEqual([]);
  });
});
