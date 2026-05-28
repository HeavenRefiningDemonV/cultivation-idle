# Proposed Fix Packets

## CI-P0-READINESS-GATES

Goal: Make current readiness gates deterministic and either green or explicitly waived with evidence.

Priority: P0

Likely files:
- `scripts/release/*`
- `tests/helpers/release/*`
- `tests/helpers/balance/*`
- `docs/release/known_issues.md`

Hard scope:
- No gameplay tuning.
- No UI redesign.
- Only repair acceptance tooling or update gate contracts with explicit evidence-backed waivers.

Implementation requirements:
- Resolve `release:gate:json` NO_GO blockers.
- Preserve focused path/gate/city/prestige/offline contracts.
- Explain every accepted waiver in docs/release.

Tests to run:
- `npm run release:gate:json`
- `npm run release:fresh-run-report:json`
- `npm run balance:report:json`
- `npm run release:route-report:json`
- `npm run release:reclaim-route-report`

Acceptance criteria:
- Either release gate is GO or every non-GO item is intentionally documented as not blocking story/tutorial.

## CI-P0-LIFESTART-TRUTH

Goal: Ensure one life does not mechanically progress before path, Heart Law, and breath are complete.

Priority: P0

Likely files:
- `src/components/modals/LifeStartWizardModal.tsx`
- `src/stores/gameStore.ts`
- `src/systems/gameLoop.ts`
- tests under `tests/contracts/` or `tests/e2e/`

Hard scope:
- Do not rebalance numbers.
- Do not redesign the life-start art direction.
- Do not change path/Heart Law effect formulas.

Implementation requirements:
- Decide whether cultivation ticking is paused or explicitly pre-life.
- Disable or explain Break Through before identity completion.
- Make selected Heart Law and selected Breath have clear confirmation affordances.
- Add a browser or contract test that fresh save cannot navigate/progress into contradictory state.

Tests to run:
- `npm run typecheck`
- targeted life-start contract test
- fresh-save browser smoke

Acceptance criteria:
- Fresh save cannot show `No Path selected` with Breakthrough Ready as if a life is active.
- Completing life-start sets path, Heart Law, breath, and removes the wizard.

## CI-P0-TESTS

Goal: Restore reliable campaign contract test execution on Windows.

Priority: P0

Likely files:
- `package.json`
- `scripts/buildProgressionFixtures.ts`
- `tsconfig.tests.json`
- `tests/contracts/trialLifecycle.test.ts`
- content fixture helpers

Hard scope:
- No production behavior changes except test utilities if unavoidable.

Implementation requirements:
- Fix `tmp-progression-fixtures` write failure.
- Fix trial lifecycle pavilion manifest fixture shape.
- Keep direct compiled test path documented for Windows.

Tests to run:
- `npm run test:contracts`
- `npm exec tsc -- --project tsconfig.tests.json`
- direct compiled P0/trial lifecycle tests

Acceptance criteria:
- Full contract runner starts and completes deterministically.
- Trial lifecycle tests no longer fail on fixture bootstrap.

## CI-P0-CAP-ROUTE

Goal: Resolve the fresh-run content cap mismatch.

Priority: P0

Likely files:
- `tests/helpers/release/runFreshSaveRoute.ts`
- progression route helpers
- content cap constants/docs

Hard scope:
- Do not rebalance route numbers until target cap is agreed.
- Do not hide a real progression blocker by lowering acceptance without design approval.

Implementation requirements:
- Determine if current playable cap is Soul Formation or Spirit Severing.
- If Spirit Severing is intended, repair route progression to reach it.
- If Soul Formation is intended, update the cap contract and docs.

Tests to run:
- `npm run release:fresh-run-report:json`
- `npm run release:gate:json`

Acceptance criteria:
- Fresh-run acceptance and content cap truth agree.

## CI-P1-UI-RUNTIME-SMOKE

Goal: Add a stable browser smoke that captures fresh-save main screens and core modules.

Priority: P1

Likely files:
- `tests/e2e/*`
- `scripts/release/*capture*`
- screen owners under `src/features/*`

Hard scope:
- Test/capture harness only unless a blocker is found.

Implementation requirements:
- Complete life-start through accessible selectors.
- Visit Status, Cultivation, World, Inventory, Techniques, Records, Prestige, Settings.
- Visit World modules: Outskirts, Ruins, Gate Trial, Manual Pavilion, Apothecary, Forge, Bounties, Expeditions.
- Assert no modal overlay blocks nav after life-start.

Tests to run:
- Playwright e2e smoke
- `npm run typecheck`

Acceptance criteria:
- Screenshots and DOM summaries exist for every required screen.
- Core CTAs are visible and not clipped at laptop and desktop viewports.

## CI-P1-BALANCE-HARNESS

Goal: Restore timing probes and regenerate balance measurements before tuning.

Priority: P1

Likely files:
- `tests/helpers/balance/runPhaseTimingProbe.ts`
- `tests/helpers/balance/*`
- `scripts/release/*route*`

Hard scope:
- No number changes yet.

Implementation requirements:
- Explain why `foundation_entry` is missing.
- Restore route, reclaim, and balance reports.
- Emit key milestone timing table.

Tests to run:
- `npm run balance:report:json`
- `npm run release:route-report:json`
- `npm run release:reclaim-route-report`

Acceptance criteria:
- First gate, first prestige, and second-life reclaim can be measured.

## CI-P1-SECURITY-DEPS

Goal: Address dependency audit findings without destabilizing Vite/React build.

Priority: P1

Likely files:
- `package.json`
- `package-lock.json`

Hard scope:
- Dependency updates only.
- No gameplay changes.

Implementation requirements:
- Update or override vulnerable dependency ranges.
- Verify Vite dev server and production build.

Tests to run:
- `npm audit --audit-level=moderate`
- `npm run typecheck`
- `npm run build`

Acceptance criteria:
- npm audit no longer reports the current high/moderate advisories, or residual advisories are documented with rationale.
