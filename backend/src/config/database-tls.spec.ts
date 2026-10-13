import { postgresConnectionOptions } from './database-tls';
describe('Supabase database TLS boundary', () => {
  it('preserves disposable/local PostgreSQL connections', () => {
    const url='postgresql://127.0.0.1:55439/therapist_test';
    expect(postgresConnectionOptions(url)).toEqual({connectionString:url});
  });
  it.each(['aws-0-us-east-1.pooler.supabase.com','db.synthetic.supabase.co'])('verifies provider CA for %s despite weaker URL options',host=>{
    const options=postgresConnectionOptions(`postgresql://${host}:6543/postgres?sslmode=disable&sslaccept=accept_invalid_certs&pgbouncer=true`);
    expect(options.ssl?.rejectUnauthorized).toBe(true);
    expect(options.ssl?.ca).toContain('-----BEGIN CERTIFICATE-----');
    const url=new URL(options.connectionString);
    expect(url.searchParams.has('sslmode')).toBe(false);
    expect(url.searchParams.has('sslaccept')).toBe(false);
    expect(url.searchParams.get('pgbouncer')).toBe('true');
  });
  it('does not match attacker suffixes',()=>{
    const url='postgresql://supabase.com.attacker.invalid/postgres';
    expect(postgresConnectionOptions(url)).toEqual({connectionString:url});
  });
});
