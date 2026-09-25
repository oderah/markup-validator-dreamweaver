Post-init (or anytime) bring-the-repo-into-compliance loop. Editable modes only — refuse Ask/chat.

1. Ensure `fallow` is available (`npm i -D fallow` if missing). Set `FALLOW_AGENT_SOURCE` for your agent host (`cursor`, `vscode`, `claude`, `codex`, or `antigravity`).
2. Run `npm run fallow:gate` and capture failures.
3. If it fails, read `.agents/skills/fallow-quality-gate/SKILL.md` and `docs/fallow/remediation.md`. Fix with real refactors/tests until the gate is green. Never raise `.fallowrc.json` thresholds or baseline away debt. Use a dedicated branch if the tree has unrelated WIP.
4. Once there is a meaningful remediation diff (or the gate is already green), read `.agents/skills/fallow-review/SKILL.md` and run the agent-contract loop (`fallow review --walkthrough-guide` → judgments → `--walkthrough-file`) against the cleanup base (default merge-base / `origin/main`). Apply only consequential structural follow-ups.
5. Re-run `npm run fallow:gate` until exit 0.
6. Summarize gate findings fixed vs structural review decisions.
