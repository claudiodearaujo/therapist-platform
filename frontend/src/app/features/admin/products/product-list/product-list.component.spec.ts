import { vi, type Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AdminProductListComponent } from './product-list.component';
import { ProductsService, Product } from '../../../../core/services/products.service';
import { CategoriesService, ProductCategory } from '../../../../core/services/categories.service';
import { NotificationService } from '../../../../core/services/notification.service';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      admin: {
        products: {
          title: 'Products',
          subtitle: 'Manage products',
          newProduct: 'New Product',
          allCategories: 'All Categories',
          allStatus: 'All Types',
          typeQuestion: 'Questions',
          typeSession: 'Session',
          typeMonthly: 'Monthly',
          typeSpecial: 'Special',
          deleteConfirm: 'Delete this product?',
          deleteProduct: 'Delete Product',
          yesDelete: 'Yes, delete',
          deletedSuccess: 'Product deleted',
          errorDeleting: 'Error deleting product',
          active: 'Active',
          inactive: 'Inactive',
        },
      },
      common: {
        all: 'All',
        actions: 'Actions',
        search: 'Search',
        yes: 'Yes',
        no: 'No',
      },
    });
  }
}

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Test Product',
  slug: 'test-product',
  productType: 'QUESTION',
  serviceKind: 'ASYNC_SERVICE',
  capabilities: { intake: { enabled: true, maxQuestions: 1 } },
  price: 150,
  isActive: true,
  isFeatured: false,
  requiresScheduling: false,
  validityDays: 30,
  galleryUrls: [],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const mockCategory: ProductCategory = {
  id: 'cat-1',
  name: 'Amor',
  slug: 'amor',
  displayOrder: 1,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('AdminProductListComponent', () => {
  let component: AdminProductListComponent;
  let fixture: ComponentFixture<AdminProductListComponent>;
  let productsServiceSpy: Mocked<ProductsService>;
  let categoriesServiceSpy: Mocked<CategoriesService>;
  let notificationSpy: Mocked<NotificationService>;

  beforeEach(async () => {
    productsServiceSpy = { 'findAllAdmin': vi.fn(), 'delete': vi.fn() } as unknown as Mocked<ProductsService>;
    categoriesServiceSpy = { 'findAllAdmin': vi.fn() } as unknown as Mocked<CategoriesService>;
    notificationSpy = { 'success': vi.fn(), 'error': vi.fn() } as unknown as Mocked<NotificationService>;

    productsServiceSpy.findAllAdmin.mockReturnValue(
      of({ data: [mockProduct], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } })
    );
    categoriesServiceSpy.findAllAdmin.mockReturnValue(
      of({ data: [mockCategory] })
    );

    await TestBed.configureTestingModule({
      imports: [
        AdminProductListComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        { provide: ProductsService, useValue: productsServiceSpy },
        { provide: CategoriesService, useValue: categoriesServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(productsServiceSpy.findAllAdmin).toHaveBeenCalled();
    expect(component.products().length).toBe(1);
    expect(component.products()[0].id).toBe('prod-1');
  });

  it('should load categories on init', () => {
    expect(categoriesServiceSpy.findAllAdmin).toHaveBeenCalled();
  });

  it('should set totalRecords from response', () => {
    expect(component.totalRecords()).toBe(1);
  });

  it('should set loading to false after loading', () => {
    expect(component.loading()).toBe(false);
  });

  it('should return service kind options', () => {
    const options = component.serviceKindOptions;
    expect(options.length).toBe(6);
    expect(options[0].value).toBeNull();
    expect(options[1].value).toBe('SERVICE');
  });

  it('should handle error when loading products', async () => {
    productsServiceSpy.findAllAdmin.mockReturnValue(throwError(() => new Error('HTTP error')));
    component.loadProducts();
    await Promise.resolve();
    expect(component.products()).toEqual([]);
    expect(component.loading()).toBe(false);
  });
});
