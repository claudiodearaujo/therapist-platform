import { vi, type Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { InAppNotificationsService } from '../../../core/services/inapp-notifications.service';
import { signal } from '@angular/core';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceSpy: Mocked<AuthService>;
  let cartServiceSpy: Mocked<CartService>;

  beforeEach(async () => {
    // Create signals for mocking
    const isAuthenticatedSignal = signal(false);
    const isAdminSignal = signal(false);
    const currentUserSignal = signal(null);
    const cartItemCountSignal = signal(0);

    authServiceSpy = { 'logout': vi.fn(), isAuthenticated: isAuthenticatedSignal, isAdmin: isAdminSignal, currentUser: currentUserSignal } as unknown as Mocked<AuthService>;

    cartServiceSpy = { itemCount: cartItemCountSignal } as unknown as Mocked<CartService>;

    const notificationsSpy = { 'list': vi.fn(), 'markRead': vi.fn(), 'markAllRead': vi.fn(), 'delete': vi.fn(), notifications: signal([]), unreadCount: signal(0) };
    notificationsSpy.list.mockReturnValue(of({ success: true, notifications: [], unreadCount: 0 }));

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: InAppNotificationsService, useValue: notificationsSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('menu toggle', () => {
    it('should toggle menu state', () => {
      expect(component.isMenuOpen()).toBe(false);
      
      component.toggleMenu();
      expect(component.isMenuOpen()).toBe(true);
      
      component.toggleMenu();
      expect(component.isMenuOpen()).toBe(false);
    });

    it('should close menu', () => {
      component.isMenuOpen.set(true);
      component.closeMenu();
      expect(component.isMenuOpen()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call authService logout and close menu', () => {
      component.isMenuOpen.set(true);
      
      component.logout();
      
      expect(authServiceSpy.logout).toHaveBeenCalled();
      expect(component.isMenuOpen()).toBe(false);
    });
  });

  describe('computed properties', () => {
    it('should reflect authentication state', () => {
      expect(component.isAuthenticated()).toBe(false);
    });

    it('should reflect admin state', () => {
      expect(component.isAdmin()).toBe(false);
    });

    it('should reflect cart item count', () => {
      expect(component.cartItemCount()).toBe(0);
    });
  });
});
