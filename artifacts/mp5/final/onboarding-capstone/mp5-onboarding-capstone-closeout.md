# MP5 Onboarding Capstone Closeout

Generated: 2026-05-30
Active packet: Mega Prompt 5 - Gate Trial, Foundation Graduation, and Existing Save Behavior

## Verdict

- Previous packets verified before edits: YES.
- MP5 targeted onboarding capstone: GO.
- Full release readiness: NO_GO.

## Implemented

- Prevented the Foundation graduation card from appearing when the Gate Trial merely resolves M9 and activates M10.
- Kept the graduation card tied to actual Foundation breakthrough / M10 completion, and prevented already-complete or later-life saves from replaying it.
- Hardened v2.1.0 onboarding migration so Foundation+ saves with logically stale tutorial state are re-inferred as onboarding complete instead of preserving M0/M1 gates.
- Preserved owner boundaries: onboarding reacts to gate and breakthrough events; Gate Trial, CombatStore, RewardService, and progression owners still perform their own domain logic.

## Files changed for MP5

- `src/systems/onboarding/onboardingEventBridge.ts`
- `src/save/migrations/steps/v2_1_0/backfillOnboardingState.ts`
- `tests/integration/onboardingGateGraduation.test.ts`
- `tests/integration/onboardingExistingSave.test.ts`
- `artifacts/mp5/preflight/onboarding-capstone/*`
- `artifacts/mp5/implementation/onboarding-capstone/*`
- `artifacts/mp5/final/onboarding-capstone/*`

Note: the live checkout was already dirty and many onboarding files are still untracked from earlier packet work. This packet did not revert or clean unrelated work.

## TDD evidence

- RED compile: `npm exec tsc -- --project tsconfig.tests.json` passed after adding tests; no compile errors. Log: `artifacts/mp5/implementation/onboarding-capstone/logs/mp5-new-tests.red-tsconfig.log`.
- RED behavior: new MP5 tests failed as expected. Log: `artifacts/mp5/implementation/onboarding-capstone/logs/mp5-new-tests.red.log`.
  - Gate clear queued `card_foundation_graduation` too early.
  - Already-complete onboarding replayed the graduation card.
  - Foundation save with stale onboarding state preserved `M0_life_start`.
- GREEN: new MP5 tests passed after implementation. Log: `artifacts/mp5/implementation/onboarding-capstone/logs/mp5-new-tests.green.log`.

## Verification

See `artifacts/mp5/final/onboarding-capstone/final-command-summary.json`.

| Command | Result |
|---|---:|
| `npm exec tsc -- --project tsconfig.tests.json` | PASS |
| targeted onboarding suite including MP5 tests | PASS, 37 tests |
| `npm run typecheck` | PASS |
| `npm run check:icons` | PASS |
| `npm run validate:content` | PASS |
| `npm run build` | PASS |
| `npx playwright test tests/e2e/mp3-onboarding-ui-smoke.spec.ts --project=chromium` | PASS |
| `npm audit --audit-level=moderate --json` | PASS |
| onboarding reward-grant static scan | PASS_NO_MATCHES |
| Gate Trial direct-breakthrough static scan | PASS_NO_MATCHES |
| `npm run test:contracts` | TIMEOUT after 420s |
| `npm run release:gate:json` | FAIL / NO_GO |

## Acceptance checklist

- Gate defeat keeps M9 active: PASS, covered by existing targeted flow.
- Gate clear/bypass completes M9 and activates M10: PASS, covered by targeted flow and MP5 gate graduation tests.
- M10 routes to Cultivation: PASS, existing M10 surface target remains Cultivation.
- Foundation breakthrough completes M10: PASS, covered by MP5 gate graduation tests.
- Graduation card appears exactly once after Foundation breakthrough, not after Gate clear: PASS.
- Existing Foundation+ saves do not regress into first-life gates: PASS, covered by MP5 migration test.
- Second life / already-complete onboarding does not replay the full graduation card: PASS.
- No duplicate reward grants or direct Gate Trial breakthrough: PASS static scans; onboarding code has no `RewardService.grantRewards`, and Gate Trial exact has no direct breakthrough call.
- No exact-screen layout changes: PASS.
- No forbidden public labels added by MP5: PASS by scope and focused tests.

## Browser / visual evidence

- Dedicated in-app Browser tooling was unavailable through tool discovery.
- Playwright fallback passed: `npx playwright test tests/e2e/mp3-onboarding-ui-smoke.spec.ts --project=chromium`.
- This packet did not change exact-screen layout or SCSS.

## Broad release blockers

- `npm run test:contracts` did not return a verdict within the controlled 420s wrapper and was killed with process-tree cleanup. This remains a broad-suite blocker, not a targeted MP5 failure.
- `npm run release:gate:json` completed with `NO_GO`: 2 unresolved blockers, 1 pending manual check, and 5 untracked/unaccepted waiver candidates.
- Release gate failed on full test suite and pending manual fresh-run coverage; build/content/type/icon checks passed.

## Deferred items

- Full release signoff remains blocked until broad test suite behavior and manual fresh-run coverage are resolved.
- Dedicated Browser evidence remains unavailable in this environment; Playwright fallback evidence is present.

## Risk notes

- The migration hardening intentionally re-infers advanced realm saves only when a preservable onboarding slice would replay first-life gates. Valid completed onboarding state is still preserved.
- Graduation card queueing now skips M10 activation from Gate resolution and queues M10 only when M10 itself completes.
