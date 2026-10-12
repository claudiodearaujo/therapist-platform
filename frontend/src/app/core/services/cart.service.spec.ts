import { vi, type Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CartService, CartItem } from './cart.service';
import { StorageService } from './storage.service';
import { Product } from '../models/product.model';

describe('CartService', () => {
  let service: CartService;
  let storageServiceSpy: Mocked<StorageService>;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Leitura Cigana',
    slug: 'leitura-cigana',
    price: 150,
    productType: 'QUESTION',
    serviceKind: 'ASYNC_SERVICE',
    capabilities: { intake: { enabled: true, maxQuestions: 1 } },
    isActive: true,
    isFeatured: false,
    requiresScheduling: false,
    validityDays: 30,
    galleryUrls: [],
    categoryId: 'cat-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct2: Product = {
    id: 'prod-2',
    name: 'Consulta Espiritual',
    slug: 'consulta-espiritual',
    price: 200,
    productType: 'QUESTION',
    serviceKind: 'ASYNC_SERVICE',
    capabilities: { intake: { enabled: true, maxQuestions: 1 } },
    isActive: true,
    isFeatured: false,
    requiresScheduling: false,
    validityDays: 30,
    galleryUrls: [],
    categoryId: 'cat-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    storageServiceSpy = { 'get': vi.fn(), 'set': vi.fn(), 'remove': vi.fn() } as unknown as Mocked<StorageService>;
    storageServiceSpy.get.mockReturnValue(null);

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: StorageService, useValue: storageServiceSpy },
      ],
    });

    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      service.addItem(mockProduct, 1);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].product.id).toBe('prod-1');
      expect(service.items()[0].quantity).toBe(1);
      expect(storageServiceSpy.set).toHaveBeenCalledWith('cart', expect.any(Array));
    });

    it('should increase quantity if item already exists', () => {
      service.addItem(mockProduct, 1);
      service.addItem(mockProduct, 2);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].quantity).toBe(3);
    });

    it('should add item with questions', () => {
      const questions = ['Pergunta 1', 'Pergunta 2'];
      service.addItem(mockProduct, 1, questions);

      expect(service.items()[0].questions).toEqual(questions);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      service.addItem(mockProduct, 1);
      service.updateQuantity('prod-1', 5);

      expect(service.items()[0].quantity).toBe(5);
    });

    it('should remove item if quantity is less than 1', () => {
      service.addItem(mockProduct, 1);
      service.updateQuantity('prod-1', 0);

      expect(service.items().length).toBe(0);
    });
  });

  describe('updateQuestions', () => {
    it('should update item questions', () => {
      service.addItem(mockProduct, 1, ['Pergunta inicial']);
      service.updateQuestions('prod-1', ['Nova pergunta 1', 'Nova pergunta 2']);

      expect(service.items()[0].questions).toEqual(['Nova pergunta 1', 'Nova pergunta 2']);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      service.addItem(mockProduct, 1);
      service.addItem(mockProduct2, 1);
      service.removeItem('prod-1');

      expect(service.items().length).toBe(1);
      expect(service.items()[0].product.id).toBe('prod-2');
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      service.addItem(mockProduct, 1);
      service.addItem(mockProduct2, 1);
      service.clearCart();

      expect(service.items().length).toBe(0);
      expect(storageServiceSpy.remove).toHaveBeenCalledWith('cart');
    });
  });

  describe('computed signals', () => {
    it('should calculate itemCount correctly', () => {
      service.addItem(mockProduct, 2);
      service.addItem(mockProduct2, 3);

      expect(service.itemCount()).toBe(5);
    });

    it('should calculate subtotal correctly', () => {
      service.addItem(mockProduct, 2); // 150 * 2 = 300
      service.addItem(mockProduct2, 1); // 200 * 1 = 200

      expect(service.subtotal()).toBe(500);
    });

    it('should calculate total correctly', () => {
      service.addItem(mockProduct, 1);
      service.addItem(mockProduct2, 1);

      expect(service.total()).toBe(350);
    });
  });

  describe('loadCart', () => {
    it('should normalize a legacy stored product into service domain fields', () => {
      const legacyProduct = {
        ...mockProduct,
        serviceKind: undefined,
        capabilities: undefined,
        productType: 'QUESTION' as const,
        numQuestions: 2,
      } as unknown as Product;

      storageServiceSpy.get.mockReturnValue([
        { product: legacyProduct, quantity: 2 },
      ]);

      (service as any).loadCart();

      expect(service.items()[0].product.serviceKind).toBe('ASYNC_SERVICE');
      expect(service.items()[0].product.capabilities.intake?.enabled).toBe(true);
      expect(service.items()[0].product.capabilities.intake?.maxQuestions).toBe(2);
    });
  });
});
