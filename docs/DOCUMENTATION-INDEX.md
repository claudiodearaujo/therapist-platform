# Documentation classification — MIG-G3.H

Classification reflects the role of each document, not a claim that its requirements are fully deployed. Check code and runtime evidence before treating a PRD status as current.

| Document family | Classification | Reason / next verification |
| --- | --- | --- |
| `PRODUCTIZATION.md`, `PRD-GENERIC-DOMAIN.md`, `PRD-SERVICE-DOMAIN-V2.md`, `PRD-DELIVERY-DOMAIN-V3.md`, `PRD-CONTENT-WHITELABEL-V4.md`, `PRD-SPECIALTY-MODULES-V5.md` | REFERENCE | Architectural evolution and domain requirements; reconcile implementation claims with modules and migrations |
| `PRD-SAAS-FOUNDATION-V1.md`, `PRD-SAAS-DATA-ISOLATION-V2.md`, `PRD-SAAS-ONBOARDING-BRANDING-V3.md`, `PRD-SAAS-PLANS-BILLING-V4.md`, `PRD-SAAS-LGPD-OPERATIONS-V5.md` | REFERENCE | SaaS delivery requirements and historical validation; not independent runtime attestation |
| `PRD-SECURITY-HARDENING-V1.md`, `PRD-PRODUCTION-OPERATIONS-V1.md` | AUDIT_REQUIRED | Explicitly identify operational gates remaining (private media, observability, staging/production rollback) |
| `SECURITY-BASELINE-V1.md`, `SECURITY-HARDENING-V1-RUNBOOK.md`, `SUPABASE-CUTOVER.md`, `COOLIFY-LOCAL.md` | CURRENT | Operational reference; verify actual environment separately |
| `PRODUCTION-BACKUP-RESTORE-RUNBOOK.md`, `PRODUCTION-RELEASE-ROLLBACK-RUNBOOK.md` | REFERENCE | Prepared procedures, not proof of a production environment |
| `ROADMAP-POST-SAAS-FOUNDATION.md` | CURRENT | Planning reference; statuses require independent checks |
| `DESIGN-SYSTEM-V1.md`, `DESIGN-SYSTEM-COMPONENTS-V1.md` | REFERENCE | UI design specifications; verify against Angular implementation |
| `therapist-platform-color-migration-prompt.md`, `therapist-platform-cursor-prompt-v2.md` | REFERENCE | Historical prompts; not operational instructions |
| `security/*.json`, `security/*.md` | REFERENCE | Dated security snapshots, not live vulnerability counts |
| `migration/MIG-G3.H-REPOSITORY-HYGIENE.md` | CURRENT | Active audit record with explicit incomplete gates |

No ambiguous PRD was deleted. Historical root documents (`REVIEW.md`, `SPRINTS.md`, `MENU_AUDIT_TASKS.md`, `ADMIN_I18N_IMPLEMENTATION.md`) are REFERENCE, not current release status.
