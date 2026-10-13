jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ storage: {} })) }));

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  // Isolate from host credentials and .env; all values below are synthetic.
  process.env = {
    NODE_ENV: 'test',
    JWT_SECRET: 'synthetic-access-secret-at-least-32-characters',
    JWT_REFRESH_SECRET: 'synthetic-refresh-secret-at-least-32-characters',
    SUPABASE_URL: 'https://example.supabase.co',
  };
});

afterEach(() => { process.env = originalEnv; });

function loadEnv() {
  return require('./env').env as typeof import('./env').env;
}

function productionEnv() {
  Object.assign(process.env, {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://synthetic.invalid/test',
    STRIPE_SECRET_KEY: 'synthetic-stripe-key',
    STRIPE_WEBHOOK_SECRET: 'synthetic-webhook-key',
    SMTP_HOST: 'smtp.example.invalid',
    SMTP_USER: 'synthetic-user',
    SMTP_PASS: 'synthetic-password',
    FRONTEND_URL: 'https://example.invalid',
  });
}

describe('Supabase key aliases', () => {
  it('resolves modern secret and publishable keys to the existing admin/public slots', () => {
    process.env.SUPABASE_SECRET_KEY = 'synthetic-modern-admin-key';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'synthetic-modern-public-key';
    const env = loadEnv();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('synthetic-modern-admin-key');
    expect(env.SUPABASE_ANON_KEY).toBe('synthetic-modern-public-key');
  });

  it('retains legacy keys when modern names are absent or empty', () => {
    process.env.SUPABASE_SECRET_KEY = '';
    process.env.SUPABASE_PUBLISHABLE_KEY = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-legacy-admin';
    process.env.SUPABASE_ANON_KEY = 'synthetic-legacy-public';
    const env = loadEnv();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('synthetic-legacy-admin');
    expect(env.SUPABASE_ANON_KEY).toBe('synthetic-legacy-public');
  });

  it('prefers modern aliases over legacy keys when both are configured', () => {
    process.env.SUPABASE_SECRET_KEY = 'synthetic-modern-admin-key';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'synthetic-modern-public-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-legacy-admin';
    process.env.SUPABASE_ANON_KEY = 'synthetic-legacy-public';
    const env = loadEnv();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('synthetic-modern-admin-key');
    expect(env.SUPABASE_ANON_KEY).toBe('synthetic-modern-public-key');
  });

  it('routes resolved secret only to admin and publishable only to public client', () => {
    process.env.SUPABASE_SECRET_KEY = 'synthetic-modern-admin-key';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'synthetic-modern-public-key';
    require('./supabase');
    const { createClient } = require('@supabase/supabase-js');
    expect(createClient.mock.calls).toEqual([
      ['https://example.supabase.co', 'synthetic-modern-admin-key', {
        auth: { autoRefreshToken: false, persistSession: false },
      }],
      ['https://example.supabase.co', 'synthetic-modern-public-key'],
    ]);
  });

  it('does not fall back from public to admin or admin to public', () => {
    process.env.SUPABASE_PUBLISHABLE_KEY = 'synthetic-modern-public-key';
    expect(loadEnv().SUPABASE_SERVICE_ROLE_KEY).toBe('');
    jest.resetModules();
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    process.env.SUPABASE_SECRET_KEY = 'synthetic-modern-admin-key';
    expect(loadEnv().SUPABASE_ANON_KEY).toBe('');
  });
});

describe('production validation with resolved Supabase keys', () => {
  it.each(['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'])(
    'accepts admin credentials from %s', key => {
      productionEnv();
      process.env[key] = 'synthetic-admin-key';
      expect(() => loadEnv()).not.toThrow();
    },
  );

  it('rejects a publishable-only configuration without exposing its value', () => {
    productionEnv();
    process.env.SUPABASE_PUBLISHABLE_KEY = 'synthetic-modern-public-key';
    expect(() => loadEnv()).toThrow(/^Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY$/);
  });

  it('still requires explicit FRONTEND_URL instead of accepting its development default', () => {
    productionEnv();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-admin-key';
    delete process.env.FRONTEND_URL;
    expect(() => loadEnv()).toThrow('FRONTEND_URL');
  });

  it('preserves JWT strength and separation requirements', () => {
    productionEnv();
    process.env.SUPABASE_SECRET_KEY = 'synthetic-admin-key';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
    expect(() => loadEnv()).toThrow('JWT secrets must be distinct');
  });
});
