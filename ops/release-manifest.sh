#!/usr/bin/env bash
set -Eeuo pipefail

: "${RELEASE_VERSION:?RELEASE_VERSION is required (vMAJOR.MINOR.PATCH)}"
: "${RELEASE_SHA:?RELEASE_SHA is required}"
: "${BACKEND_IMAGE_REF:?BACKEND_IMAGE_REF is required and must be digest-pinned}"
: "${FRONTEND_IMAGE_REF:?FRONTEND_IMAGE_REF is required and must be digest-pinned}"

OUTPUT_FILE="${1:-release-manifest.json}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-backend/prisma/migrations}"

if [[ ! "$RELEASE_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid RELEASE_VERSION: $RELEASE_VERSION" >&2
  exit 2
fi
if [[ ! "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "RELEASE_SHA must be a 40-character lowercase git SHA" >&2
  exit 3
fi
for ref in "$BACKEND_IMAGE_REF" "$FRONTEND_IMAGE_REF"; do
  if [[ ! "$ref" =~ @sha256:[0-9a-f]{64}$ ]]; then
    echo "Image reference is not digest-pinned: $ref" >&2
    exit 4
  fi
done
if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 5
fi

mapfile -t migrations < <(find "$MIGRATIONS_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | LC_ALL=C sort)
migration_json=""
for migration in "${migrations[@]}"; do
  [[ "$migration" =~ ^[0-9A-Za-z_-]+$ ]] || { echo "Unsafe migration name: $migration" >&2; exit 6; }
  [[ -n "$migration_json" ]] && migration_json+=","
  migration_json+="\"$migration\""
done

created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "$OUTPUT_FILE" <<JSON
{
  "version": "$RELEASE_VERSION",
  "gitSha": "$RELEASE_SHA",
  "createdAtUtc": "$created_at",
  "backendImage": "$BACKEND_IMAGE_REF",
  "frontendImage": "$FRONTEND_IMAGE_REF",
  "migrationSet": [$migration_json],
  "schemaRollbackPolicy": "forward-fix"
}
JSON
printf 'release_manifest=%s\nmigrations=%s\n' "$OUTPUT_FILE" "${#migrations[@]}"
