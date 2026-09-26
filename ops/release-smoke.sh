#!/usr/bin/env bash
set -Eeuo pipefail
: "${BASE_URL:?BASE_URL is required}"
CURL_TIMEOUT_SECONDS="${CURL_TIMEOUT_SECONDS:-10}"
base="${BASE_URL%/}"
check(){
  local path="$1"
  local body
  body="$(curl --fail --silent --show-error --max-time "$CURL_TIMEOUT_SECONDS" "$base$path")"
  printf 'PASS %s bytes=%s\n' "$path" "${#body}"
}
check "/health/live"
check "/health/ready"
check "/api/tenant/current"
check "/api/settings/public"
