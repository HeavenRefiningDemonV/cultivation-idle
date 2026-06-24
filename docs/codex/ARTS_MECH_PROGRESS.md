# M.IV.1 ARTS-MECH — progress ledger

> D17 Movement IV mechanical packet (D7). Make the technique model + the Fortune Draw real + live. Builds on
> a LOT of existing live code (re-point + extend, not from scratch). HIGH-FRAGILITY (RK-08 — the technique
> stores); the iron rule: contract-anchor (tri-stat→single-meridian) revisions IN-PACKET. Scope: MECHANICAL
> ONLY (the artifact M.IV.2 + port M.IV.3 come later — the user does the artifact in chat).

## The four internal steps (D17 — each leaves the tree green + a commit)
1. The model + contract (two-axis technique kind×grade; the innerAltarSurface + fortuneDrawSurface contracts).
2. The per-path roll + rarity.
3. The rarity sub-stats + the daily fortune (the Pavilion weighted roll).
4. The legendary unique mechanics (+ the reroll + the pity guarantee).

## D17 deliverables (the checklist)
- [ ] two-axis technique model (kind × grade) — src/systems/techniques/ + techniqueStore
- [ ] technique effect scales off the LIVE DERIVED layer (was tri-stat split; flag-aware like composeGear) — techniqueScalingResolver re-point
- [ ] per-path roll + rarity sub-stats — src/systems/techniques/ + techCollectionStore
- [ ] legendary unique mechanics (a legendary technique catalog; validate over the ids)
- [ ] the Fortune Draw weighted roll — manualOfferAnalysis / manualPavilionStore / pavilionStockGenerator
- [ ] the reroll + the pity guarantee (never-regress on acquisition) — manualPavilionStore / pavilionCorrectionRules
- [ ] technique→element interaction (elemental arts query the F3 resolver) — techniqueScalingResolver → F3
- [ ] SurfaceV1: innerAltarSurface (loadout) + fortuneDrawSurface (offers/pity/reroll) — additive, contract-tested, render-only
- [ ] [tune] → D15: roll weights, sub-stat ranges, pity threshold, reroll cost, legendary values, scaling coeffs

## Verification (D17)
- Battery green; contract floor rises (the altar/draw surface additions + the anchor revisions in-packet).
- A test: a technique scales off the derived layer (not tri-stat).
- A test: pity accumulates toward a guaranteed rare (never-regress on acquisition).
- A test: element-arts query the F3 resolver.
- §F idle-parity: the daily fortune drawable idle + the loadout editable idle.
- Per-path: a technique's per-path sub-stats roll distinctly per path.

## Discipline (inherited)
Flag-gated where it touches the live derived path (mirror the M.III.1 composeGear wire: flag-off byte-identical,
forceLegacy wins). All magnitudes HELD → D15. RK-08: technique stores touched with care; any tri-stat→single-
meridian contract-anchor revision made IN-PACKET. Commit per step. Preserve-first.

## RECON SYNTHESIS (much is ALREADY BUILT — M.IV.1 = re-point + targeted additions)
- Techniques: TechniqueDef has the two-axis fields (type=active/passive/ultimate KIND; tier+rarity GRADE, but
  unpopulated 0/60 in json — live grade/rarity comes from techCollectionStore OWNED state, so the model is
  effectively live). `resolveTechniqueScalingSnapshot` EXISTS but reads LEGACY tri-stat (pathStats), NOT the
  derived layer. RK-08 anchors: techniqueProgressionSnapshot.test.ts (grade-cap 3/5/7, trait slots, rune
  sockets, mastery-75 potency 1.25) — revise IN-PACKET only if a rule changes.
- Fortune Draw: pavilionStockGenerator.generateStock has a WEIGHTED ROLL + PITY ALREADY (featuredEpicPity=10,
  featuredLegendaryPity=30, counters in PavilionStockState.pity, reset on win). pavilionCorrectionRules +
  manualOfferAnalysis (thematic correction). manualPavilionStore (buyManual/refreshStock/ensureStock) +
  manualSatchelStore (startStudy/tick). NO reroll action; pity exists but UN-SURFACED.
- Derived+F3 seam: computeDerivedStats + isDerivedStatEngineAuthoritative + setDerivedStatInputGetter (same as
  composeGear's wire). F3: resolveAffinity(weights,element,ctx,tuning,target?) + resolvePlayerElementAffinity.
- Surfaces: techniquesExact (7/8, missing fixtures) has TechniquesExactSurfaceV1; manualPavilionExact (9 files)
  has ManualPavilionExactSurfaceV1. D17's innerAltarSurface/fortuneDrawSurface are NEW focused contracts the
  artifact targets + the port consumes (mirror the M.III equipmentExact pattern).

## REFINED PLAN — the GENUINE gaps (4 steps, each battery-green + commit)
1. fortuneDrawSurface — the render-only contract + builder + fixtures (the artifact's target: banner+fate-thread
   pity, lectern offers as sealed scrolls, draw, reveal, reroll row, satchel footer; reuse F2 ItemDetailSurfaceV1).
2. Fortune mechanics: the REROLL action (manualPavilionStore — spend HELD currency to refresh one pavilion) +
   SURFACE the existing pity (fate-thread readout). + idle-parity test.
3. Technique scaling RE-POINT at the derived layer (flag-aware, mirror composeGear: flag-off byte-identical,
   forceLegacy wins) + the F3 element query for elemental arts. + the derived-scaling + element tests.
4. The legendary technique catalog (named signature arts + unique mechanics, HELD; mirror the gear one) +
   the innerAltarSurface contract (lighter; the altar is a reconcile). + catalog-completeness test.

## Status
- [x] Phase 0 — recon (workflow wz4kfmouq): techniques · manuals · derived+F3 · surfaces+anchors. DONE.
- [x] Step 1 — fortuneDrawSurface contract + builder + fixtures + contract test (577, floor 576→577). DONE.
      Files: src/systems/ui/fortune/fortuneDrawTypes.ts + fortuneDrawBuilders.ts + fortuneDrawFixtures.ts +
      tests/contracts/fortuneDrawSurface.fixture.contract.test.ts (8 tests). Render-only; reuses F2
      ItemDetailSurfaceV1 for selectedDetail; the 9-state matrix; the never-regress fate-thread surfaced.
      NOTE: the innerAltarSurface = the EXISTING TechniquesExactSurfaceV1 (the altar is a reconcile, M.IV.3);
      no new altar contract needed — only the net-new Fortune Draw ceremony got one.
- [x] Step 2 — the REROLL action + the live pity surfacing (578, floor 577→578). DONE.
      Files: src/systems/manuals/pavilionRerollCost.ts (cost resolver, HELD-in-content), manualPavilionStore
      rerollStock (paid early refresh, bypasses free cooldown, pity CARRIES via generateRefresh → never-regress,
      gated `reroll_not_configured` until D15), src/systems/ui/fortune/fortuneDrawLiveInput.ts (live owner →
      surface, surfaces the live pity), tests/contracts/fortuneDrawReroll.contract.test.ts (4: the guarantee at
      threshold-1, the never-regress sequence invariant, the reroll gating, the idle-parity live build).
      KEY: the reroll cost is read from economy content (manualSystem.pavilions.refresh.rerollCost) — HELD → D15;
      authored NO number in code; the reroll is honestly gated until content provides it.
- [x] Step 3 — technique scaling RE-POINT at the derived layer (flag-aware) + the F3 element query (579, floor
      578→579). DONE. techniqueScalingResolver: + optional `derived` input (full canonical statRatingsById, all
      28 stats, not the path-filtered tri-stat) + `elementAffinityMult` folded into totalMultiplier + snapshot
      field + 'mp4_derived_v1' debug mode. Flag-off byte-identical (the two RK-08 anchors green untouched).
      techniqueDerivedScalingSource.ts: buildTechniqueDerivedScaling — the flag-gated seam (forceLegacy wins →
      null), reads statRatingsById + queries F3 (resolvePlayerElementAffinity) for elemental arts only.
      techniqueDerivedScaling.contract.test.ts (5): byte-identical off, derived-is-the-source (incl. out-of-path
      stat scales under derived = 0 under legacy), the F3 edge folds + floors at 1, the seam flag-gate, the seam
      F3 query matches resolvePlayerElementAffinity exactly. Combat consumption stays Movement V (not wired here).
- [ ] Step 4 — the legendary technique catalog (+ unique mechanics) + the innerAltarSurface note.
