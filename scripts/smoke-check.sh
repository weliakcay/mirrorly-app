#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-${BASE_URL:-}}"
GARMENT_ID="${2:-${GARMENT_ID:-}}"

if [[ -z "${BASE_URL}" ]]; then
  echo "Usage: bash scripts/smoke-check.sh <base-url> [garment-id]"
  echo "Example: bash scripts/smoke-check.sh https://mirrorly-app.vercel.app abc123"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

assert_contains() {
  local file="$1"
  local pattern="$2"
  local message="$3"

  if ! grep -qi "$pattern" "$file"; then
    echo "FAIL: ${message}"
    echo "Body:"
    cat "$file"
    exit 1
  fi
}

echo "Checking ${BASE_URL}"

echo "- GET /api/ping"
curl -fsS "${BASE_URL}/api/ping" > "${TMP_DIR}/ping.json"
assert_contains "${TMP_DIR}/ping.json" '"ok"[[:space:]]*:[[:space:]]*true' "/api/ping did not return ok=true"

echo "- GET /api/try-on"
curl -fsS "${BASE_URL}/api/try-on" > "${TMP_DIR}/try-on.json"
assert_contains "${TMP_DIR}/try-on.json" '"success"[[:space:]]*:[[:space:]]*true' "/api/try-on GET did not return success=true"

echo "- GET /"
curl -fsS "${BASE_URL}/" > "${TMP_DIR}/index.html"
assert_contains "${TMP_DIR}/index.html" 'Mirrorly' "Landing page does not look like Mirrorly"

if [[ -n "${GARMENT_ID}" ]]; then
  echo "- GET /?id=${GARMENT_ID}"
  curl -fsS "${BASE_URL}/?id=${GARMENT_ID}" > "${TMP_DIR}/garment.html"
  assert_contains "${TMP_DIR}/garment.html" 'Mirrorly' "Garment deep link response did not look valid"
fi

echo "Smoke checks passed."

