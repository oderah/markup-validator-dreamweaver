#!/usr/bin/env bash
# Refresh composer mode on each prompt.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export FALLOW_PROJECT_ROOT="$ROOT"
export FALLOW_AGENT_SOURCE="${FALLOW_AGENT_SOURCE:-cursor}"
exec python3 "$ROOT/scripts/fallow_hooks/runtime.py" --adapter cursor --action set-mode --mode-source beforeSubmitPrompt
