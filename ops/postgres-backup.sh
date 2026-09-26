#!/usr/bin/env bash
set -Eeuo pipefail
: "${PGHOST:?PGHOST is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
PGPORT="${PGPORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/therapist-platform}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
RELEASE_SHA="${RELEASE_SHA:-unknown}"
umask 077
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
safe_db="$(printf '%s' "$PGDATABASE" | tr -c '[:alnum:]_-' '_')"
base_name="${safe_db}-${timestamp}"
dump_file="${BACKUP_DIR}/${base_name}.dump"
checksum_file="${dump_file}.sha256"
metadata_file="${dump_file}.json"
tmp_file="${dump_file}.partial"
cleanup_partial(){ rm -f "$tmp_file"; }
trap cleanup_partial EXIT
start_epoch="$(date +%s)"
pg_dump --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$PGDATABASE" --format=custom --compress=6 --no-owner --no-privileges --file="$tmp_file"
mv "$tmp_file" "$dump_file"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$dump_file")" > "$(basename "$checksum_file")")
sha256="$(awk '{print $1}' "$checksum_file")"
size_bytes="$(wc -c < "$dump_file" | tr -d ' ')"
duration_seconds="$(( $(date +%s) - start_epoch ))"
pg_dump_version="$(pg_dump --version | sed 's/"/\\\"/g')"
cat > "$metadata_file" <<JSON
{
  "database": "$safe_db",
  "createdAtUtc": "$timestamp",
  "format": "postgresql-custom",
  "sha256": "$sha256",
  "sizeBytes": $size_bytes,
  "durationSeconds": $duration_seconds,
  "releaseSha": "$RELEASE_SHA",
  "pgDumpVersion": "$pg_dump_version",
  "retentionDays": $BACKUP_RETENTION_DAYS
}
JSON
chmod 600 "$dump_file" "$checksum_file" "$metadata_file"
find "$BACKUP_DIR" -type f \( -name '*.dump' -o -name '*.dump.sha256' -o -name '*.dump.json' \) -mtime "+$BACKUP_RETENTION_DAYS" -delete
printf 'backup_file=%s\nchecksum_file=%s\nmetadata_file=%s\nsha256=%s\nsize_bytes=%s\nduration_seconds=%s\n' "$dump_file" "$checksum_file" "$metadata_file" "$sha256" "$size_bytes" "$duration_seconds"
