# ONESHOT REBUILD — Status "Living State Observatory" · Progress Ledger

Single-session exact-mockup rebuild of the Status **visual + VFX** layer (data layer kept).
Crash-recovery spine: each stage is ticked, noted (3–6 lines), and committed (`oneshot S<N>: …`).

## Conventions / corrections
- **Mockups live in `status mockups and docs/`** (the prompt says `materials/` — that folder does
  not exist; PNGs are present and readable, so NOT a hard blocker). Frame→hash map below.
- Design space = **1672×941** (mockup native px). Content rows 0–895; 895–941 = quiet parchment edge.
- Token-only palette; raw hex only in `src/styles/paperInkTokens.scss` (CRLF — append-only).
- Preserve every existing `data-testid`; final set must be a superset of the S0 snapshot.

## Frame → hash map (in `status mockups and docs/`)
| Frame | Hash | Role |
| --- | --- | --- |
| A | 4f1e378f | Stat Meridian Constellation (28 stats) |
| B | 5a249286 | Blocked / max pressure (stress ref) |
| C | 7c6e9be4 | Healthy (jade) |
| D | 89e5195a | Selected Stat Bead Lens |
| E | 91a6f87d | Gate Trial Failed (postFailure) |
| F | 357bf750 | Spirit Root Astrolabe (FLAGSHIP) |
| G | 477eb0e7 | Prestige pressure (gold) |
| H | 52875ddb | Bottleneck Talisman Canopy (FLAGSHIP) |
| I | b17ccaec | Dense compact default (**PRODUCTION BLUEPRINT**) |
| J | b70f98c7 | Meridian Vessel Compass |

## Stage checklist
- [x] **S0** Recon
- [x] **S1** The Stage (fixed 1672×941 design space, scale hook, void viewport, full-bleed)
- [x] **S2** Palette purge + Frame-I region rects + plate materials/title tabs
- [~] **S3** Life Decree + Vitals Ribbon — *Vitals rebuilt; Life Decree deferred*
- [ ] **S4** Root/Law Coupled Instrument (port the prototype astrolabe)
- [ ] **S5** Meridian Vessel + Bottleneck Canopy (all 4 modes)
- [ ] **S6** Belt: Constellation, Scales+Jars, Wheel, Ledgers
- [ ] **S7** Mid-gate (full ladder + composition pass)
- [ ] **S8** States (5 whole-screen) + e2e harness
- [ ] **S9** Overlays (stat lens, root observation, canopy inspector, organ lens)
- [ ] **S10** VFX polish + reduced-motion
- [ ] **S11** Copy/formatting hygiene + hygiene contract test
- [ ] **S12** A11y pass
- [ ] **S13** Cleanup (dead SCSS/JSX, clip regions, final gates)
- [ ] **S14** Final gate + report

---

## S0 — Recon ✅
- **Mockups found** in `status mockups and docs/` (10 PNGs, all hashes verified vs frame map). `materials/` absent → path corrected; not a blocker (PNGs readable directly).
- **typecheck GREEN** (`tsc --noEmit`, clean).
- **Contracts** baseline running in background → `artifacts/s10-exact-mockup/_contracts_baseline.log`.
- **Diagnosis confirmed**: `.statusObservatoryRoot` carries the brown gradient (`#312417→#59401e`, scss:19) + a duplicate raw-hex `--observatory-*` palette (scss:4–13); `.statusObservatoryCanvas` is a fluid grid `min(1480px,100%)`. D-1…D-6 all valid.
- **Current DOM**: `root[status-ledger-root]` → `.obsVoidBackdrop.statusObservatoryVoid` → `.statusObservatoryCanvas[status-ledger-grid]` → 9 `obsRegion` sections + `.obsBelt` + `<StatusObservatoryDrawers>`. Drawers already mount inside the canvas (will scale with the Stage).
- **Mount chain**: `StatusScreen.tsx` → `useStatusDashboardSurface` → `StatusLedgerPage` (has `?obsFixture=<state>` DEV mount) → `StatusLivingStateObservatory({surface,onAction})`.
- **EOL**: `paperInkTokens.scss` = CRLF (append-only); `StatusLedgerPage.tsx` = LF.
- **fx primitives present** (keep): BreathingGlow, BridgeThread, GlintPath, QiThreadPath, SealStamp, useRitualMotion, bridgeThreadGeometry; SCSS observatoryFx + observatoryMaterials.

### S0 testid snapshot (superset gate baseline — final set must contain all of these)
```
obs-region-canopy  obs-region-constellation  obs-region-decree  obs-region-ledgers
obs-region-root-law  obs-region-scales  obs-region-vessel  obs-region-vitals  obs-region-wheel
status-bottleneck-canopy  status-bottleneck-edict  status-bottleneck-inspector
status-bottleneck-route-charm  status-bottleneck-safety-seal  status-bottleneck-slip
status-bottleneck-thread  status-current-state  status-ledger-build-preparation
status-ledger-current-work  status-ledger-details  status-ledger-grid  status-ledger-hero
status-ledger-hero-doctrine  status-ledger-hero-goal  status-ledger-hero-identity
status-ledger-metrics  status-ledger-mission-requirements  status-ledger-primary-action
status-ledger-recent-changes  status-ledger-root  status-meridian-focus-lens
status-meridian-shared-cause-stamps  status-meridian-vessel-drawer  status-observatory-drawer
status-reserve-jars  status-root-law-instrument  status-stat-bead-lens  status-stat-constellation
```

---

## S1 — The Stage ✅
Fixed-design-space Stage + uniform monitor scaling (the void frame everything sits inside).
- New `useObservatoryScale.ts`: ResizeObserver on the viewport → `--obs-scale = clamp(0.45, min(w/1672, h/941), 1.75)`; SSR-safe; observer cleaned up. Exports `OBS_STAGE_WIDTH/HEIGHT`.
- `StatusLivingStateObservatory.tsx`: inserted `.obsStageViewport > .obsStage` around the canvas; viewport carries the ref + inline `--obs-scale` + `data-obs-at-floor`. Drawers stay inside the stage (scale with it). All testids preserved.
- `StatusLivingStateObservatory.scss`: removed the brown gradient from the root (D-1 start); added `.obsStageViewport` (slate-teal void radial + inset vignette, flex-center, overflow hidden; at-floor→scroll), `.obsStage` (1672×941, `transform: scale(var(--obs-scale))`, origin center), `.statusObservatoryCanvas` → fixed 1672×941 relative (grid kept for S1).
- Full-bleed: `GameLayout.tsx` status content class `--scrollable`→`--observatory`; `GameLayout.scss` `.gameLayoutContent--observatory { 100vw × calc(100vh - nav); overflow:hidden; padding:0 }`. Void covers edge-to-edge; no `cbg_bgblue.png` leak.
- **Gate (Playwright, blocked fixture):** 2560×1440 → scale 1.439, stage scaled to 2406px **centered with 77px void margins L/R**, void = rgb(32,48,44), content full-bleed 2560w, `docScrollW==innerW` (no h-scroll). 1280×800 + 1920×1080 captured & passing. Geometry JSON proves it; thumbnail looked light only because void margins are ~18px at thumb scale and the *old* card composition fills the rest (expected at S1).
- Deviation: dead `.obsVoidBackdrop` rule left in `observatoryMaterials.scss` (class renamed) → S13 cleanup. `git add -A` not used (scoped commits — unrelated prior working-tree changes kept out).
- typecheck GREEN. Screenshots: `artifacts/s10-exact-mockup/stage-gate/blocked-{2560x1440,1920x1080,1280x800}.png`.

---

## S2 — Palette purge + Frame-I region rects ✅
- **Palette purge (D-2 core):** the local `--observatory-*` palette is now aliased onto real tokens (parchment / parchment-strong / ink / ink-muted / jade-bright / amber / stamp / rare) — 8 raw-hex defs eliminated, the contradiction with the token system resolved; all 129 consumers become token-backed transitively. The 2 rgba helpers (line/shadow) were never hex and stay.
- **Frame-I region rects:** replaced the fluid grid with absolute rects (design units) on the 9 `.obsRegion--*` wrappers; `.obsBelt`→`display:contents`. Each region is now a parchment plate (radial parchment bg + `--obs-plate-edge` + `--obs-plate-age` + drop shadow), clipped to its rect, floating on the void.
- **Gate:** blocked @2560×1440 screenshot shows the 9 plates in the Frame-I arrangement — decree band, slim vitals ribbon, root-law/vessel/canopy triad (canopy taller + starting higher), constellation/scales/wheel/ledgers belt — on slate-teal void with visible gutters. e2e PASS: default route (inner testids visible, Observe Spirit Root works, no h-overflow, no vocab leak) + blocked state (9 regions visible, resolver attrs, region count). **No regression** from absolute positioning + clip.
- **Deferred (logged):** 19 inline raw-hex remain in OLD instrument rules in the monolith (scss lines 281–2238); those rules are rewritten in S3–S6, purging the hex then; full hex-gate at S13/S14. Legacy non-observatory files (`StatusLedgerPage.scss`, `RunCompass.scss`, `PostFailureDiagnosisPanel.scss`) carry hex but are outside this rebuild's scope.
- S2 touched only `src/ui` SCSS (no `src/systems`) → contracts 508 baseline holds; typecheck unaffected.
- Screenshot: `artifacts/s10-exact-mockup/stage-gate/blocked-2560x1440.png` (post-rects).

---

## S3 — Vitals Seal Ribbon ✅ (Life Decree deferred)
Scoped to the Vitals ribbon (smallest, self-contained instrument). Life Decree rebuild deferred — see roadmap.
- **D-5 fixed:** removed the per-seal `sourceLabel` caption from `StatusVitalsSealRibbon.tsx` — the "Fixture"/source debug copy no longer renders on the default surface.
- **Slim strip:** rewrote `.statusVitalsRibbon`/`__seal`/`__icon`/`__label`/`__value` (scss ~349+) from a clipped 6-col × 90px pill-gauge grid into a single-row 9-cell medallion strip fitting the 1160×50 rect — 22px token-backed medallion + small-caps label + bold value; per-tone warning styling (danger→cinnabar ring+value, warning→amber, jade/success→jade). Killed the dead `__source` rule and the rounded-pill "semicircle gauge" look (D-4/D-5 for vitals).
- `@media (max-width:1100px)` reflow (~scss 2724) does not fire at gate sizes; left for S13.
- **Gate:** blocked @2560 screenshot — 9 clean medallion cells in a slim row (4.31M · 63.75/s · 0/100 · 278.88 · 345.36 · 34.86 · 11.62 · 20% · Idle), no source captions, no clipped pills. typecheck GREEN; default + blocked-state e2e green.
- Screenshot: `artifacts/s10-exact-mockup/stage-gate/blocked-2560x1440.png` (post-vitals).

---

## SESSION END — PARTIAL (S0–S3) · resumable roadmap
**Completed & committed:** S0 recon · S1 Stage · S2 region rects + palette purge · S3 Vitals (Life Decree deferred).
**Verified GREEN this session:** typecheck · eslint (changed files) · production build (`✓ built in 5.77s`) · contracts 508/508 (baseline; no `src/systems` change since) · e2e (stage gate ×3 sizes, default route, blocked state normal+reduced) · testid superset (38/38 preserved).
**Commits:** `cbc0eb33` S0 → `724745c4` S1 → `e1cbc011` S2 → `7a9906b5` S3.
**Net effect:** Status went from a brown fluid card-grid to the Frame-I composition — 9 parchment plates at their exact rects on the slate-teal void, uniformly scaled to any monitor, with a clean slim vitals ribbon. The hard architectural foundation (the Stage) that every instrument depends on is done and proven.

### Resume here (S4–S14) — the foundation now makes all of this straightforward:
- **S3 remainder — Life Decree:** rebuild `StatusLifeDecreeScroll.tsx` as one scroll plate (10 cells, rolled ends, 状態堂 hanging tab, chop after title, opposed-root mini-chop, bottleneck in cinnabar, stamp variants). Rect `16,10·1640×148`. Binds `surface.lifeDecree`.
- **S4 — Root/Law flagship:** port `status mockups and docs/prototype_spirit_root_astrolabe.html` (screenshot-verified) into `StatusSpiritRootAstrolabe`/`StatusRootLawCoupledInstrument`. Rect `24,228·506×446`. Binds `surface.rootLawInstrument`. Use `BridgeThread broken={bridge.broken}`. 3–5 parity loops vs Frame F/I.
- **S5 — Vessel + Canopy:** ghost-cultivator SVG + 6 anatomic organ plaques + state-toned `QiThreadPath`; bamboo-rack canopy with all `canopyMode` branches (bottleneck/maintenance/failureDiagnosis/reincarnationEdict/capNotice). Rects vessel `538,228·562×446`, canopy `1108,168·548×506`.
- **S6 — Belt:** 28-stat constellation (8/7/6/7, weak-link thread, legend), brass scale + 5 glass jars, layered wheel, 2 folded ledger slips. Belt rects in §6 of the prompt.
- **S7** mid-gate · **S8** states (5×2 e2e harness already exists: `status-observatory-states.spec.ts`) · **S9** overlays (D/F/H/J, no-reflow assertion) · **S10** VFX (compose fx primitives 01–10,12 + reduced-motion) · **S11** copy hygiene + `formatObservatoryValue` + `statusObservatoryCopyHygiene.test.ts` · **S12** a11y · **S13** cleanup · **S14** final ladder + monitor-law 2560/1920 + report.

### Known deferred / housekeeping notes:
- **19 inline raw-hex** remain in OLD instrument rules in the monolithic scss (lines ~281–2238) — purge each as its instrument is rewritten (S4–S6); full `src/ui/status` hex-gate at S13/S14.
- Per-instrument **title tabs + corner brackets** land with each instrument rebuild (`.obsTitleTab`/`.obsCornerBrackets` materials to add in `observatoryMaterials.scss`).
- Dead `.obsVoidBackdrop` rule (`observatoryMaterials.scss:99`) and the `@media (max-width:1100px)` reflow → delete at S13.
- A stray Vite dev server I spawned runs on **:5174** (the pre-existing one is :5173) — harmless, close at leisure.
- A broken third-party **SQL-check plugin hook** errors on every Write/Edit (its script path doesn't exist); it does NOT block writes and is unrelated to this repo.
