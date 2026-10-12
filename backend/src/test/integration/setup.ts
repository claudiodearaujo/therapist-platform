/**
 * Integration Test Setup
 * 
 * These tests run against a real database (test database).
 * Make sure to have a TEST_DATABASE_URL environment variable set.
 */

import { randomUUID } from 'node:crypto';
import { PrismaClient, ProductType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Create adapter for test database
const testConnectionString = process.env.TEST_DATABASE_URL;
if (process.env.NODE_ENV !== 'test' || !testConnectionString) {
  throw new Error('Integration tests require NODE_ENV=test and explicit TEST_DATABASE_URL');
}
const testUrl = new URL(testConnectionString);
if (!['localhost', '127.0.0.1', '[::1]'].includes(testUrl.hostname) || !testUrl.pathname.endsWith('_test')) {
  throw new Error('Integration tests require a disposable local database ending in _test');
}
const testAdapter = new PrismaPg({ connectionString: testConnectionString });

// Use a separate Prisma instance for integration tests
export const testPrisma = new PrismaClient({
  adapter: testAdapter,
});

/**
 * Clean all tables in the test database
 */
export async function cleanDatabase() {
  const tablenames = await testPrisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
}

/**
 * Create test data fixtures
 */
async function fixtureTenantId(): Promise<string> {
  const tenant = await testPrisma.tenant.upsert({
    where: { slug: 'integration-test' },
    create: { name: 'Synthetic integration tenant', slug: 'integration-test' },
    update: {},
  });
  return tenant.id;
}

export async function createTestUser(data: {
  email?: string;
  fullName?: string;
  role?: 'CLIENT' | 'ADMIN';
  password?: string;
}) {
  return testPrisma.user.create({
    data: {
      email: data.email || `test-${randomUUID()}@test.com`,
      fullName: data.fullName || 'Test User',
      role: data.role || 'CLIENT',
      passwordHash: data.password || 'hashedpassword123',
    },
  });
}

export async function createTestCategory(data: {
  name?: string;
  slug?: string;
}) {
  return testPrisma.productCategory.create({
    data: {
      tenantId: await fixtureTenantId(),
      name: data.name || `Test Category ${randomUUID()}`,
      slug: data.slug || `test-category-${randomUUID()}`,
      isActive: true,
    },
  });
}

export async function createTestProduct(data: {
  name?: string;
  categoryId: string;
  price?: number;
}) {
  return testPrisma.product.create({
    data: {
      tenantId: await fixtureTenantId(),
      name: data.name || `Test Product ${randomUUID()}`,
      slug: `test-product-${randomUUID()}`,
      shortDescription: 'Test product description',
      price: data.price || 100,
      categoryId: data.categoryId,
      productType: ProductType.QUESTION,
      isActive: true,
    },
  });
}

export async function createTestCard(data: {
  number?: number;
  name?: string;
}) {
  return testPrisma.ciganoCard.create({
    data: {
      tenantId: await fixtureTenantId(),
      number: data.number || Math.floor(Math.random() * 1000),
      name: data.name || `Test Card ${randomUUID()}`,
      keywords: ['test', 'card'],
      imageUrl: 'https://example.com/card.jpg',
    },
  });
}

export async function createTestOrder(data: {
  clientId: string;
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
}) {
  const total = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return testPrisma.order.create({
    data: {
      tenantId: await fixtureTenantId(),
      orderNumber: `ORD-TEST-${randomUUID()}`,
      clientId: data.clientId,
      subtotal: total,
      total,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productType: ProductType.QUESTION,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      items: true,
    },
  });
}

/**
 * Disconnect test database after all tests
 */
export async function disconnectTestDatabase() {
  await testPrisma.$disconnect();
}
