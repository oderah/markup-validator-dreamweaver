#!/usr/bin/env bash
# Install a repo-local git pre-commit hook that runs the Fallow gate when
# staged files are in scope. Safe to re-run.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_DIR="$ROOT/.git/hooks"
HOOK="$HOOK_DIR/pre-commit"
MARKER_BEGIN="# BEGIN fallow-gate"
MARKER_END="# END fallow-gate"

if [[ ! -d "$ROOT/.git" ]]; then
  echo "Not a git repository: $ROOT" >&2
  exit 1
fi

mkdir -p "$HOOK_DIR"

BLOCK_FILE="$(mktemp)"
cat > "$BLOCK_FILE" <<'EOF'
# BEGIN fallow-gate
# Runs npm run fallow:gate when staged paths include JS/TS scope.
if command -v python3 >/dev/null 2>&1; then
  ROOT="$(git rev-parse --show-toplevel)"
  export FALLOW_AGENT_SOURCE="${FALLOW_AGENT_SOURCE:-cursor}"
  export FALLOW_SKIP_BINARY_VERIFY="${FALLOW_SKIP_BINARY_VERIFY:-1}"
  staged="$(git diff --cached --name-only || true)"
  in_scope="$(printf '%s\n' "$staged" | python3 -c '
import re, sys
pats = (
  r"^\./",
  r"^webpack\.config\.js$",
  r"^cypress/",
  r"^cypress\.config\.js$",
  r"^package\.json$",
  r"^\.fallowrc\.json$",
  r"^scripts/fallow_gate\.py$",
)
scoped = False
for line in sys.stdin:
  rel = line.strip()
  if not rel:
    continue
  if any(re.search(p, rel) for p in pats) or rel.endswith((".js", ".jsx", ".ts", ".tsx")):
    scoped = True
    break
print("yes" if scoped else "no")
')"
  if [[ "$in_scope" == "yes" ]]; then
    echo "fallow-gate: staged JS/TS changes — running quality gate…"
    if ! (cd "$ROOT" && python3 "$ROOT/scripts/fallow_gate.py"); then
      echo "fallow-gate: commit blocked. See docs/fallow/quality-gate.md" >&2
      exit 1
    fi
  fi
fi
# END fallow-gate
EOF

python3 - "$HOOK" "$MARKER_BEGIN" "$MARKER_END" "$BLOCK_FILE" <<'PY'
import pathlib, sys

hook = pathlib.Path(sys.argv[1])
begin, end, block_file = sys.argv[2], sys.argv[3], pathlib.Path(sys.argv[4])
block = block_file.read_text()

if hook.exists():
    text = hook.read_text()
else:
    text = "#!/usr/bin/env bash\nset -euo pipefail\n"

start = text.find(begin)
stop = text.find(end)
if start != -1 and stop != -1:
    stop = stop + len(end)
    while stop < len(text) and text[stop] == "\n":
        stop += 1
    text = text[:start].rstrip("\n") + "\n\n" + block.rstrip("\n") + "\n" + text[stop:].lstrip("\n")
elif begin in text or end in text:
    raise SystemExit("managed block markers corrupted in pre-commit hook")
else:
    text = text.rstrip("\n") + "\n\n" + block.rstrip("\n") + "\n"

hook.write_text(text)
block_file.unlink(missing_ok=True)
print(str(hook))
PY

chmod +x "$HOOK"
echo "Installed fallow gate into $HOOK"
