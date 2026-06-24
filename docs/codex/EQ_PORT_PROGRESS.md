# M.III.3 EQ-PORT — progress ledger

> Persisted per the packet's continuation clause. Port `M_III_2_panoply_vault.html` (1132 lines, at
> `C:\Users\abdul\Downloads\M_III_2_panoply_vault.html`) into live React/TS/SCSS, flag-gated, preserve-first,
> 1:1 with the artifact. Build bottom-up (data → paint → VFX → verify). Typecheck after each file.

## Status board
- [x] Phase 0 — recon (artifact read end-of-instruments; mirror/contract/store digests via workflow)
- [x] Phase 1 — flag + screen-swap (panoplyFlag default OFF, EquipmentScreen, GameLayout line 411) — typecheck=0
- [x] Phase 2 — panoplyUiStore + panoplyVaultInput + gearPower (contract field + builder helper; fixtures TODO)
- [x] Phase 3 — owner + controller + skeleton screen — typecheck=0
- [x] Phase 4 — panoplySvgDefs (verbatim defs) + panoplyFigureSvg (ALL SVG-string builders, 1:1) — typecheck=0
- [x] Phase 5 — instruments: panoplyInstrumentsHtml.ts (ribbon/rail/totals/setband/vault/census/chrome HTML, 1:1, intents via data-*) + PanoplyFigureScene (pure injector) + PanoplyVaultScreen REWRITTEN to the artifact's stage/chrome/ribbon/body/rail structure with ONE click-delegation (instance/slip/vfilter/route) + the real surface toggle. typecheck/icons/build=0.
- [x] Phase 6 — panoplyVault.scss (the FULL <style> port, rule-for-rule, scoped to .panoplyRoot: stage 2048×1152, chrome, ribbon, rail, totals, setband, vault, slips, the 13 keyframes + VFX classes, reduced-motion law) + paperInkTokens hue-separated rarity ramp + -soft glows (Appendix H). Modal reuse done in the owner. build (sass) green.
  - FOLLOW-UP: scale-to-fit wrapper (the live app shows the 2048×1152 stage at native size; the harness/screenshots are 2048×1152 exact — the oracle is fine). Add a React-measured transform like the Seat for live-app fit.
- [x] Phase 7 — fixtures gearPower (per-seed map) + panoply-stage.html + __harness__/panoplyStageMain.tsx + tests/e2e/panoply.spec.ts. Owner mounts in fixture mode.
- [~] Phase 8 — Playwright matrix GREEN: 12/12 cells pass (7 panoply states + 4 vault + reduced-motion), ZERO console errors per cell, reduced-motion 0 active animations. Self-verify loop STARTED: caught + fixed a real layout bug (the .panoplyDefs host was consuming the first grid row → ribbon/body off their rows; fixed with position:absolute). Verified visually: both surfaces render the framed artifact (chrome/ribbon/figure scene/rail/vault grid).
  PATH×STATE CROSS now verified: a ?panoplyPath= harness override (owner pathOverride prop) recasts the
  fixture's pathLean; the 3 path scenes pass + were visually confirmed distinct & faithful — martial
  (forge-dawn/weapon-rack/embers/martial-couplet/gold), earth (pagodas/山地-steles/stone-base/earth-couplet),
  heaven (nebula/crescent-moon/constellation/slate-robe/heaven-couplet). Spec now has the path-cross block.
  REMAINING for full 1:1 (cosmetic/fixture-content, not port-fidelity): (a) the healthy fixtures don't set
  selectedDetail so the rail shows "Choose a treasure" (the artifact showed the focus item — set focus in the
  fixture); (b) richer vault fixture (S0 seed has 4 slips vs ~20); (c) the live-app scale-to-fit wrapper (the
  2048×1152 oracle is unaffected); (d) per-cell pixel micro-diff vs the artifact.

## Done this turn (the verifiable bottom-up SPINE — surface is real from first render)
Files CREATED (all typecheck-green):
- `src/features/equipment/panoply/panoplyFlag.ts` — leaf flag, `PANOPLY_PUBLIC_DEFAULT_ENABLED=false`, `resolvePanoplyFlag` (?panoply=live|fixture|legacy|off, ?panoplyFixture, ?panoplySurface).
- `src/features/equipment/panoply/usePanoplyActionController.ts` — routes (equipment.equip/unequip, vault.dismantle, +item.* aliases) → equipInstance/unequipSlot/dismantleGearInstance; resolveDef + findEquippedSlot.
- `src/features/equipment/panoply/PanoplyScreenOwner.tsx` — narrow selectors (gearLoadoutVersion, inventoryVersion, selectedPath, realm.index, panoplyUi slices) + memoised reducedMotion + useMemo(surfaces) fixture|live + reused ItemDetailInspector modal.
- `src/features/equipment/panoply/index.ts` — barrel.
- `src/components/screens/EquipmentScreen.tsx` — screen-swap (default export, mirrors CultivateScreen).
- `src/stores/panoplyUiStore.ts` — view-state slice (Appendix G).
- `src/systems/ui/equipment/panoplyVaultInput.ts` — pure seam → PanoplyBuildInput + VaultBuildInput; getDef = GEAR_ITEM_DEFS → contentStore.getItem.
- `src/ui/equipment/panoply/PanoplyVaultScreen.tsx` — render-only SKELETON (real data, structural; internals replaced in Phase 4-5).
- `src/ui/equipment/panoply/index.ts` — barrel.
Files EDITED (additive):
- `src/systems/ui/equipment/equipmentExactTypes.ts` — +`gearPower?: number|null` on PanoplyExactSurfaceV1.
- `src/systems/ui/equipment/equipmentExactBuilders.ts` — +`deriveGearPower` ([tune]) + set in buildPanoplyExactSurface.
- `src/components/GameLayout.tsx` — line 12 import + line 411 `<EquipmentScreen/>` (was InventoryScreen).

CONFIRMED bindings: contentStore.getItem(id)=>ItemDef; CultivationPath=="heaven"|"earth"|"martial" (== PanoplyPathLean, no remap); ItemDetailInspector({open,surface,onAction,onClose}); equipInstance(instance,def,slot,realm); unequipSlot(slot,id?); dismantleGearInstance(id); gearLoadoutVersion/inventoryVersion counters.

DRIFT (stop-condition #1, reconciled): cultivationSeatInput.ts + cultivationSeatSurface.ts are in `src/systems/ui/cultivation/` (not features/.../seat/).

## NEXT (Phase 4) — read artifact lines 700-1132, port verbatim into:
- `panoplySvgDefs.ts` = `PANOPLY_SVG_DEFS` (the defs <svg> string, all gradients/filters from lines 289-325 — already captured above).
- `panoplyFigureSvg.ts` = pure string builders: nameTag, figBodySVG, slotObjectSVG, sceneBackdrop, sceneFurniture, ridgeLayer, pagodaSVG, coupletColSVG, figureSceneSVG, pathEmblemSVG, powerSealSVG, ringSealSVG, bigEmblemSVG, slipEmblemSVG, + the already-read frameSVG/tierSealSVG/compassSVG/bondLadderSVG/kindGlyphSVG/waxSeal/tassel/ridge/inkMountains. Replace inkMountains' Math.random gradient id with a deterministic id.

## Phase 0 — verbatim facts captured from the artifact (the pixel reference)

### Layout / stage
- `.stage` = fixed **2048×1152**, `display:grid; grid-template-rows:120px 1fr 56px; gap:12px; padding:15px`. Row1 = ribbon panel, row2 = `#bodyWrap`, row3 = dock panel (dock is **app-shell owned — do NOT port**). `body[data-path=martial|earth|heaven]` casts `--accent`/`--accentGlyph`.
- `.body.panoply{grid-template-columns:1fr 486px}` · `.body.vault{grid-template-columns:1fr 470px}`. Right column = rail (+ totals for panoply via `.railcol` rows `1fr auto`).
- Corner tag `法宝阁` (panoply) / `须弥戒` (vault) — `.tag` top-left, vertical CJK.

### Rarity (quad-coded — never hue-alone)
- `RGRADE={common:'mortal',uncommon:'spirit',rare:'earth',epic:'heaven',legendary:'immortal'}`
- `RGLYPH={common:'凡',uncommon:'良',rare:'珍',epic:'极',legendary:'仙'}` · `RLABEL` = English.
- `RVAR`/`RSOFT` → `var(--rarity-<grade>)` / `var(--rarity-<grade>-soft)`. frameSVG ornament differs per grade (mortal=1 thin rect; spirit=double+top notch; earth=double+L-corners; heaven=double+4 corners+amethyst dot; immortal=cinnabar+gold flourish+`legShim`).

### Elements
- `ELEMENTS` 14-roster: `[Name, glyph, colorVar]`. `lightning` not `thunder` (glyph 雷). Color always via `sceneColorToken` (the `var(--element-*)`/`var(--el-*)`), never raw hex.

### Fixed geometry (STABLE across paths — emphasis only changes size/aura)
- Scene viewBox is **1000×760**. `ANCHORS = {head:[500,138], chest:[500,300], legs:[500,452], weapon:[742,330], accessory:[[272,232],[232,350],[260,470],[326,560]]}` (4-node arc).
- `emphasisFor(path,slot)`: martial{weapon:lead,armor:support,accessory:muted} · earth{weapon:support,armor:lead,accessory:muted} · heaven{weapon:support,armor:muted,accessory:lead}. **Mirror `resolvePathIdentity` from gearPathIdentity.ts instead.**

### VFX — 13 @keyframes (port verbatim into panoplyVault.scss)
`ovBreathe, qiflowK, spinSlowK, mpulseK, twkK, weakPK, flickK, swayK, moteUpK, glintK, legShimmer, sealPress, orbitK`.
Classes: `.breatheA`(5.6s worn-slot breath), `.spinG`(90s qi-corona), `.twk`, `.weakP`(bond pulse), `.flick`, `.swayT`, `.mp`, `.qiflow`, `.legShim`, `.sealP`, `.mote`. Reduced-motion law (verbatim, scope to root): `@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}`.

### SVG `<defs>` ids (Appendix B — all must exist in PANOPLY_SVG_DEFS)
Filters: `grainF, rough, brushRough, soft, soft3, soft6, glowR, glowJ`.
Gradients: `inkDisc, cinnDisc, jadeRad, goldG, goldRad, brass, brassH, plank, steelG, goldBrushG, qiAura, auraEarth, auraHeaven, qiCore, figG, robeMartial, robeEarth, robeHeaven, moonG, forgeGlow, nicheShade, daisG, steleG, pillarG, nebulaG, bondFill`. (Per-scene local gradients like `inkMountains`' `mg<rand>` are generated inline — keep deterministic, avoid Math.random in the port: derive a stable id.)

### Function inventory → port target (Appendix A authority)
- REPLACE with live builders/fixtures (drop the artifact mocks): `ITEMS, summary(), detail(), slotE/lock, LOADOUTS, panoplyFor(), VAULTPOOL, slip(), vaultFor(), BAND`.
- SVG builders → `panoplyFigureSvg.ts` verbatim: `tassel, waxSeal, ridge, inkMountains, frameSVG, tierSealSVG, kindGlyphSVG(+KMARK), compassSVG, bondLadderSVG, nameTag, figBodySVG, slotObjectSVG, sceneBackdrop, sceneFurniture, ridgeLayer, pagodaSVG, coupletColSVG, figureSceneSVG, pathEmblemSVG, powerSealSVG, ringSealSVG, bigEmblemSVG, slipEmblemSVG`. (Lines 700–1132 still to read when porting Phase 4.)
- HTML instruments → render-only components: `gearTotalsHTML→GearTotals, setLinkBandHTML→SetBondBand, ribbonHTML→Ribbon, censusStripHTML→VaultCensus, lowerStripHTML→PanoplyLowerStrip, vaultBodyHTML→VaultGrid, slipHTML→VaultSlip, detailRailHTML→ItemDetailRail (+affixRowHTML/rarityChipsHTML/setBondSecHTML/compareSecHTML/actionsHTML)`.
- Orchestration/state → owner+controller+panoplyUiStore: `render, chrome, setSurface, setPath(dev→gameStore.selectedPath), setState(dev-drop), setVFilter→vaultFilter, selectSlip→selectInstance, openItem/modalHTML→reuse F2 ItemDetailInspector, paintMotes→motes layer`.
- DO NOT port: `dockHTML/HALLS` (app-shell), the `.ctrls` dev bar (`selSurface/selPath/selState`).

### CSS class verbatim anchors (already captured, lines 1–285)
Ribbon: `.ribbon` flex space-between, `.zL/.zC/.zR`, `.ident/.idtext`, `.rcell`, `.ecell`, `.tiernum`, `.compassmc`, `.rmedal`, `.census.big`. Rail: `.detail/.dh/.dname/.dcjk/.dbody`, `.affix(.prefix/.suffix/.set/.bond)/.rollbar`, `.dsec/.sig/.cmp/.lore/.prov/.dacts/.empty-rail`. Totals: `.totals/.tgrp/.trow(.gain/.loss/.neutral)`. Set band: `.setband/.setrow.active/.setlead/.stones/.seteff`. Vault: `.vfilters/.fbtn.on/.census/.cpip/.vgrid/.slip(.sel)/.newdot/.empty-vault`. Modal: `#ov/.ovp/.ovh/.ovclose/.ovc/.col2/.ovhero` (REUSE F2 ItemDetailInspector instead of porting). Chrome: `.panel/.grain/.gframe/.gframe2/.gc(.tl/.tr/.bl/.br)/.banner/.tag`.

## Open decisions / gotchas
- `gearPower`: artifact `panoplyFor` sets `base.gearPower` per state (martial healthy 1840 etc.). Live: add optional `gearPower?` to PanoplyExactSurfaceV1 + compute upstream in buildPanoplyExactSurface from gearTotals (Appendix F.4, `[tune]`).
- `inkMountains` uses `Math.random()` for a gradient id — replace with a deterministic id (index/seed) in the port (no Math.random in render).
- `.js` import specifiers mandatory. Render-only: no store imports in `src/ui/equipment/panoply/*`.
- Recon workflow `wf_be94a453-161` digests the mirror Seat owner/scene/scss, the F2 inspector props, the exact contract field names + builder/route signatures, the store APIs, and the harness pattern — consult before writing each file.
