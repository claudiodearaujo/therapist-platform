// apps/backend/src/config/database.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';
import { postgresConnectionOptions } from './database-tls';

// Create PostgreSQL adapter
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(postgresConnectionOptions(connectionString));

// Create Prisma client with Prisma 7 adapter configuration
export const prisma = new PrismaClient({
  adapter,
  log: [], // SQL errors may contain sensitive values; handlers emit stable event codes.

});

// Connect to database
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:');
    process.exit(1);
  }
}

// Disconnect from database
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📤 Database disconnected');
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

export default prisma;
