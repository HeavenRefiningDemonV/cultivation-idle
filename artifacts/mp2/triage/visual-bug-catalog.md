# MP2 Visual Bug Catalog

## High Priority

### Ruins Exact
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-101-ruins-ruins.png`
- Issue: central scene is an almost empty parchment field; lower route and Enter Ruins action are clipped by the bottom navigation at laptop viewport.
- MP2 action: local exact-screen CSS only; preserve existing Ruins architecture and add stronger chamber/route ownership without importing destructive replacement art.

### Gate Trial Exact
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-102-gate-trial-gate-trial.png`
- Issue: Trial Summary overlaps the recommended/fail-safe rail; cost/reserve and next-fix text become visually noisy; CTA region is crowded.
- MP2 action: compact exact-screen grid for laptop height and prevent the summary dock from overlaying the right rail.

### Techniques Exact
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-014-techniques-techniques.png`
- Issue: three-column exact layout is too tall/wide for 1366x768; slot cards overlap, inspector rows clip, and bottom navigation covers the page.
- MP2 action: add constrained-desktop responsive mode and guided empty-library copy; keep altar/Inner Palace identity.

### Prestige Ledger
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-016-prestige-prestige.png`
- Issue: current ledger rows, decree, forecast, and reset contract overlap at laptop viewport; +0 AP truth exists but reads visually broken.
- MP2 action: compact the exact ledger for laptop width/height and make lower panels scroll/fit without changing AP math.

## Medium Priority

### Inventory First Run
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-013-inventory-inventory.png`
- Issue: empty grid and inspector guidance do not provide a direct first-source route.
- MP2 action: add central guided empty-state overlay with concrete first sources and route buttons.

### Status Ledger
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-011-status-status.png`
- Issue: duplicate Pouch Fit warnings add diagnosis-wall feel.
- MP2 action: collapse if local and safe; otherwise document partial with evidence.

## Low Priority / Evidence-Only

### Outskirts
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-100-outskirts-outskirts.png`
- Issue: some top tactical cells truncate defaults, but the module role and CTA are visible.
- MP2 action: preserve unless touched by shared exact-shell fixes.

### Support Modules
- Evidence: `artifacts/mp2/baseline/current-screenshots/1366x768/SS-104-apothecary-apothecary.png`, `SS-105-forge-forge.png`, `SS-106-bounties-bounties.png`, `SS-107-expeditions-expeditions.png`
- Issue: no reachability blocker found; minor copy/spacing debt only.
- MP2 action: evidence matrix and deferral where appropriate.
