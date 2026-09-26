#!/usr/bin/env bash
set -Eeuo pipefail
: "${PGHOST:?PGHOST is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
PGPORT="${PGPORT:-5432}"
PGMAINTENANCE_DB="${PGMAINTENANCE_DB:-postgres}"
DRILL_PREFIX="${DRILL_PREFIX:-therapist_restore_drill_}"
backup_file="${1:-}"
if [[ -z "$backup_file" || ! -f "$backup_file" ]]; then echo "Usage: $0 /path/to/backup.dump" >&2; exit 2; fi
checksum_file="${backup_file}.sha256"
if [[ ! -f "$checksum_file" ]]; then echo "Missing checksum file: $checksum_file" >&2; exit 3; fi
(cd "$(dirname "$backup_file")" && sha256sum -c "$(basename "$checksum_file")")
suffix="$(date -u +%Y%m%dT%H%M%SZ)_$$"
drill_db="${DRILL_PREFIX}${suffix}"
if [[ "$drill_db" != "$DRILL_PREFIX"* || "$drill_db" == "$PGDATABASE" ]]; then echo "Refusing unsafe restore target: $drill_db" >&2; exit 4; fi
cleanup(){ dropdb --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --maintenance-db="$PGMAINTENANCE_DB" --if-exists "$drill_db" >/dev/null 2>&1 || true; }
trap cleanup EXIT
start_epoch="$(date +%s)"
createdb --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --maintenance-db="$PGMAINTENANCE_DB" "$drill_db"
pg_restore --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$drill_db" --exit-on-error --no-owner --no-privileges "$backup_file"
table_count="$(psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$drill_db" --tuples-only --no-align --command="SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")"
migration_count="$(psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$drill_db" --tuples-only --no-align --command="SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL;")"
tenant_count="$(psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$drill_db" --tuples-only --no-align --command="SELECT CASE WHEN to_regclass('public.tenants') IS NULL THEN -1 ELSE (SELECT count(*) FROM tenants) END;")"
user_count="$(psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$drill_db" --tuples-only --no-align --command="SELECT CASE WHEN to_regclass('public.users') IS NULL THEN -1 ELSE (SELECT count(*) FROM users) END;")"
duration_seconds="$(( $(date +%s) - start_epoch ))"
if [[ "$table_count" -le 0 || "$migration_count" -le 0 ]]; then echo "Restore verification failed: tables=$table_count migrations=$migration_count" >&2; exit 5; fi
printf 'restore_drill=PASS\ntarget_database=%s\ntables=%s\napplied_migrations=%s\ntenants=%s\nusers=%s\nduration_seconds=%s\n' "$drill_db" "$table_count" "$migration_count" "$tenant_count" "$user_count" "$duration_seconds"
