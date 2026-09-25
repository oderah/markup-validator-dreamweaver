#!/usr/bin/env bash
# On agent stop: require fallow:gate when in-scope work happened.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export FALLOW_PROJECT_ROOT="$ROOT"
export FALLOW_AGENT_SOURCE="${FALLOW_AGENT_SOURCE:-cursor}"
exec python3 "$ROOT/scripts/fallow_hooks/runtime.py" --adapter cursor --action stop-gate
