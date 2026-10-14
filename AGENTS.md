# Agent governance — Therapist Platform

## Product and architecture
Therapist Platform is a configurable multi-tenant platform for professional services. `frontend/` is Angular 20; `backend/` is Express 5 / TypeScript / Prisma 7; PostgreSQL is hosted via Supabase. `e2e/` contains Playwright tests; `deploy/`, `ops/`, and root Compose files provide infrastructure configuration.

## Source of truth
- Product direction: `docs/PRODUCTIZATION.md` and domain PRDs under `docs/`.
- Runtime Supabase cutover: `docs/SUPABASE-CUTOVER.md`.
- Local infrastructure: `docs/COOLIFY-LOCAL.md`.
- Security: `docs/SECURITY-BASELINE-V1.md` and `docs/SECURITY-HARDENING-V1-RUNBOOK.md`.
- SaaS planning: `docs/ROADMAP-POST-SAAS-FOUNDATION.md` and `docs/PRD-SAAS-*.md`.
- Historical snapshots and audits are not evidence of current runtime state.

## Development and verification
Install dependencies separately under `backend/`, `frontend/`, and `e2e/` when needed. Backend: `npm run build`, `npm run test:unit`, `npm run test:integration`. Frontend: `npm run build`, `npm test`. E2E: consult Playwright configuration and target environment before running. Do not execute migrations or seed against a shared database without explicit approval.

## Git and security
Use a normal branch and pull request against the repository default branch. Never create worktrees, force-push, rewrite history, discard unrelated local edits, or merge without policy approval. Keep runtime credentials outside Git; use documented examples with placeholders. Never print secret values. Do not alter external infrastructure, databases, or production systems without authorization.

## Scope and completion
Prefer minimal changes with traceable evidence. Confirm references before deleting files; preserve ambiguous artifacts and record `AUDIT_REQUIRED`. Validate relevant tests/builds and `git diff --check`; document residual risks. A migration is complete only after its evidence, tests, and review requirements are satisfied.
