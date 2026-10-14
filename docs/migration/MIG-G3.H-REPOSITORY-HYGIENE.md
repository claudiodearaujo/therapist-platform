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
