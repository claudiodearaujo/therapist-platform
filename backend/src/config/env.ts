// apps/backend/src/config/env.ts

import dotenv from 'dotenv';
import path from 'path';
import { isIP } from 'net';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  TRUST_PROXY_CIDRS: (process.env.TRUST_PROXY_CIDRS || '').split(',').map(v => v.trim()).filter(Boolean),
  TENANT_BASE_DOMAIN: process.env.TENANT_BASE_DOMAIN || '',
  ENABLE_API_DOCS: process.env.ENABLE_API_DOCS === 'true',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  SESSION_TTL_DAYS: 7,

  // Supabase
  SUPABASE_STORAGE_INIT: process.env.SUPABASE_STORAGE_INIT === 'true',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_PRIVATE_STORAGE_BUCKET: process.env.SUPABASE_PRIVATE_STORAGE_BUCKET || 'therapist-private',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'therapist-platform',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // SaaS billing (tenant subscription)
  SAAS_BILLING_ENABLED: process.env.SAAS_BILLING_ENABLED === 'true',
  SAAS_PROFESSIONAL_PRICE_ID: process.env.SAAS_PROFESSIONAL_PRICE_ID || '',
  SAAS_PROFESSIONAL_MONTHLY_PRICE_CENTS: process.env.SAAS_PROFESSIONAL_MONTHLY_PRICE_CENTS
    ? parseInt(process.env.SAAS_PROFESSIONAL_MONTHLY_PRICE_CENTS, 10)
    : null,
  SAAS_STUDIO_PRICE_ID: process.env.SAAS_STUDIO_PRICE_ID || '',
  SAAS_STUDIO_MONTHLY_PRICE_CENTS: process.env.SAAS_STUDIO_MONTHLY_PRICE_CENTS
    ? parseInt(process.env.SAAS_STUDIO_MONTHLY_PRICE_CENTS, 10)
    : null,
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Therapist Platform',
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'contato@example.com',
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'contato@example.com',
  
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
  CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean),
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  
  // WhatsApp (Evolution API)
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || '',
  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY || '',
  WHATSAPP_INSTANCE: process.env.WHATSAPP_INSTANCE || '',
  
  // Sentry (optional — error monitoring)
  SENTRY_DSN: process.env.SENTRY_DSN || '',

  // Privacy / audit
  AUDIT_IP_HASH_SALT: process.env.AUDIT_IP_HASH_SALT || '',

  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate required environment variables
// Critical secrets must ALWAYS be set (development, test, and production)
const criticalSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingSecrets = criticalSecrets.filter((key) => !process.env[key]);

if (missingSecrets.length > 0) {
  throw new Error(
    `CRITICAL: Missing required secrets: ${missingSecrets.join(', ')}. ` +
    `These must be set in all environments for security. ` +
    `Generate strong secrets using: openssl rand -base64 32`
  );
}

for (const cidr of env.TRUST_PROXY_CIDRS) {
  const [ip, bits, extra] = cidr.split('/');
  const version = isIP(ip);
  if (!version || extra || (bits !== undefined && (!/^\d+$/.test(bits) || +bits < 0 || +bits > (version === 4 ? 32 : 128)))) {
    throw new Error('Invalid TRUST_PROXY_CIDRS; use explicit IPs/CIDRs');
  }
}
if (env.isProduction && (env.JWT_SECRET.length < 32 || env.JWT_REFRESH_SECRET.length < 32 || env.JWT_SECRET === env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT secrets must be distinct and at least 32 characters in production');
}

// Validate additional required variables in production
if (env.isProduction) {
  const required = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'FRONTEND_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (env.SAAS_BILLING_ENABLED) {
    const billingRequired = [
      'SAAS_PROFESSIONAL_PRICE_ID',
      'SAAS_STUDIO_PRICE_ID',
    ];
    const missingBilling = billingRequired.filter((key) => !process.env[key]);
    if (missingBilling.length > 0) {
      throw new Error(
        `SaaS billing is enabled but missing configuration: ${missingBilling.join(', ')}`
      );
    }
  }
}

export function getAllowedFrontendOrigins(): string[] {
  const origins = new Set<string>();
  const addOrigin = (value: string) => {
    if (!value) return;
    origins.add(new URL(value).origin);
  };

  addOrigin(env.FRONTEND_URL);
  env.CORS_ALLOWED_ORIGINS.forEach(addOrigin);

  if (env.isDevelopment) {
    addOrigin('http://localhost:4200');
    addOrigin('http://127.0.0.1:4200');
  }

  return [...origins];
}

export default env;
