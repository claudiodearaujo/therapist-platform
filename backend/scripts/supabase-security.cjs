const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const url = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid');
if (process.env.NODE_ENV !== 'test' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/therapist_security_test') {
  throw new Error('Disposable local therapist_security_test database required');
}
const client = new Client({ connectionString: process.env.DATABASE_URL });
const roles = ['anon', 'authenticated'];
const schema = fs.readFileSync(path.join(__dirname, '../prisma/schema.prisma'), 'utf8');
const tables = [...schema.matchAll(/@@map\("([a-z_]+)"\)/g)].map(match => match[1]);
tables.push('_prisma_migrations');

async function main() {
  await client.connect();
  if (process.argv[2] === 'prepare') {
    for (const role of roles) {
      await client.query(`CREATE ROLE ${role} NOLOGIN NOBYPASSRLS`);
      await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
      // Reproduce Supabase projects with permissive grants for newly created tables.
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${role}`);
    }
    console.log('SUPABASE_TEST_ROLES_PREPARED');
    return;
  }
  assert.equal(process.argv[2], 'verify');
  for (const table of tables) {
    const { rows } = await client.query('SELECT relrowsecurity FROM pg_class WHERE oid = $1::regclass', [`public.${table}`]);
    assert.equal(rows[0]?.relrowsecurity, true, `RLS missing: ${table}`);
    for (const role of roles) {
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        const result = await client.query('SELECT has_table_privilege($1, $2, $3) AS allowed', [role, `public.${table}`, privilege]);
        assert.equal(result.rows[0].allowed, false, `${role} must not have ${privilege} on ${table}`);
      }
    }
  }
  for (const role of roles) {
    await client.query(`SET ROLE ${role}`);
    try { await assert.rejects(client.query('SELECT id FROM public.users'), { code: '42501' }); }
    finally { await client.query('RESET ROLE'); }
  }
  // Defense in depth: even an accidental grant must not expose existing tenant rows.
  const { rows } = await client.query('SELECT count(*)::int AS count FROM public.tenants');
  assert.ok(rows[0].count > 0, 'Security fixtures must exist before RLS verification');
  await client.query('BEGIN');
  try {
    await client.query('GRANT SELECT ON public.tenants TO anon');
    await client.query('SET LOCAL ROLE anon');
    const denied = await client.query('SELECT count(*)::int AS count FROM public.tenants');
    assert.equal(denied.rows[0].count, 0);
  } finally { await client.query('ROLLBACK'); }
  console.log(`SUPABASE_DATA_API_ISOLATION_PASS: ${tables.length} tables, denied role access and RLS defense verified`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => client.end());
