# Whole Menu Polish Audit

Date: 2026-05-08
Branch: `codex/whole-menu-polish`

## Screenshot Evidence Reviewed

| Screen | Before evidence |
| --- | --- |
| Inventory | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190455.png` |
| Status | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190439.png` |
| Ruins | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190340.png` |
| Outskirts | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190323.png` |
| World | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190450.png` |
| Forge | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190353.png` |
| Cultivation | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190420.png` |
| Techniques | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190501.png` |
| Apothecary | `C:/Users/abdul/Pictures/Screenshots/Screenshot 2026-05-08 190310.png` |

The black browser fullscreen toast in several screenshots was ignored.

## Baseline Notes And Plan

| Screen | Current issue | Visual target | Likely touched files | Risk |
| --- | --- | --- | --- | --- |
| Inventory | Dark modern slot slab and blank right inspector feel out of family. | Pocket-realm parchment storage with intentional ink tray and seal empty state. | `src/components/screens/InventoryScreen.scss` | Medium: visual only. |
| Techniques | Owned Techniques empty board reads like missing content; filter label uses a glyph mark. | Inner Palace ledger with intentional empty seal/action and stronger panel framing. | `src/components/screens/TechniqueLibraryScreen.tsx`, `src/components/screens/TechniqueLibraryScreen.scss`, `src/components/techniques/InnerPalaceEquipAltar.scss` | Medium: visual/markup only. |
| Status | Narrow central stack leaves desktop side space unused and hides the main diagnosis hierarchy. | Broad diagnostic command ledger where next action and shortfall are immediately visible. | `src/components/screens/StatusScreen.scss` | Low: layout only. |
| Cultivation | Strong center, but side rails can feel pasted on and crowded. | Preserve ritual center, soften rails and improve command/nav clearance. | `src/components/screens/CultivateScreen.scss` | Low: visual only. |
| World | Scenic map is strong; labels are raw green glowing rectangles and inspector needs anchoring polish. | Parchment/jade map labels with no layout shift and clearer world anchoring. | `src/components/screens/CityMapHub.tsx`, `src/components/screens/CityMapHub.scss`, `src/components/screens/WorldScreen.scss` | Medium: map routing must remain unchanged. |
| Ruins | Center scenic stage reads blank/deferred, with a dark bar feeling like a placeholder. | Visible sealed chamber/root-mouth underpaint using CSS and existing chrome, no gameplay changes. | `src/features/world/ruinsExact/RuinsExactMockupScreen.scss` | Medium: exact layout must stay stable. |
| Outskirts | Center field is slightly washed and right rail is visually dense. | Stronger open-route contrast and quieter support rail. | `src/features/world/outskirts/OutskirtsExactMockupScreen.scss` | Low: exact CSS only. |
| Forge | Strong screen, needs minor bottom CTA/floor alignment and rail readability checks. | Preserve workshop owner with stable CTA/floor rhythm. | `src/features/professions/forgeExact/ForgeExactScreen.scss` | Low. |
| Apothecary | Strong screen, needs minor bottom CTA/nav breathing and top strip balance checks. | Preserve scenic room and prescription hierarchy. | `src/features/apothecary/exact/ApothecaryExactScreen.scss` | Low. |
| Gate Trial | To be checked if reachable in Browser/release capture. | Preserve ritual threshold exact surface. | `src/features/world/gateTrialExact/*` only if needed. | Low unless clipped. |

## Guardrails

- Gameplay, balance, rewards, reset, inventory item logic, and combat logic must remain untouched.
- Prestige is not part of this pass except shared shell/nav verification.
- No external art or image generation.
- Empty states receive an in-theme seal, one sentence, and one clear route/action.

## After Captures

Browser QA was performed with the in-app browser against the local Vite dev server. The requested 2048x1152 browser capture path timed out in the in-app capture bridge, so these are the closest stable desktop captures produced by the Browser tool. The screenshots below were saved after clearing onboarding/migration overlays; the black fullscreen browser toast was ignored wherever it appeared during manual review.

| Screen | After evidence | Notes |
| --- | --- | --- |
| Cultivation | `docs/release/menu-polish/after-cultivation.png` | Center ritual remains dominant; side rails and command deck are calmer. |
| Status | `docs/release/menu-polish/after-status.png` | Best Next Action is promoted above the diagnostic grid; desktop width is used more fully. |
| World | `docs/release/menu-polish/after-world.png` | Building labels use parchment/jade seal treatment. |
| Inventory | `docs/release/menu-polish/after-inventory.png` | Dark void slab converted to a framed pocket-realm ink tray with parchment inspector. |
| Techniques | `docs/release/menu-polish/after-techniques.png` | Empty Owned Techniques state now has an intentional seal/action. |
| Prestige regression check | `docs/release/menu-polish/after-prestige.png` | Prestige still renders as the ledger page after shared polish. |
| Apothecary | `docs/release/menu-polish/after-apothecary.png` | Scenic room/prescription composition preserved. |
| Outskirts | `docs/release/menu-polish/after-outskirts.png` | Center route field has stronger focus/contrast; CTA remains dominant. |

Additional exact evidence:

- `docs/release/qa/ui-cutover/apothecary-exact/p0-freeze/01-fixture.html`
- `docs/release/qa/ui-cutover/apothecary-exact/p0-freeze/01-fixture.dom.json`
- `docs/release/qa/ui-cutover/apothecary-exact/p0-freeze/01-fixture.png`

Forge, Ruins, and Gate Trial were not successfully captured through normal World routing in this Browser session. The clean test save kept the contextual inspector on the recommended Apothecary route after selecting Forge/Ruins, and the phase-6 release capture slots for combat exact surfaces are missing their existing evidence files. Ruins is still covered by the source-level visual guard added in this patch.

## Files Touched

| Area | Files |
| --- | --- |
| Audit and guard tests | `docs/release/menu-polish-audit.md`, `tests/contracts/menuPolishVisualGuard.test.ts` |
| Inventory | `src/components/screens/InventoryScreen.scss` |
| Techniques | `src/components/screens/TechniqueLibraryScreen.tsx`, `src/components/screens/TechniqueLibraryScreen.scss`, `src/components/techniques/InnerPalaceEquipAltar.scss` |
| Status | `src/components/screens/StatusScreen.tsx`, `src/components/screens/StatusScreen.scss` |
| Cultivation | `src/components/screens/CultivateScreen.scss` |
| World map | `src/components/screens/CityMapHub.tsx`, `src/components/screens/CityMapHub.scss` |
| Exact modules | `src/features/world/outskirts/OutskirtsExactMockupScreen.scss`, `src/features/world/ruinsExact/RuinsExactMockupScreen.scss`, `src/features/professions/forgeExact/ForgeExactScreen.scss`, `src/features/apothecary/exact/ApothecaryExactScreen.scss` |
| Generated evidence | `docs/release/qa/ui-cutover/apothecary-exact/p0-freeze/01-fixture.html`, `docs/release/qa/ui-cutover/apothecary-exact/p0-freeze/01-fixture.dom.json`, `docs/release/qa/ui-cutover/apothecary-exact/p0-freeze/apothecaryExactP0CaptureAttempt.json`, `docs/release/menu-polish/*.png` |

## Verification

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm run check:icons` | Passed; no emoji icon usage found. |
| `npm run validate:content` | Failed on Windows shell syntax: `NODE_OPTIONS` POSIX assignment is not recognized. |
| `$env:NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs'; node --experimental-strip-types scripts/validateContent.ts` | Passed. |
| `npm run test` | Failed on Windows shell syntax at the final `NODE_OPTIONS='...' node --test ...` step. |
| Windows direct full test batches | Began successfully; stopped after 116 passes / 1 fail in `tmp-tests/tests/contracts/cityPackageRegistry.test.js`. Failure is an existing contract expectation mismatch for extra `phaseRole` and `expeditionEmphasis` fields, outside touched files. |
| Focused visual guard: `node --test tmp-tests/tests/contracts/menuPolishVisualGuard.test.js` after `tsconfig.tests.json` build | Passed, 5/5. |
| `npm run build` | Passed. Vite retained pre-existing warnings about large chunks, stale Browserslist data, and unresolved runtime `InsideDungeon.png` reference. |
| `npm run release:apothecary-exact-p0:audit` | Passed. |
| `npm run release:outskirts-exact-p0:audit` | Failed on Windows shell syntax through nested POSIX `NODE_OPTIONS`. |
| Direct Outskirts evidence audit | Failed because phase-6 required evidence files are missing under `docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/`. |
| `npm run release:ruins-exact-p0:audit` | Failed on Windows shell syntax through nested POSIX `NODE_OPTIONS`. |
| Direct Ruins evidence audit | Failed because phase-6 required evidence files are missing under `docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/`. |
| `npm run release:gate-trial-exact-p0:audit` | Failed because phase-6 Gate Trial evidence files and DOM audit files are missing. |
| Direct `release:gate` equivalent | Failed with existing release gate blockers across build/content/fresh-run/migration/balance/route/runtime/vocab/full-suite checks. |
| `git diff --check` | Passed; only line-ending warnings from Git on Windows. |
| Diff-scoped source/runtime security pattern scan | Passed; no changed source/runtime matches for secrets, direct network calls, eval, `innerHTML`, storage, or cookie sinks. |

## Deferred Items

- Full 2048x1152 Browser screenshots: the in-app screenshot bridge timed out at that exact size. Stable desktop screenshots were captured instead.
- Forge/Ruins/Gate Trial direct Browser captures: normal clean-save World routing did not expose those exact module open actions during the QA pass, and the existing phase-6 release evidence slots are missing. The CSS/source changes are covered by guard tests and build/typecheck.
- Full test suite: the package script is not Windows-portable because of POSIX `NODE_OPTIONS`; the direct batch workaround revealed an unrelated existing `cityPackageRegistry` contract mismatch.
- Release gate: still blocked by existing release evidence/report blockers unrelated to this visual polish patch.
- CodeRabbit: CLI was not installed locally, and this Windows shell does not provide `sh` for the documented installer path.
- Sentry: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` were not configured in this environment, so no read-only Sentry query was run.
