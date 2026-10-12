import { vi, type Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdminOrderListComponent } from './order-list.component';
import { OrdersService, Order } from '../../../../core/services/orders.service';
import { NotificationService } from '../../../../core/services/notification.service';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({ admin:{orders:{title:'Orders',subtitle:'Manage orders',statusPending:'Pending',statusPaid:'Paid',statusProcessing:'Processing',statusCompleted:'Completed',statusCancelled:'Cancelled',statusRefunded:'Refunded',cancelConfirm:'Are you sure?',confirmCancellation:'Confirm',yesCancel:'Yes',cancelledSuccess:'Cancelled',errorUpdatingStatus:'Error',notesSaved:'Saved',errorSaving:'Error'}}, common:{all:'All',no:'No'} });
  }
}

const mockOrder: Order = {
  id:'order-1',orderNumber:'ORD-001',clientId:'client-1',subtotal:100,discount:0,total:100,
  status:'PENDING',paymentStatus:'PENDING',createdAt:new Date('2026-01-01'),updatedAt:new Date('2026-01-01'),items:[]
};

describe('AdminOrderListComponent', () => {
  let component: AdminOrderListComponent;
  let fixture: ComponentFixture<AdminOrderListComponent>;
  let ordersServiceSpy: Mocked<OrdersService>;
  let notificationSpy: Mocked<NotificationService>;

  beforeEach(async () => {
    ordersServiceSpy={ 'findAll': vi.fn(), 'getStats': vi.fn(), 'updateStatus': vi.fn(), 'updateAdminNotes': vi.fn() } as unknown as Mocked<OrdersService>;
    notificationSpy={ 'success': vi.fn(), 'error': vi.fn() } as unknown as Mocked<NotificationService>;
    ordersServiceSpy.findAll.mockReturnValue(of({data:[mockOrder],meta:{total:1,page:1,limit:10,totalPages:1}}));
    ordersServiceSpy.getStats.mockReturnValue(of({data:{total:12,pending:3,completed:7,revenue:2500}}));

    await TestBed.configureTestingModule({
      imports:[AdminOrderListComponent,RouterTestingModule,NoopAnimationsModule,TranslateModule.forRoot({loader:{provide:TranslateLoader,useClass:FakeTranslateLoader}})],
      providers:[{provide:OrdersService,useValue:ordersServiceSpy},{provide:NotificationService,useValue:notificationSpy}]
    }).compileComponents();

    const translate=TestBed.inject(TranslateService); translate.setDefaultLang('en'); translate.use('en');
    fixture=TestBed.createComponent(AdminOrderListComponent); component=fixture.componentInstance; fixture.detectChanges();
  });

  it('should create',()=>expect(component).toBeTruthy());
  it('should load orders and aggregate stats on init',()=>{expect(ordersServiceSpy.findAll).toHaveBeenCalled();expect(ordersServiceSpy.getStats).toHaveBeenCalled();expect(component.stats().revenue).toBe(2500)});
  it('should map order statuses to semantic tones',()=>{expect(component.getStatusTone('PENDING')).toBe('warning');expect(component.getStatusTone('COMPLETED')).toBe('success');expect(component.getStatusTone('CANCELLED')).toBe('error')});
  it('should map payment statuses separately',()=>{expect(component.getPaymentStatusTone('SUCCEEDED')).toBe('success');expect(component.getPaymentStatusTone('FAILED')).toBe('error');expect(component.getPaymentStatusLabel('PENDING')).toBe('Pagamento pendente')});
  it('should handle load error',async ()=>{ordersServiceSpy.findAll.mockReturnValue(throwError(()=>new Error('HTTP')));component.loadOrders();await Promise.resolve();expect(component.orders()).toEqual([]);expect(component.loading()).toBe(false)});
  it('should open notes dialog',()=>{component.openNotesDialog(mockOrder);expect(component.notesDialogVisible()).toBe(true);expect(component.selectedOrder()).toEqual(mockOrder)});
});
