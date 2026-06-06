# MP3 Onboarding UI Closeout

## Previous Packet Verification

- MP1 foundation: PASS.
- MP2 gating: PASS.
- MP3 may proceed: YES.
- Evidence: `artifacts/mp3/preflight/onboarding-ui/previous-packet-verification.md`.

## Implemented

- Added Milestone Scroll surface and UI for the active first-life objective.
- Added Unlock Ceremony card surface and host, backed by queued tutorial cards.
- Added Tutorial Ledger drawer with replayed lesson entries, focus-on-open, Escape close, and transient UI state.
- Added route-action adapters that route through existing tab/world/modal owners and keep route guards intact.
- Wired GameLayout to onboarding tab/world policies, active milestone resolution, unlock card dismissal, ledger drawer state, and modal/story/combat suppression.
- Fixed the life-start suppression condition so guidance resumes after life identity is complete.
- Updated onboarding event bridge so the newly active unlock card is queued after first breakthrough.

## Tests And Evidence

- `npm exec tsc -- --project tsconfig.tests.json`: PASS.
- `npm run typecheck`: PASS.
- `npm run check:icons`: PASS.
- `npm run validate:content`: PASS.
- `npm run build`: PASS.
- Targeted onboarding unit/integration suite: PASS, 30 tests.
- MP3 Playwright smoke: PASS, screenshots for Milestone Scroll, Unlock Ceremony, and Tutorial Ledger.
- `npm run test:contracts`: TIMEOUT after 900s on final tree.
- `npm run release:gate:json`: TIMEOUT after 420s on final tree.
- Final command summary: `artifacts/mp3/final/onboarding-ui/final-command-summary.json`.

## Browser Evidence

- `artifacts/mp3/final/onboarding-ui/browser/screenshots/01-milestone-scroll.png`
- `artifacts/mp3/final/onboarding-ui/browser/screenshots/02-unlock-ceremony.png`
- `artifacts/mp3/final/onboarding-ui/browser/screenshots/03-tutorial-ledger.png`
- `artifacts/mp3/final/onboarding-ui/browser/mp3-onboarding-ui.dom.json`

## Decision

Packet-local decision: MP3_GO.

Release decision: NO_GO. Broad release checks do not complete on the final tree; preserve the timeout evidence as a release blocker.
