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

## D7 POLISH PASS (live-screenshot review vs D7 / D14 / D15) — recon workflow ww8dweaam
The live menu exposed gaps the fixtures didn't. FIXED (presentation adherence):
- **Broken vertical scroll names** → English HORIZONTAL, centred + wrapped (D7 §E.6: technique names are English
  path-flavoured; CJK appears ONLY as the rarity glyph 凡良珍极仙, which is already on the seals). `.vname-en`.
- **Raw `city_pinewind_hamlet` in the header** (D14 §A.8 violation) → the real city NAME + a daily-fortune cadence
  framing (the game has no day counter, so no faked "Day N").
- **All-currency global ribbon** → the wallet now shows EXACTLY Gold / Spirit Stones / Merit (D14 §D.6; Fortune is
  the prestige reroll currency, surfaced contextually, never in the global ribbon).
- **Mixed-path offers** → curation now PATH-prioritises the cultivator's path (D7: "off-path manuals are never
  rolled"), filling only to keep the lectern from going bare.
- **"Buy & Study" / "Buy to Satchel"** → **Study / Hold in Satchel** (D7: studying adds to the collection; it is
  not a purchase). Live + fixtures.
Verified: typecheck · check:icons · build · test:contracts 580/580 · capture (zero page errors). Live render now
reads correctly (names legible, city name, 3-currency wallet, heaven-path offers, Study verbs).

## REMAINING D7/D14 ADHERENCE GAPS (surfaced to user — larger than presentation polish)
These EXPAND the frozen M.IV.2 artifact (which omitted them) or rework mechanics — held for a decision:
- **Build-gap "why" tags** on offers ("fills a build gap / upgrade over slotted X / new element") — D7's core
  "reroll is build-DIRECTED" feature. Logic EXISTS (manualOfferAnalysis); needs the context wired into the
  fortune surface. HIGH value, medium effort, fits the layout.
- **History ribbon + the "ink gathers" pity build-up**; **the Legendary beat** (gold shimmer + heavier seal).
- **Heaven-only Premonition pane** (tomorrow's fortune) — a new Heaven-gated panel.
- **Reroll-confirm ritual modal** (D14 §E.2 — a prestige-currency spend must confirm).
- **THE ECONOMY MODEL (fundamental)** — D7/D15 specify a FREE once-per-day gacha roll + a Fortune-token reroll;
  the implemented manualPavilionStore is a GOLD SHOP (2500 Rare / 8000 Epic). D15 recon: the gold pricing is
  "an out-of-ledger invention with NO basis in D15." Reconciling = a cross-system mechanical rework (the store +
  the legacy panel + the existing exact shop all assume gold pricing). Decision needed: rework to the daily-roll
  model, or deposit the priced-shop model into D15.

## CUTOVER — DONE (user-approved)
The Fortune Draw is now the DEFAULT Manual Pavilion view (WorldBuildingModal `manualPavilion`: no intent → Fortune).
Verified by the capture opening with NO intent → Fortune renders. Preserve-first escape hatches kept:
- the exact analysis shop: intent `live`/`fixture` or `?pavilionView=shop`
- the legacy panel: intent `legacy` or `?pavilionView=legacy`
The source-text anchor (ManualPavilionExactWorldModal.fixture) stays green — the literal `manualPavilionExactMode
=== 'legacy'/'fixture'` strings are preserved (the new default branch uses `wantLegacy`/`wantShop`, not an alias).
NOTE: the menu-capture "24-world-manual-pavilion" will now show the Fortune Draw (intentional).
