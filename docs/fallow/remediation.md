# Fallow remediation playbook (this project)

Use this when `npm run fallow:gate` fails. Prefer real fixes over suppressions.
Never raise `.fallowrc.json` thresholds or save baselines to “pass.”

## Agent command conventions

```bash
export FALLOW_AGENT_SOURCE=cursor
export FALLOW_SKIP_BINARY_VERIFY=1

# JSON for parsing (always append || true — exit 1 means findings)
fallow dead-code --format json --quiet 2>/dev/null || true
fallow dupes --format json --quiet 2>/dev/null || true
fallow health --complexity --format json --quiet 2>/dev/null || true
fallow health --targets --format json --quiet 2>/dev/null || true
fallow health --hotspots --format json --quiet 2>/dev/null || true
fallow health --file-scores --format json --quiet 2>/dev/null || true
fallow health --score --format json --quiet 2>/dev/null || true
```

Always `--dry-run` before `fallow fix`, then `fallow fix --yes`.

## Dead code

1. Trace before delete: `fallow dead-code --trace path:export`.
2. Remove unused exports/files/deps only when the trace confirms no live use.
3. Dynamic imports may need `ignoreDependencies` / entry-point config — ask before
   broadening ignores.

## Dupes / clones

1. `fallow dupes --trace dup:<fingerprint>`.
2. Extract a small shared helper next to existing siblings (KISS; no god-utils).
3. Do not “fix” by raising `minTokens`.

## Complexity / large functions / CRAP

1. Split by SRP: pure helpers, subcomponents, focused hooks.
2. Prefer existing project factories/patterns for CRUD and data fetching; keep
   hand-rolled code only when the shape does not fit.
3. CRAP depends on coverage × complexity:
   - Prefer lowering cyclomatic complexity, and/or
   - Add focused unit tests near `.`.
4. **Coverage caveat:** a narrow test runner `--coverage` run overwrites
   `coverage/` and can spike CRAP on untouched modules. Prefer coverage that
   includes the modules under edit, or restore broader coverage before
   re-running the gate.

## Refactoring targets / hotspots

1. `fallow health --targets` — empty is required.
2. High-risk hotspots (see quality-gate.md): reduce complexity on churned files
   or add tests; do not ignore informational low-CRAP churn alone.

## File maintainability index (MI)

| MI | Action |
|----|--------|
| ≥ 85 | Done |
| 80–84.9 | Raise toward 85 if cheap; else add `.fallow/mi-floor-exceptions.json` entry with `reason` |
| &lt; 80 | Must refactor until ≥ 80 (exceptions not allowed) |

Tactics: extract helpers to sibling modules, reduce branching, shrink fan-out,
delete dead paths.

## Overall score &lt; 85

Run `fallow health --score --format json` and inspect `penalties`. Typical
drivers: `unit_size`, `coupling`. Shrink very large functions and high
fan-out modules.

## After fixes

```bash
npm run fallow:gate
```

Exit 0 is required before claiming the task complete.
