# Dao Mandate V2-8 Local Omen Lens Evidence

## Scope
- Packet: V2-8 - Local Omen Lens rewrite and World quiet rule.
- Goal: Replace points-elsewhere copy with silent quiet state and meaningful local stamps.
- Non-goals honored: no V2-9 source drawers, no V2-10 Prestige silence, no gameplay mutation.

## Previous packet preflight
- V2-0: PASS. Checked `AGENTS.md` and `docs/release/dao_mandate_v2_test_inventory.md`.
- V2-1: PASS. Checked projection types, builder, fixtures, contract, exports, and evidence doc.
- V2-2: PASS. Checked direct-route/copy files, direct-route/copy guard contracts, and evidence doc.
- V2-3: PASS. Checked retired Guidance Oath compatibility, settings contract, and evidence doc.
- V2-4: PASS. Checked shared Omen components, token styles, purity scans, and evidence doc.
- V2-5: PASS. Checked Status V2 sparse layout contract and evidence doc.
- V2-6: PASS. Checked Cultivation compact Omen contract and evidence doc.
- V2-7: PASS. Checked Gate Trial detail ownership contract and evidence doc.
- Notes on uncommitted prior-packet files: V2-7 Gate Trial files, `tests/contracts/gateTrialDetailOwnershipContract.test.ts`, and `docs/release/dao_mandate_v2_7_gate_trial_detail_ownership_evidence.md` were already unstaged/untracked before V2-8 edits. V2-8 preserved them; the only V2-8 edit in Gate Trial was a copy-only `support route` to `support source` cleanup caught by visual smoke.

## Files changed
- `src/systems/ui/daoMandate/daoMandateTypes.ts`
- `src/systems/world/localMandateLensSurface.ts`
- `src/systems/ui/daoMandate/daoMandateSourceMap.ts`
- `src/ui/daoMandate/LocalMandateLensHeader.tsx`
- `src/ui/daoMandate/LocalMandateLensHeader.scss`
- `src/ui/daoMandate/DaoMandateComponentSpecimens.tsx`
- `src/components/screens/WorldScreen.tsx`
- `src/systems/ui/world/worldModuleRoutingSurface.ts`
- `src/systems/world/moduleRoleBannerSurface.ts`
- `src/ui/world/ModuleRoleBanner.tsx`
- `src/features/world/gateTrialExact/buildGateTrialExactSurface.ts` copy-only route-label cleanup.
- `tests/contracts/localOmenLensQuietIsSilent.test.ts`
- `tests/contracts/localMandateLensSurfaceContract.test.ts`
- `tests/contracts/worldMandateLensContract.test.ts`
- `tests/contracts/daoMandateSourceMapContract.test.ts`
- `tests/contracts/daoMandateGuidanceVisibilitySettings.test.ts`
- `tests/contracts/moduleRoleBannerSurfaceContract.test.ts`
- `tests/contracts/worldCommandSurfaceContract.test.ts`
- `tests/integration/daoMandateWorldRouteParity.test.ts`
- `docs/release/qa/ui-cutover/world/after/v2-8-browser-observations.json`
- `docs/release/dao_mandate_v2_8_local_omen_lens_evidence.md`

## Relation taxonomy implemented
- Full type rename was used: `DaoLocalLensSurface.relation` now uses `primary-evidence`, `supporting-source`, `blocked`, `completed`, and `quiet`.
- No compatibility `omenRelation` bridge was needed.
- Public local lens building returns `null` for quiet modules.

## Quiet rule implementation
- Public quiet behavior: quiet local modules return no visible local lens, no route, no evidence count, and no header.
- Internal diagnostic behavior: no diagnostic quiet surface was added.
- World visible relation map behavior: `visibleRelationByModuleKey` excludes quiet modules; strongest Mandate module ignores quiet and support-only fallback.
- Source-map quiet behavior: quiet/no-entry module source-sink surfaces return `null` rather than points-elsewhere copy.

## Copy cleanup
- Removed reachable `current Mandate points elsewhere` copy from local lens and source-map local detail.
- Removed `Primary route`, `Support route`, `Future route`, and `Quiet` header labels from local lens UI.
- Cleaned legacy ModuleRoleBanner route labels to neutral role labels.
- Visual QA caught reachable Gate Trial `Ruins support route ready`; it was changed to `Ruins support source ready`.
- Remaining final-scan matches are guard strings in `daoOmenCopy.ts` and tests that assert absence; no reachable implementation copy remains in the scanned local/World/Mandate surfaces.

## World glint/stamp behavior
- Strongest Mandate priority now favors blocked hard relations and `primary-evidence`.
- `supporting-source` remains visible as relation detail but no longer becomes the strong recommendation by default.
- `completed` is subdued and route-free.
- Quiet modules do not enter the visible relation map and cannot win strongest Mandate selection.
- Ordinary non-Mandate utility cues remain; fresh-game World smoke still shows Apothecary as an ordinary World recommendation/glint, not a local Mandate lens.

## Tests added/updated
- Added `localOmenLensQuietIsSilent.test.ts`: quiet local lens null, no header render, source-map quiet hidden, static copy guard.
- Updated local lens contracts for V2 relation taxonomy, quiet null behavior, and strongest-module quiet exclusion.
- Updated source-map and guidance visibility contracts for quiet/null and profile-inert behavior.
- Updated World routing/command contracts so secondary route hints do not become strong World commands.
- Updated module role banner contract to remove points-elsewhere/cross-room route commands for irrelevant modules.
- Updated Gate Trial parity integration for retired Guidance Oath inertness.

## Commands run
- `npm run release:implementation-baseline:json` - PASS; generated release-doc churn was cleaned before closeout.
- `npm run release:runtime-content-manifest:json` - PASS; generated release-doc churn was cleaned before closeout.
- `npm run typecheck` - PASS.
- `npm run check:icons` - PASS.
- `npm exec tsc -- --project tsconfig.tests.json` - PASS.
- V2-1..V2-7 focused preflight contracts - PASS, 57/57.
- TDD red run for `localOmenLensQuietIsSilent.test.ts` - RED as expected before production edits, 5/5 failing.
- V2-8 targeted suite - PASS, 44/44.
- Post Gate Trial copy-cleanup focused suite - PASS, 26/26.
- `npm run validate:content` - PASS.
- `npm run build` - PASS. Build kept existing warnings: stale Browserslist data, unresolved `../../assets/background/InsideDungeon.png` runtime reference, and large chunks.
- `npm run test:contracts` - FAIL. Broad suite is red with many unrelated exact-screen/content contracts, including Gate Trial fixture scenic-stage contracts, Manual Pavilion painted text, Outskirts exact containment/route contracts, Techniques/consumable stock contracts, menu identity token contracts, ruins exact contracts, and old World Run Compass secondary-route expectations. Targeted V2-8 and V2-7 ownership contracts pass.
- Final forbidden-copy scan - PASS for reachable implementation files; guard/test strings remain by design.
- Final gameplay-mutation scan - PASS, no matches in scanned local/world UI files.

## Browser observations
- Browser MCP tool was not exposed by tool discovery. Playwright CLI was attempted first and failed because the expected Chrome distribution was missing at `C:\Users\abdul\AppData\Local\Google\Chrome\Application\chrome.exe`.
- Headless Playwright fallback used local dev server `http://127.0.0.1:5200`.
- Observations written to `docs/release/qa/ui-cutover/world/after/v2-8-browser-observations.json`.
- World default: PASS; no local Mandate header or forbidden copy.
- Forge, Apothecary, Bounties, Expeditions, Gate Trial entries: PASS; no points-elsewhere or old route-label copy.
- Reduced motion: PASS for copy/header smoke; ordinary non-Mandate Apothecary utility glint remained visible.

## Known failures / NO_GO risks
- `npm run test:contracts` remains broadly red in unrelated suites. This is not caused by V2-8 targeted files based on focused contract passes and final scans.
- Existing dirty V2-7 files remain in the worktree and were not reverted.
- CodeRabbit and Codex Security callable tools were not exposed by tool discovery; only static mutation/copy scans were performed.

## Acceptance result
- GO for V2-8 targeted acceptance.
- NO_GO for claiming the entire broad contract suite is green.
