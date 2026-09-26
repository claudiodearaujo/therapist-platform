# Runbook — Release & Application Rollback

## Scope

Operational contract for **PO-03 — Release and rollback**.

A release is identified by SemVer, a full Git SHA and digest-pinned backend/frontend images. Database schema is **forward-fix only**: application rollback never performs destructive database rollback automatically.

## Version convention

- stable release: `vMAJOR.MINOR.PATCH`;
- prerelease: SemVer suffix, for example `v1.4.0-rc.1`;
- Git tag must point to the exact release SHA;
- mutable tags such as `latest` may exist for convenience but are never the promotion/rollback source of truth.

## Release manifest

Generate with `ops/release-manifest.sh`.

Required:

- `RELEASE_VERSION`;
- `RELEASE_SHA` (40 lowercase hex characters);
- `BACKEND_IMAGE_REF` pinned as `name@sha256:<64 hex>`;
- `FRONTEND_IMAGE_REF` pinned as `name@sha256:<64 hex>`.

The manifest records the complete Prisma migration directory set and declares `schemaRollbackPolicy=forward-fix`.

## Pre-deploy checklist

1. Protected `main` checks are green.
2. Release SHA is immutable and reviewed.
3. Backend/frontend images are built from that SHA and pushed by digest.
4. Release manifest is generated and archived with release evidence.
5. Review migrations since the previous release.
6. If schema changes exist, confirm a verified backup inside the RPO window.
7. Confirm migrations are backward-compatible with the previous application version whenever rollback may be required.
8. Confirm environment-specific secrets, CORS, proxy and storage configuration.
9. Keep public exposure and real SaaS billing disabled unless their independent gates are explicitly approved.

## Promotion order

1. Preserve previous release manifest and image digests.
2. Verify backup/checksum when schema changes require it.
3. Run `prisma migrate deploy` using the **new release image/tooling** against the target database.
4. If migration fails, stop promotion and forward-fix. Do not promote application containers.
5. Promote backend/frontend using digest-pinned images.
6. Run `ops/release-smoke.sh`.
7. Record release SHA, version, image digests, migration set, timestamps and smoke evidence.

## Mandatory smoke

`ops/release-smoke.sh` validates:

- `/health/live`;
- `/health/ready`;
- `/api/tenant/current`;
- `/api/settings/public`.

Example:

```bash
BASE_URL=https://staging.example.internal bash ops/release-smoke.sh
```

Authenticated business-flow QA remains required when the release changes those flows.

## Application rollback

Rollback is allowed only to a previously known-good **digest-pinned** backend/frontend pair.

Generate an override:

```bash
export PREVIOUS_BACKEND_IMAGE_REF='registry/backend@sha256:<digest>'
export PREVIOUS_FRONTEND_IMAGE_REF='registry/frontend@sha256:<digest>'
bash ops/prepare-app-rollback.sh rollback-images.override.yml
```

The generated file contains **images only**. It has no database service, migration or destructive command.

Before applying it:

1. inspect migrations introduced by the failed release;
2. confirm the previous application remains compatible with the current schema;
3. if incompatible, prefer forward-fix instead of application rollback;
4. require human authorization;
5. preserve the failed release evidence.

After image rollback, run the mandatory smoke and targeted authenticated QA.

## Database policy

Automatic schema rollback is forbidden.

Reasons:

- down migrations may destroy data;
- an older binary can be incompatible with a newer schema;
- restoring a full database rewinds business data, not only schema.

Schema incidents use forward-fix by default. Full database restore follows `PRODUCTION-BACKUP-RESTORE-RUNBOOK.md` and is a separate incident/recovery decision.

## Local contract evidence — 2026-09-26

- release manifest script syntax: PASS;
- SemVer/SHA/digest validation exercised;
- migration set discovered: 10 directories;
- generated manifest contains version, full SHA, digest-pinned images, migration set and forward-fix policy;
- rollback override generator produced only backend/frontend image overrides;
- no database rollback command exists in the rollback artifact;
- migration deploy executed before promotion: PASS, 10 migrations found and no pending migration;
- local Coolify promotion from merged `main`: PASS; backend/frontend healthy and database preserved;
- gateway smoke after promotion: `/health/live`, `/health/ready`, tenant current and public settings PASS locally;
- `/health/live` and `/health/ready` are proxied to backend and the smoke rejects SPA/non-JSON false positives;
- Tailscale gateway health/readiness and tenant/public-settings endpoints: HTTP 200 after configuring the shared gateway host in `FRONTEND_URL`/`BACKEND_URL`;
- local mutable `:local` tags demonstrated why previous release artifacts must be persisted in a registry by digest; registry-backed rollback remains a staging/production gate, not something to fake with `docker commit`.

## Exit criteria for PO-03

- SemVer/tag convention documented;
- release manifest generated from immutable identifiers;
- pre-deploy and migration ordering documented;
- mandatory smoke versioned;
- rollback artifact limited to application images;
- schema rollback policy explicitly forward-fix;
- local runtime promotion/smoke evidence completed; registry-backed rollback drill is required before production exposure.
