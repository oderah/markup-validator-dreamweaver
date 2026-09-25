---
description: Run the Fallow quality gate and remediate until green
---

1. Run `npm run fallow:gate`.
2. If it fails, follow `docs/fallow/remediation.md` and fix findings with real refactors/tests (do not raise thresholds).
3. Re-run until exit 0.
4. Summarize what failed and what you fixed.
