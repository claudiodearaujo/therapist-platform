#!/usr/bin/env bash
set -Eeuo pipefail
: "${BASE_URL:?BASE_URL is required}"
CURL_TIMEOUT_SECONDS="${CURL_TIMEOUT_SECONDS:-10}"
base="${BASE_URL%/}"

check_json(){
  local path="$1"
  local required_token="${2:-}"
  local body
  body="$(curl --fail --silent --show-error --max-time "$CURL_TIMEOUT_SECONDS" "$base$path")"
  case "$body" in
    \{*|\[* ) ;;
    * ) echo "FAIL $path returned non-JSON content" >&2; exit 2 ;;
  esac
  if [[ -n "$required_token" ]] && ! printf '%s' "$body" | grep -Fq "$required_token"; then
    echo "FAIL $path missing required token: $required_token" >&2
    exit 3
  fi
  printf 'PASS %s bytes=%s\n' "$path" "${#body}"
}

check_json "/health/live" '"status":"ok"'
check_json "/health/ready" '"database":"ok"'
check_json "/api/tenant/current"
check_json "/api/settings/public"
