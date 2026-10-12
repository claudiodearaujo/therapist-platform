import { vi, type Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageServiceSpy: Mocked<StorageService>;
  let routerSpy: Mocked<Router>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'CLIENT' as const,
    preferredLanguage: 'pt-BR',
    notificationEmail: true,
    notificationWhatsapp: false,
    createdAt: '2026-09-24T00:00:00Z',
    updatedAt: '2026-09-24T00:00:00Z',
  };

  const mockAuthResponse = {
    success: true,
    message: 'Login successful',
    data: {
      user: mockUser,
      accessToken: 'mock-access-token',
    },
  };

  beforeEach(() => {
    storageServiceSpy = { 'get': vi.fn(), 'set': vi.fn(), 'remove': vi.fn() } as unknown as Mocked<StorageService>;
    routerSpy = { 'navigate': vi.fn() } as unknown as Mocked<Router>;

    // Return null initially for stored data
    storageServiceSpy.get.mockReturnValue(null);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user and keep authentication only in memory', () => {
      const loginData = { email: 'test@example.com', password: 'Password123!' };

      service.login(loginData).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.user.email).toBe(loginData.email);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(mockAuthResponse);

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.getAccessToken()).toBe('mock-access-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(storageServiceSpy.set).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register user and keep authentication only in memory', () => {
      const registerData = {
        email: 'new@example.com',
        password: 'Password123!',
        fullName: 'New User',
        phone: '11999999999',
      };

      service.register(registerData).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.getAccessToken()).toBe('mock-access-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(storageServiceSpy.set).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request', () => {
      const email = 'test@example.com';

      service.forgotPassword(email).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email });
      req.flush({ success: true, message: 'Email sent' });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with token', () => {
      const token = 'reset-token';
      const password = 'NewPassword123!';

      service.resetPassword(token, password).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token, password });
      req.flush({ success: true, message: 'Password reset' });
    });
  });

  describe('logout', () => {
    it('should clear stored data and navigate', () => {
      service.logout();

      // Flush the async logout request
      const req = httpMock.expectOne('/api/auth/logout');
      req.flush({});

      expect(storageServiceSpy.remove).toHaveBeenCalledWith('user');
      expect(storageServiceSpy.remove).toHaveBeenCalledWith('accessToken');
      expect(routerSpy.navigate).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return null when no token stored', () => {
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return false when no user', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('loadStoredUser', () => {
    it('should start without authenticated user when no user in storage', () => {
      storageServiceSpy.get.mockReturnValue(null);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });
});
