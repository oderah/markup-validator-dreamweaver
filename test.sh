#!/usr/bin/env bash
# Run every automated check in this repo. No Dreamweaver or Java required.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required" >&2
  exit 1
fi

echo "== syntax"
syntax_failed=0
while IFS= read -r -d '' file; do
  if ! node --check "$file"; then
    echo "syntax error: $file" >&2
    syntax_failed=1
  fi
done < <(find dw-classic scripts -name '*.js' -print0)
if [[ "$syntax_failed" -ne 0 ]]; then
  exit 1
fi

echo "== scripts/smoke-classic.js"
node scripts/smoke-classic.js

echo "== scripts/test-suite.js"
node scripts/test-suite.js

echo "All tests passed."
