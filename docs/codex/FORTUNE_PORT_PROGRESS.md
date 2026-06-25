# M.IV.3 Fortune Draw port — progress ledger

Port the FROZEN artifact `C:\Users\abdul\Downloads\fortune-draw.html` (1127 lines) into a live, flag-gated
Manual Pavilion screen consuming `FortuneDrawSurfaceV1`. 1:1 fidelity, full function, NO placeholders.

## LESSONS CHECKLIST (every problem from M.III.3 / observatory ports — follow ALL)
1. **Brown-token bug** — the artifact's `:root` SHORT token names (`--paper-warm`, `--jade-deep`, `--cinn-deep`,
   `--el-water/fire/wood/earth/metal`, `--rarity-*`, `--kai`, `--serif`) are UNDEFINED in live paperInkTokens.
   → DECLARE the artifact's full :root block scoped to `.fortuneRoot`, or panels go transparent + the dark
   stage shows through. (This artifact uses `--el-*`, NOT `--element-*`.)
2. **Defs SVG must NOT take a grid row** — inject FORTUNE_DRAW_SVG_DEFS into a `position:absolute;width:0;
   height:0;overflow:hidden` `.fortuneDefs` div (else it consumes the first grid row + pushes everything down).
3. **One delegated `onStageClick`** reading `data-*` (data-stock → select offer, data-action → draw/reroll/buy/
   altar) — not per-element handlers. Respect `disabled` + `data-confirm`.
4. **Scale rig** — `useObservatoryScale()` → {viewportRef, scale}; `.fortuneFit` wrapper (ref) + `.fortuneRoot`
   `transform:scale(scale)` `transform-origin:center center`. min(w/2048,h/1152) clamped. NOT hand-rolled RO.
5. **SVG defs injected ONCE** at stage root (both the lectern scene + the spindle + seals resolve `url(#)`).
6. **Reduced-motion law VERBATIM + scoped** to `.fortuneRoot`: `@media (prefers-reduced-motion:reduce){*,*::
   before,*::after{animation:none!important;transition:none!important}}`. The reveal needs a static fallback.
7. **Live data — no placeholders**: offers from the live pavilion stock (`ensureStock`), purse from the
   currency store, `selectedDetail` from the real selected technique, pity from the live counters. Fixture mode
   only for the harness (`?fortune=fixture`).
8. **Verify discipline**: typecheck + tsc-tests (stricter) + test:contracts (NEVER `rm -rf tmp-tests/tests`
   after tsc — only `tmp-tests/tests/e2e`) + build + check:icons + validate:content + the Playwright 9-state
   matrix @2048×1152 dSF2 + the live in-game capture (ZERO console errors). Self-verify with a screenshot.
9. **Commit per slice via bash `-F` heredoc** (PowerShell `@'...'@` leaks `@`). Co-Author trailer.
10. **Flag + preserve-first** — the legacy pavilion shop stays reachable; the fortune screen is a NEW
    `manualPavilionExactMode` (`fortune`). Mount: `WorldBuildingModal.tsx:114-123` case `manualPavilion`.

## ARTIFACT → SURFACE reconciliations (the only deltas from FortuneDrawSurfaceV1)
- + `purse` (currency wallet: fortune/gold/stones/merit) — NOT in the surface; the owner fills it from the
  currency store (the artifact says "bound from the currency store, not the draw surface").
- + raw `kind` on FortuneOfferSurface (for the kind glyph) — the surface had only `kindLabel`.
- The owner BUILDS `selectedDetail` (ItemDetailSurfaceV1, technique-variant) from the selected offer's
  technique (the artifact's `detailFor` + `toDetailSurface` show the shape).

## File plan (mirror the M.III.3 panoply set)
- src/systems/ui/fortune/: extend fortuneDrawTypes (purse + kind) + builders (mapOffer kind + buildTechniqueDetail) + liveInput (purse + detail).
- src/ui/world/fortune/: fortuneDrawSvgDefs.ts (FORTUNE_DRAW_SVG_DEFS), fortuneDrawSceneSvg.ts (waxSeal/goldSeal/
  tassel/motes/lecternScene/lantern/couplet/censer/kindGlyph/currencyGlyph/fateSpindle), fortuneDrawInstrumentsHtml.ts
  (panel/header/purse/fate/lectern/scrollCard/cmdBar/inspector/satchel), fortuneDraw.scss (artifact <style> scoped
  + token block), FortuneDrawScreen.tsx (stage + scale + inject + delegated click).
- src/features/world/fortune/: FortuneDrawScreenOwner.tsx (selectors → buildFortuneDrawSurfaceLive + purse +
  selectedDetail) + useFortuneDrawActionController.ts (draw/reroll/select/buy → manualPavilionStore) + fortuneDrawFlag.ts.
- Wire: WorldBuildingModal.tsx (the `fortune` mode) + a fortune-draw live-capture spec.

## Status — COMPLETE (all slices), gates green
- [x] Phase 0 — full artifact read + recon (workflow wy208lbee).
- [x] Slice A — surface ext: `purse` + raw `kind` on offers + `buildFortuneOfferDetail` (technique → ItemDetailSurfaceV1).
- [x] Slice B — fortuneDrawSvgDefs.ts (FORTUNE_DRAW_SVG_DEFS, verbatim).
- [x] Slice C — fortuneDrawSceneSvg.ts (waxSeal/goldSeal/tassel/motes/lecternScene WHEEL-OF-FATE/lantern/couplet/
      censer/kindGlyph/currencyGlyph/fateSpindle + STAR4/STAR5 SVG — replaced the ✦/★ code points check:icons forbids).
- [x] Slice D — fortuneDrawInstrumentsHtml.ts (panel/header/purse/fate/lectern/scrollCard/cmdBar/inspector/satchel),
      bound from the surface, `data-stock`/`data-action` for the delegated click.
- [x] Slice E — fortuneDraw.scss (artifact <style> ported scoped to .fortuneRoot + the token block fix + .fortuneFit + .fortuneDefs).
- [x] Slice F — FortuneDrawScreen.tsx (useObservatoryScale + .fortuneFit/.fortuneRoot + inject defs once + single
      delegated onStageClick + `display:contents` wrappers so the panels are direct grid children = the 116/1fr/58 rows).
- [x] Slice G — FortuneDrawScreenOwner (selectors → buildFortuneDrawSurfaceLive + purse + selectedDetail; `?fortune=fixture` harness) +
      useFortuneDrawActionController (draw/reroll/buy/altar → manualPavilionStore + uiStore) + fortuneDrawFlag.
- [x] Slice H — mount: WorldBuildingModal `manualPavilion` gains the `fortune` mode (intent or `?pavilionView=fortune`);
      uiStore mode type +'fortune'. Source-anchor (ManualPavilionExactWorldModal.fixture) kept green by preserving the literal
      `manualPavilionExactMode === 'legacy'/'fixture'` text (used `wantFortune` for the new branch).
- [x] LIVE-DATA fixes (caught by the self-verify capture): curate the live stock to ~5 (featured + best non-filler;
      the lectern is built for ~4, the live pavilion had ~14); element edge from rootAffinityIds; effectText from
      effect.note (was the raw object); vname reads upright-vertical for English names (techniques have NO CJK names).
- [x] VERIFY: typecheck · tsc-tests · check:icons · validate:content · build · test:contracts 580/580 ·
      the Playwright capture (5 fixture states + live + live-selected; ZERO page errors). Fixtures match the
      artifact 1:1 (incl. the populated inspector); live works (curated offers, the inspector fills on click, real
      purse/pity/stock). Captures at artifacts/fortune-port/.

## CUTOVER — DONE (user-approved)
The Fortune Draw is now the DEFAULT Manual Pavilion view (WorldBuildingModal `manualPavilion`: no intent → Fortune).
Verified by the capture opening with NO intent → Fortune renders. Preserve-first escape hatches kept:
- the exact analysis shop: intent `live`/`fixture` or `?pavilionView=shop`
- the legacy panel: intent `legacy` or `?pavilionView=legacy`
The source-text anchor (ManualPavilionExactWorldModal.fixture) stays green — the literal `manualPavilionExactMode
=== 'legacy'/'fixture'` strings are preserved (the new default branch uses `wantLegacy`/`wantShop`, not an alias).
NOTE: the menu-capture "24-world-manual-pavilion" will now show the Fortune Draw (intentional).
