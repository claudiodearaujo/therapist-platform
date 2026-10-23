# SEC-2026-10 - Technical debt: integration test database

Status: OPEN / NON-BLOCKING TECHNICAL DEBT (2026-10-23)

The Therapist Platform is entirely in development. The configured DATABASE_URL remains the application's development database; no production or homologation environment is assumed.

The three integration suites (orders, users, cards) are blocked by a deliberate test guard requiring NODE_ENV=test and a TEST_DATABASE_URL pointing to localhost with a database name ending in _test.

Important: backend/src/test/integration/setup.ts cleanDatabase() performs TRUNCATE TABLE ... CASCADE on all public tables except _prisma_migrations. Do NOT point these suites at the existing DATABASE_URL or bypass the guard: this could erase development data.

Technical debt: implement a safe integration-test strategy, ideally a disposable test database with TEST_DATABASE_URL derived/configured from the existing development infrastructure; alternatively isolate test fixtures and remove destructive global cleanup after review. Keep the existing DATABASE_URL for normal development usage. No additional production/homologation environment is needed.

Validated gates: backend 403 tests passed in 31 suites; three integration suites could not start (overall Jest exit 1). Frontend Angular 265 tests passed in 36 files (exit 0). Do not mark full integration PASS.

Preserve unrelated local modifications, especially backend/.env.example.
## Execution checkpoint (2026-10-23)

- `npm --prefix backend run test:unit -- --runInBand`: 31 suites / 403 tests PASS, exit 0.
- `npm --prefix frontend run test -- --watch=false`: 36 files / 265 tests PASS, exit 0.
- `npm --prefix backend test -- --runInBand`: 31 unit suites PASS, 3 integration suites blocked, exit 1. This is a missing test-database configuration, not a failure in the 403 unit tests.

## Acceptance criteria for future integration enablement

1. Preserve the configured application `DATABASE_URL` and all existing development data.
2. Provision a separate disposable PostgreSQL database named with `_test` on localhost, reusing the existing development infrastructure where possible; configure `TEST_DATABASE_URL` explicitly and `NODE_ENV=test`.
3. Never copy the application `DATABASE_URL` into `TEST_DATABASE_URL`, disable the localhost/_test guard, or truncate the application database.
4. Run the three integration suites against only the disposable database, verify cleanup, and capture their exit codes.
5. Do not put credentials or database URLs with secrets in Git, logs, or PR comments.
