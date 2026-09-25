#!/usr/bin/env bash
# Build MarkupValidator-classic-config.zip for Configuration-folder install.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$ROOT/dist/classic-stage"
OUT="$ROOT/dist/MarkupValidator-classic-config.zip"

rm -rf "$STAGE"
mkdir -p "$STAGE/Configuration"

cp -R "$ROOT/dw-classic/Shared" "$STAGE/Configuration/"
cp -R "$ROOT/dw-classic/Floaters" "$STAGE/Configuration/"
mkdir -p "$STAGE/Configuration/Commands"
cp "$ROOT/dw-classic/Commands/"* "$STAGE/Configuration/Commands/" 2>/dev/null || true
mkdir -p "$STAGE/Configuration/Objects/Favorites"
cp "$ROOT/dw-classic/Objects/Favorites/"* "$STAGE/Configuration/Objects/Favorites/"

cp "$ROOT/dw-classic/INSTALL.txt" "$STAGE/"
cp "$ROOT/dw-classic/menus-fragment.xml" "$STAGE/"

rm -f "$OUT"
if command -v zip >/dev/null 2>&1; then
  ( cd "$STAGE" && zip -r "$OUT" . -x "*.DS_Store" )
else
  python3 - <<PY
import zipfile
from pathlib import Path
stage = Path(r"$STAGE")
out = Path(r"$OUT")
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for path in stage.rglob("*"):
        if path.is_file():
            z.write(path, path.relative_to(stage).as_posix())
print("Wrote", out)
PY
fi
echo "Wrote $OUT"
ls -la "$OUT"
