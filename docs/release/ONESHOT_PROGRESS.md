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
- [ ] **S2** Palette purge + Frame-I region rects + plate materials/title tabs
- [ ] **S3** Life Decree + Vitals Ribbon
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
