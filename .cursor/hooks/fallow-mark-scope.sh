#!/usr/bin/env bash
# Mark session when an in-scope JS/TS file is edited.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export FALLOW_PROJECT_ROOT="$ROOT"
export FALLOW_AGENT_SOURCE="${FALLOW_AGENT_SOURCE:-cursor}"
exec python3 "$ROOT/scripts/fallow_hooks/runtime.py" --adapter cursor --action mark-scope
