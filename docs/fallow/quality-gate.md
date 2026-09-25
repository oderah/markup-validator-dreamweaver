# Fallow quality gate (this project)

This document describes how this project keeps JS/TS maintainable with
[Fallow](https://fallow.tools), and how agents and CI are forced to comply.

## Goals (Definition of Done)

After any task that changes in-scope JS/TS (or related webpack/Cypress/package
config), the tree must satisfy:

| Requirement | How it is measured |
|-------------|--------------------|
| No dead code | `fallow dead-code` clean (regression baseline at 0) |
| No dupes / clones | `fallow dupes` clean (`minTokens` 50; Cypress ignored) |
| No large functions / complexity over gates | `fallow health --complexity` clean |
| CRAP ≤ 20 | `health.maxCrap` is **21** (Fallow reports scores **≥** threshold; 21 allows 20.0) |
| No refactoring targets | `fallow health --targets` has no targets |
| No high-risk hotspots | See [High-risk hotspots](#high-risk-hotspots) |
| File maintainability index (MI) ≥ 85 when possible | File scores; 80–84.9 only with a documented exception |
| File MI never &lt; 80 | Hard fail |
| Overall health score ≥ 85 | `fallow health --score --min-score 85` |

**Do not** pass the gate by raising thresholds, widening ignore globs, or saving
baselines that hide new debt.

## Layered enforcement

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Machine truth                                            │
│    .fallowrc.json + npm run fallow:gate                     │
├─────────────────────────────────────────────────────────────┤
│ 2. Agent instruction                                        │
│    .cursor/rules/fallow-quality-gate.mdc (alwaysApply)      │
│    .agents/skills/fallow-quality-gate/SKILL.md              │
├─────────────────────────────────────────────────────────────┤
│ 3. Forced retry (Agent / editable modes only)               │
│    Cursor stop hook → follow-up until gate passes           │
├─────────────────────────────────────────────────────────────┤
│ 4. Merge backstop                                           │
│    CI snippet + optional git pre-commit hook                │
└─────────────────────────────────────────────────────────────┘
```

Soft rules alone are not enough; the **stop hook** and **CI** close the loop.

### Ask / chat mode (read-only)

Do **not** run or loop the Fallow gate in Ask (Cursor may report `ask` or
`chat`). Agents cannot edit files there, so remediation follow-ups are pointless.

Wiring:

| Hook | Script | Role |
|------|--------|------|
| `sessionStart` | `.cursor/hooks/fallow-session-mode.sh` | Records composer mode; injects skip context + `FALLOW_COMPOSER_MODE=ask` |
| `beforeSubmitPrompt` | `.cursor/hooks/fallow-prompt-mode.sh` | Refreshes mode on Ask ↔ Agent switches mid-session |
| `stop` | `.cursor/hooks/fallow-stop-gate.sh` | Exits without follow-up when mode is `ask` / `chat` |

Mode is persisted under `.fallow/composer-mode` for the stop hook when the stop
payload omits `composer_mode`. The always-apply Cursor rule and skill also tell
agents not to invoke `npm run fallow:gate` in Ask/chat.

## Commands

```bash
# Full gate (agents, CI, pre-commit)
npm run fallow:gate

# Lighter legacy check (dead-code + dupes + complexity only)
npm run fallow

# Install optional git pre-commit backstop
npm run fallow:install-git-hook
```

Gate implementation: [`scripts/fallow_gate.py`](../../scripts/fallow_gate.py).

Environment (agents):

```bash
export FALLOW_AGENT_SOURCE=cursor
export FALLOW_SKIP_BINARY_VERIFY=1   # optional; speeds CI/agent runs
```

## Scope

| Touched paths | Gate required? |
|---------------|----------------|
| `./**`, `*.js` / `*.jsx` / `*.ts` / `*.tsx` at repo tooling roots, `webpack.config.js`, `cypress/**`, `package.json`, `.fallowrc.json` | Yes |
| Backend-only, docs-only (except this policy), migrations | No |

The Cursor stop hook skips follow-up when no in-scope files are dirty or staged,
and always skips remediation follow-ups in Ask/chat (read-only) mode.

## High-risk hotspots

Fallow’s hotspot **list** can be non-empty while `vital_signs.hotspot_count` is
still `0` (informational churn×complexity ranking).

This project treats **high-risk hotspots** as failures when any of:

1. `vital_signs.hotspot_count > 0` (Fallow’s gated hotspot vital sign), or
2. Any scored file has CRAP risk (`crap_max`) **≥ 30** (Fallow “high” risk band), or
3. Any hotspot entry has **score ≥ 40** and that file’s `crap_max` **≥ 15**
   (high churn attention on at least moderate CRAP risk).

Informational low-CRAP churn files may remain on the hotspot list without
failing the gate.

## Overall health score

The gate uses:

```bash
fallow health --score --min-score 85
```

Fallow’s plain `--score` path omits the churn-backed hotspot **penalty** from the
aggregate (hotspot risk is gated separately above). That matches Fallow’s CI
guidance and avoids double-counting.

## File MI floors and exceptions

- **MI &lt; 80** → always fail.
- **80 ≤ MI &lt; 85** → fail unless the path is listed in
  [`.fallow/mi-floor-exceptions.json`](../../.fallow/mi-floor-exceptions.json)
  with a short `reason` explaining why 85 is not attainable without harmful
  churn.
- **MI ≥ 85** → pass.

Agents must prefer raising MI to ≥ 85 over adding exceptions. New exceptions
require a clear reason and should be rare.

## Config knobs (`.fallowrc.json`)

| Key | Value | Meaning |
|-----|-------|---------|
| `health.maxCyclomatic` | 20 | Cyclomatic ceiling |
| `health.maxCognitive` | 15 | Cognitive ceiling |
| `health.maxCrap` | 21 | Allows CRAP ≤ 20 |
| `health.maxUnitSize` | 60 | Large-function ceiling (lines) |
| `duplicates.minTokens` | 50 | Clone detection sensitivity |
| `regression.baseline.*` | 0 | Dead-code regression floor |

Test/Cypress paths are ignored for health complexity; Cypress is ignored for
dupes. Add project-specific `ignorePatterns` only when a path is truly out of
graph scope — never to hide debt.

## Agent workflow

Skip this workflow entirely in **Ask / chat** mode (read-only).

1. Implement the task using existing project patterns.
2. If in-scope files changed, run `npm run fallow:gate`.
3. On failure, fix with real refactors/tests (see
   [remediation.md](./remediation.md)). Follow the Fallow skill for
   `dead-code` / `dupes` / `fix` (dry-run before `fix --yes`).
4. Re-run the gate until exit 0.
5. Mention gate status in the final reply.

If the Cursor stop hook fires a follow-up, treat it as mandatory: do not claim
completion until the gate is green.

## CI and git

- **CI**: paste steps from `docs/fallow/ci-snippet.yml` (if installed via
  `--with-ci-snippet`) into your workflow so `npm run fallow:gate` runs after
  install.
- **Git (optional)**: `npm run fallow:install-git-hook` installs a pre-commit
  hook that runs the gate when staged files are in scope.

## Related files

| Path | Role |
|------|------|
| `docs/fallow/quality-gate.md` | This policy |
| `docs/fallow/remediation.md` | How to fix findings |
| `scripts/fallow_gate.py` | Gate checker |
| `scripts/install_fallow_git_hook.sh` | Pre-commit installer |
| `.fallow/mi-floor-exceptions.json` | MI 80–84.9 allowlist |
| `.cursor/rules/fallow-quality-gate.mdc` | Always-on agent DoD |
| `.agents/skills/fallow-quality-gate/SKILL.md` | Remediation skill |
| `.cursor/hooks.json` + `.cursor/hooks/*` | Mode tracking, edit markers, stop gate |
| `.cursor/commands/fallow-gate.md` | Manual slash command |
