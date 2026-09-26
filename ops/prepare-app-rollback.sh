#!/usr/bin/env bash
set -Eeuo pipefail
: "${PREVIOUS_BACKEND_IMAGE_REF:?PREVIOUS_BACKEND_IMAGE_REF is required}"
: "${PREVIOUS_FRONTEND_IMAGE_REF:?PREVIOUS_FRONTEND_IMAGE_REF is required}"
OUTPUT_FILE="${1:-rollback-images.override.yml}"
for ref in "$PREVIOUS_BACKEND_IMAGE_REF" "$PREVIOUS_FRONTEND_IMAGE_REF"; do
  if [[ ! "$ref" =~ @sha256:[0-9a-f]{64}$ ]]; then
    echo "Rollback image reference is not digest-pinned: $ref" >&2
    exit 2
  fi
done
cat > "$OUTPUT_FILE" <<YAML
services:
  backend:
    image: $PREVIOUS_BACKEND_IMAGE_REF
  frontend:
    image: $PREVIOUS_FRONTEND_IMAGE_REF
YAML
cat <<TXT
rollback_override=$OUTPUT_FILE
scope=application-images-only
database_rollback=FORBIDDEN
next_step=Run migration compatibility review, then compose promotion with this override and mandatory smoke.
TXT
