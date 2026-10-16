# MIG-G3.H — Repository Hygiene

Status: IN PROGRESS / AUDIT_REQUIRED (not PASS).

## Baseline
- Repository: `C:/desenv/therapist-platform`.
- Initial SHA: `784ec546d9de43da9d8951534462772d77496785`.
- Fetched `origin/main` and fast-forwarded to `f10fb76` before creating `chore/mig-g3h-repository-hygiene`.
- Preexisting user edit `backend/.env.example` is intentionally excluded from this migration.
- Legacy duplicate checkout `C:/desenv/Izabela/IzaCenter` remains untouched.

## Inventory
- 6,689 tracked files at inspection time.
- Primary directories: `backend`, `frontend`, `e2e`, `deploy`, `ops`, `scripts`, `docs`, `.github`, `.claude`, `.cursor`, `.gemini`.
- Backend: Express 5, TypeScript, Prisma 7, Supabase PostgreSQL. Frontend: Angular 20. E2E: Playwright.
- Product, SaaS, security and deployment PRDs/runbooks are under `docs/`; root README includes an outdated dated status audit.
- Tracked build output: `backend/build_errors.log` (8,338 bytes), with no tracked text references found.

## Classification
- CURRENT: `docs/PRODUCTIZATION.md`, `docs/SUPABASE-CUTOVER.md`, `docs/COOLIFY-LOCAL.md`, security runbooks, subject to runtime verification.
- REFERENCE: historical root audits `REVIEW.md`, `ADMIN_I18N_IMPLEMENTATION.md`, `MENU_AUDIT_TASKS.md`, `SPRINTS.md`.
- AUDIT_REQUIRED: all PRDs pending reconciliation against current code and deployment; `docs/therapist-platform-*-prompt*.md`.
- DROP: `backend/build_errors.log`, generated diagnostic log with no active tracked references.

## Security
Tracked filename screening identified `backend/.env.example`, but no tracked `.env` runtime file or private-key extension in the screened patterns. This does not constitute a complete content or Git-history secret scan. The public CA certificate `backend/supabase-ca.crt` requires certificate-content verification before any removal.

## Residual gates
- Complete content-based secret scan, duplicate/unused file checks and dependency-reference review.
- Reconcile README historical status against implementation and update documentation index.
- Run backend/frontend tests, builds, relevant E2E, and `git diff --check`.
- Record final inventory, validation outcomes, commit and PR.

Do not mark CLEAN/AUDITED/READY until these gates are green.

## Closure checkpoint — 2026-10-14

- PR #131 merged to `main` as `5c88d50`; continuation branch `chore/mig-g3h-audit-closure` created from merged main.
- Backend `npm run build`: PASS (exit 0; Prisma Client 7.10.0 generated).
- Frontend `npm run build`: PASS (exit 0; nonblocking CSS budget and CommonJS warnings).
- Backend `npm run test:unit -- --runInBand --silent`: PASS (31 suites, 403 tests).
- Content scanner: 6,692 tracked paths; 259 files skipped due to size, binary or unavailable contents; zero matches for private-key blocks, GitHub token and AWS key patterns. One Supabase service-key pattern match in tracked `backend/.env.example`; value not displayed, file untouched per user instruction. 105 password-assignment pattern matches concentrated in bundled `.claude/skills` examples and benchmark fixtures; these require triage, not automatic classification as credentials.
- `.claude/skills` includes 1,997 tracked files; benchmark fixtures remain preserved pending ownership and dependency audit.
- E2E, integration, complete historical secret scanning, dependency vulnerabilities and comprehensive PRD reconciliation remain unverified.
- Result: builds/unit tests PASS; overall MIG-G3.H remains AUDIT_REQUIRED, not yet CLEAN/AUDITED/READY.

## Follow-up checkpoint — 2026-10-16

- PR #132 merged into `main` at `ca70a7b`.
- Integration test run: BLOCKED (3 suites, zero tests); test harness explicitly requires `NODE_ENV=test`, a `TEST_DATABASE_URL` with localhost/127.0.0.1/[::1] host and database name ending `_test`. No shared Supabase database was used.
- GitHub Dependabot API: 31 open alerts: 3 critical (`proxy-addr`), 12 high (`brace-expansion`, `http-cache-semantics`, `source-map-js`), 15 moderate (`brace-expansion`, `ip-address`, `python-dotenv`), 1 low (`quill`). Package references are aggregate, not necessarily unique vulnerabilities.
- PRD documentation roles and explicit operational gates recorded in `docs/DOCUMENTATION-INDEX.md`; no ambiguous documentation deleted.
- `.env` unchanged; pre-existing `backend/.env.example` modification excluded from commit.
- E2E execution needs isolated frontend/test backend and browser provisioning; test discovery is being evaluated separately.
- Status: AUDIT_REQUIRED due to unresolved dependency alerts, integration/E2E evidence, and historical secret review. Do not mark READY.
