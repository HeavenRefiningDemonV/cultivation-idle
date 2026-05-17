# Techniques Exact QA

This folder records the P0 browser evidence for the additive Techniques exact main tab.

- `techniques-exact-fixture-2048x1152.png`: fixture route at `?techniquesExactMode=fixture`.
- `techniques-exact-fixture-interacted-2048x1152.png`: fixture after loadout, AI, casting, slot, and technique selection.
- `techniques-exact-browser-qa.json`: DOM and interaction checks, including bottom nav presence, no legacy Techniques panel, fixed slot geometry, details modal mount, and Manual Pavilion route.

Release capture scripts were not added in this pass. The browser QA was run directly with Playwright against the local Vite server so the exact screen, interaction states, and Manual Pavilion handoff have concrete evidence without adding a non-reused script suite.
