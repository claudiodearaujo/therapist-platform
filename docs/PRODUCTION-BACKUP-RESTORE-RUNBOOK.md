# Runbook — PostgreSQL Backup & Restore Drill

## Scope

Operational procedure for **PO-02 — Backup, restore drill and RPO/RTO** of Therapist Platform.

This runbook does not authorize public exposure, real SaaS billing, or restoration over an active database.

## Safety rules

- Never restore a drill over the active database.
- Restore drills may only use names beginning with `therapist_restore_drill_`.
- Keep backup storage outside the Git repository and outside ephemeral application containers.
- Never commit database credentials, dumps, checksums containing secrets, or restored data.
- Run a verified backup before destructive migrations or releases with schema changes.
- Application rollback does not automatically roll back database schema.
- Test/staging restore destinations must remain isolated from production.

## Backup contract

Script: `ops/postgres-backup.sh`.

Required environment:

- `PGHOST`
- `PGDATABASE`
- `PGUSER`

Optional:

- `PGPORT` (default `5432`)
- `PGPASSWORD` when required by the target PostgreSQL authentication policy
- `BACKUP_DIR` (default `/var/backups/therapist-platform`)
- `BACKUP_RETENTION_DAYS` (default `14`)
- `RELEASE_SHA` (default `unknown`)

The script creates:

1. PostgreSQL custom-format dump (`.dump`);
2. portable SHA-256 checksum (`.dump.sha256`);
3. metadata (`.dump.json`) with timestamp, size, duration, release SHA and pg_dump version.

The dump is first written as `.partial` and is only promoted after `pg_dump` succeeds. Files are created with restrictive permissions.

### Example

```bash
export PGHOST=db.internal
export PGPORT=5432
export PGDATABASE=therapist_platform
export PGUSER=backup_operator
export BACKUP_DIR=/mnt/backup/therapist-platform
export BACKUP_RETENTION_DAYS=14
export RELEASE_SHA=<immutable-release-sha>

bash ops/postgres-backup.sh
```

Supply credentials through the environment/secret manager of the target runtime, never through Git.

## Scheduling and RPO

Initial target: **RPO <= 24 hours**.

Production/staging must schedule at least one successful backup every 24 hours. Alert when:

- the latest successful backup is older than 24 hours;
- checksum generation fails;
- backup size is unexpectedly zero or materially outside its normal range;
- the backup destination is unavailable.

The local drill validates the mechanism, not durable retention. Production backups must use persistent, access-controlled storage independent from the database container.

## Restore drill

Script: `ops/postgres-restore-drill.sh`.

The script:

1. requires the dump and its checksum;
2. validates SHA-256 before creating a database;
3. generates a disposable database with prefix `therapist_restore_drill_`;
4. restores with `pg_restore --exit-on-error`;
5. validates public table count and completed Prisma migrations;
6. records tenant/user counts when those tables exist;
7. always drops the disposable database on exit.

### Example

```bash
export PGHOST=db.internal
export PGPORT=5432
export PGDATABASE=therapist_platform
export PGUSER=restore_operator
export PGMAINTENANCE_DB=postgres

bash ops/postgres-restore-drill.sh /mnt/backup/therapist-platform/<backup>.dump
```

## RTO

Initial operational target: **RTO <= 4 hours**.

A restore drill duration is only the database restore component of RTO. End-to-end RTO also includes incident declaration, selecting a valid backup, provisioning an isolated destination, application configuration, smoke checks and controlled traffic restoration.

## Local evidence — 2026-09-26

Environment: dedicated local Coolify PostgreSQL, with the active database left untouched.

Final backup:

- format: PostgreSQL custom;
- PostgreSQL tooling: 16.15;
- size: 113,952 bytes;
- backup duration: 1 second;
- checksum verification: PASS;
- release SHA recorded: `558124c18401fdba391bb6f0e44dc8f1ba32c659`.

Restore drill:

- target: generated disposable database only;
- restore verification: PASS;
- public tables: 26;
- completed Prisma migrations: 10;
- tenants: 1;
- users: 2;
- restore/verification duration: 1 second;
- disposable database remaining after drill: 0.

The measured 1-second restore is **not** claimed as end-to-end RTO. The operational target remains <= 4 hours until a complete recovery exercise is measured in staging.

## Incident flow

1. Stop destructive changes and preserve the current state.
2. Identify the last backup within the RPO window.
3. Verify SHA-256 before restore.
4. Restore to a new isolated database.
5. Validate migrations, schema and minimum data counts.
6. Point a non-public application instance to the restored database.
7. Run health/readiness and authenticated smoke tests.
8. Record actual elapsed recovery time.
9. Promote traffic only after human authorization.
10. Preserve evidence and open a post-incident review.

## Exit criteria for PO-02

- versioned backup script;
- SHA-256 + metadata;
- configurable retention;
- restore only to disposable destination;
- restore cleanup verified;
- local restore drill PASS;
- RPO/RTO targets documented;
- production durable storage/scheduling remains an environment provisioning responsibility before public launch.


## Negative control — checksum corruption

A copy of the final dump was intentionally modified after checksum generation. The restore script rejected it with checksum failure and exit code 1 **before** creating a restore database. A follow-up query confirmed zero `therapist_restore_drill_*` databases remained.
