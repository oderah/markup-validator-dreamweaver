---
name: fallow-quality-gate
description: >-
  Run and remediate the Fallow quality gate after JS/TS changes. Use when
  finishing a task, when npm run fallow:gate fails, when the Cursor stop hook
  requests a Fallow fix, or when asked to restore maintainability (dead code,
  dupes, complexity, CRAP, MI, health score, hotspots, targets). Do not use in
  Ask/chat (read-only) mode.
---

# Fallow quality gate skill

## When to use

- After editing JS/TS under `.` or related tooling (Agent / Plan modes
  that can write files).
- When `npm run fallow:gate` fails.
- When a Cursor stop follow-up demands a Fallow gate fix.

## When not to use

- **Ask / chat (read-only) mode**: do not run the gate or remediation loop.
  The session cannot apply fixes; the Cursor stop hook skips follow-ups.

## Required reading

- `docs/fallow/quality-gate.md`
- `docs/fallow/remediation.md`
- Installed Fallow CLI skill (agent rules for JSON/`|| true`/`fix --dry-run`)

## Procedure

1. `npm run fallow:gate`
2. If exit ≠ 0, parse failures and fix with real refactors/tests.
3. Re-run until exit 0.
4. Never raise thresholds or baseline away new debt.
5. For MI 80–84.9 only: add `.fallow/mi-floor-exceptions.json` with a reason if
   85 is truly unattainable; MI &lt; 80 must be fixed.

## Commands

```bash
export FALLOW_AGENT_SOURCE=cursor
export FALLOW_SKIP_BINARY_VERIFY=1
npm run fallow:gate
```

For investigation, use JSON forms in `docs/fallow/remediation.md`.
