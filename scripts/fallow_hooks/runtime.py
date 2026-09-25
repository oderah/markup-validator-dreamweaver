#!/usr/bin/env python3
"""Shared agent-hook runtime for fallow-kit adapters.

Actions: mark-scope | set-mode | stop-gate
Adapters: cursor | vscode | claude | codex | antigravity

Reads JSON on stdin; writes JSON on stdout (adapter-specific envelopes).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path


def find_root() -> Path:
    env = os.environ.get("FALLOW_PROJECT_ROOT")
    if env:
        return Path(env).resolve()
    here = Path(__file__).resolve().parent
    # scripts/fallow_hooks -> repo root
    return here.parent.parent


def load_config(root: Path) -> dict:
    cfg_path = root / "scripts" / "fallow_hooks" / "config.json"
    if cfg_path.is_file():
        try:
            return json.loads(cfg_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"src_dir": "src", "src_dir_re": "src"}


def read_stdin_json() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except Exception:
        return {}


def emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj) + "\n")


def mode_file(root: Path) -> Path:
    return root / ".fallow" / "composer-mode"


def marker_path(root: Path) -> Path:
    return root / ".fallow" / "session-needs-gate"


def read_saved_mode(root: Path) -> str:
    mf = mode_file(root)
    if not mf.is_file():
        return ""
    for line in mf.read_text(encoding="utf-8").splitlines():
        if line.startswith("mode="):
            return line.split("=", 1)[1].strip().lower()
    return ""


def is_readonly(mode: str) -> bool:
    return mode in ("ask", "chat", "readonly", "read-only")


def extract_path(payload: dict) -> str:
    # Cursor afterFileEdit
    for key in ("file_path", "path", "file", "filePath"):
        v = payload.get(key)
        if isinstance(v, str) and v:
            return v
    # Claude / Copilot / Codex tool_input shapes
    tool_input = payload.get("tool_input") or payload.get("toolInput") or {}
    if isinstance(tool_input, dict):
        for key in ("file_path", "path", "file", "filePath", "target_file"):
            v = tool_input.get(key)
            if isinstance(v, str) and v:
                return v
    # Nested tool_response / tool
    for nest in ("tool", "input", "arguments"):
        d = payload.get(nest)
        if isinstance(d, dict):
            for key in ("file_path", "path", "file", "filePath"):
                v = d.get(key)
                if isinstance(v, str) and v:
                    return v
    return ""


def in_scope(rel: str, src_dir_re: str) -> bool:
    if not rel:
        return False
    patterns = (
        rf"^{src_dir_re}/",
        r"^webpack\.config\.js$",
        r"^cypress/",
        r"^cypress\.config\.js$",
        r"^package\.json$",
        r"^\.fallowrc\.json$",
        r"^scripts/fallow_gate\.py$",
    )
    if any(re.search(p, rel) for p in patterns):
        return True
    return (
        rel.endswith((".js", ".jsx", ".ts", ".tsx"))
        and not rel.startswith("docs/")
        and "/migrations/" not in rel
    )


def action_mark_scope(root: Path, payload: dict, cfg: dict) -> dict:
    file_path = extract_path(payload)
    if not file_path:
        return {}
    try:
        rel = str(Path(file_path).resolve().relative_to(root))
    except Exception:
        rel = file_path
        if rel.startswith(str(root) + "/"):
            rel = rel[len(str(root)) + 1 :]
        rel = rel.lstrip("./")
    rel = rel.replace("\\", "/")
    if not in_scope(rel, cfg.get("src_dir_re") or "src"):
        return {}
    marker_dir = root / ".fallow"
    marker_dir.mkdir(parents=True, exist_ok=True)
    marker_path(root).write_text(rel + "\n", encoding="utf-8")
    return {}


def action_set_mode(root: Path, payload: dict, source: str) -> dict:
    mode = (
        payload.get("composer_mode")
        or payload.get("mode")
        or os.environ.get("FALLOW_COMPOSER_MODE")
        or ""
    )
    mode = str(mode).strip().lower()
    sid = str(
        payload.get("session_id")
        or payload.get("conversation_id")
        or payload.get("conversationId")
        or ""
    ).strip()
    updated_by = source or "set-mode"
    if mode:
        mf = mode_file(root)
        mf.parent.mkdir(parents=True, exist_ok=True)
        mf.write_text(
            f"mode={mode}\nsession_id={sid}\nupdated_by={updated_by}\n",
            encoding="utf-8",
        )
    if is_readonly(mode):
        if source == "sessionStart" or source == "session-start":
            return {
                "env": {"FALLOW_COMPOSER_MODE": "ask"},
                "additional_context": (
                    "Composer is in Ask (read-only) mode. Skip the Fallow quality gate "
                    "and do not run npm run fallow:gate; no edits are possible in this mode."
                ),
            }
        return {"env": {"FALLOW_COMPOSER_MODE": "ask"}}
    if mode:
        return {"env": {"FALLOW_COMPOSER_MODE": mode}}
    if source in ("beforeSubmitPrompt", "prompt"):
        return {"continue": True}
    return {}


def check_git_scope(root: Path) -> bool:
    gate = root / "scripts" / "fallow_gate.py"
    if not gate.is_file():
        return False
    try:
        out = subprocess.check_output(
            [sys.executable, str(gate), "--check-scope"],
            cwd=str(root),
            stderr=subprocess.DEVNULL,
            text=True,
        )
        data = json.loads(out or "{}")
        return bool(data.get("in_scope"))
    except Exception:
        return False


def run_gate(root: Path, agent_source: str) -> tuple[int, str]:
    gate = root / "scripts" / "fallow_gate.py"
    env = os.environ.copy()
    env.setdefault("FALLOW_AGENT_SOURCE", agent_source)
    env.setdefault("FALLOW_SKIP_BINARY_VERIFY", "1")
    try:
        proc = subprocess.run(
            [sys.executable, str(gate)],
            cwd=str(root),
            env=env,
            capture_output=True,
            text=True,
        )
        return proc.returncode, (proc.stdout or "") + (proc.stderr or "")
    except Exception as exc:
        return 1, str(exc)


def summarize_failures(gate_out: str) -> str:
    lines = [
        ln.strip()
        for ln in gate_out.splitlines()
        if ln.strip().startswith("- ")
    ]
    return "; ".join(lines[:12]) or "see gate output"


def stop_gate_common(root: Path, payload: dict, adapter: str) -> tuple[bool, str, int]:
    """Return (should_followup, message, loop_count)."""
    status = str(payload.get("status") or payload.get("terminationReason") or "").lower()
    # Cursor requires completed; others often omit — treat empty as completed.
    if adapter == "cursor" and status and status != "completed":
        return False, "", 0

    mode = (
        str(
            payload.get("composer_mode")
            or payload.get("mode")
            or os.environ.get("FALLOW_COMPOSER_MODE")
            or ""
        )
        .strip()
        .lower()
    )
    if not mode:
        mode = read_saved_mode(root)
    if is_readonly(mode):
        return False, "", 0

    needs = marker_path(root).is_file() or check_git_scope(root)
    if not needs:
        return False, "", 0

    loop_count = payload.get("loop_count")
    if loop_count is None:
        loop_count = payload.get("executionNum") or 0
    try:
        loop_count = int(loop_count)
    except Exception:
        loop_count = 0

    code, out = run_gate(root, adapter)
    if code == 0:
        try:
            marker_path(root).unlink(missing_ok=True)  # type: ignore[call-arg]
        except TypeError:
            # py<3.8
            if marker_path(root).is_file():
                marker_path(root).unlink()
        except Exception:
            pass
        return False, "", loop_count

    failures = summarize_failures(out)
    msg = (
        f"Fallow quality gate failed (loop {loop_count}). Fix these findings without "
        f"raising thresholds, then re-run `npm run fallow:gate` until it passes. "
        f"Failures: {failures}. Follow docs/fallow/remediation.md and the "
        f"fallow-quality-gate skill."
    )
    return True, msg, loop_count


def envelope_stop(adapter: str, follow: bool, msg: str) -> dict:
    if not follow:
        if adapter == "cursor":
            return {}
        if adapter == "antigravity":
            return {"decision": "allow"}
        # Claude / vscode / codex — empty or allow stop
        return {}

    if adapter == "cursor":
        return {"followup_message": msg}
    if adapter == "antigravity":
        return {"decision": "continue", "reason": msg}
    # Claude Code / VS Code Copilot / Codex — common continue pattern
    return {
        "decision": "block",
        "reason": msg,
        "systemMessage": msg,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="fallow-kit shared agent hook runtime")
    parser.add_argument(
        "--adapter",
        required=True,
        choices=("cursor", "vscode", "claude", "codex", "antigravity"),
    )
    parser.add_argument(
        "--action",
        required=True,
        choices=("mark-scope", "set-mode", "stop-gate"),
    )
    parser.add_argument(
        "--mode-source",
        default="",
        help="Hint for set-mode (sessionStart|beforeSubmitPrompt)",
    )
    args = parser.parse_args()

    root = find_root()
    os.chdir(root)
    cfg = load_config(root)
    payload = read_stdin_json()

    if args.action == "mark-scope":
        emit(action_mark_scope(root, payload, cfg))
        return 0

    if args.action == "set-mode":
        emit(action_set_mode(root, payload, args.mode_source or "set-mode"))
        return 0

    follow, msg, _ = stop_gate_common(root, payload, args.adapter)
    emit(envelope_stop(args.adapter, follow, msg))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
