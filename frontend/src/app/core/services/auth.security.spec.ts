import { vi, type Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

describe('Auth security contract', () => {
  let api: Mocked<ApiService>;
  let storage: Mocked<StorageService>;
  let service: AuthService;
  const data = { user: { id: 'synthetic' }, membership: { role: 'OWNER' }, accessToken: 'access' } as any;
  beforeEach(() => {
    api = { 'post': vi.fn(), 'get': vi.fn() } as unknown as Mocked<ApiService>;
    storage = { 'get': vi.fn(), 'set': vi.fn(), 'remove': vi.fn() } as unknown as Mocked<StorageService>;
    TestBed.configureTestingModule({ providers: [AuthService,
      { provide: ApiService, useValue: api }, { provide: StorageService, useValue: storage },
      { provide: Router, useValue: { navigate: vi.fn() } },
    ] });
    service = TestBed.inject(AuthService);
  });
  it('keeps bearer only in memory and removes legacy stored credentials', () => {
    service.establishSession(data);
    expect(service.getAccessToken()).toBe('access');
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).toHaveBeenCalledWith('accessToken');
  });
  it('refreshes the profile without persisting personal data', () => {
    api.get.mockReturnValue(of({ data: data.user }));
    service.refreshProfile();
    expect(service.currentUser()).toEqual(data.user);
    expect(storage.set).not.toHaveBeenCalled();
  });
  it('uses canonical refresh endpoint and coalesces concurrent refreshes', async () => {
    api.post.mockReturnValue(of({ success: true, data }));
    const first = firstValueFrom(service.refreshToken());
    const second = firstValueFrom(service.refreshToken());
    await Promise.all([first, second]);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/auth/refresh', {});
    expect(service.isAdmin()).toBe(true);
  });
});
