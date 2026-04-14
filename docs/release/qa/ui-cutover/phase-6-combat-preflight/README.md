# Phase 6 combat preflight evidence

- Packet: `P6.0A`
- Objective: Freeze current Outskirts / Ruins / Gate Trial truth surfaces before any visual convergence packet.
- Capture route shape: `/?uiAudit=phase-6-combat&surface=<id>&slot=<slot>&fx=<mode>&controls=0`
- Approved capture pipeline:
  1. `npm run release:phase6-combat-capture`
  2. `npm run release:phase6-combat-evidence-audit`
  3. `npm run release:phase6-combat-preflight`

## Surface folders
- `01-outskirts/`
- `02-ruins/`
- `03-gate-trial/`

## Required legal slots (all three surfaces)
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

## Status
Current status: baseline docs + harness wired; screenshot slots are expected and may be missing until capture is executed.
