# Phase 2 Proof-Surface Register

## Purpose

Define exactly which live surfaces Phase 2 uses as bounded proof surfaces so shared-shell/shared-FX work does not drift into mass screen cutover.

## Current git basis (verified from repo)

- Branch: `work`
- Short commit: `3233f63`
- Detached HEAD: `no`

## Definitions

### Proof surface (Phase 2)

A proof surface is a live screen where shared Phase 2 substrate (shell/fx/chrome primitives) is already present or explicitly being validated, while preserving screen-specific owner truth.

### Consumer but out of scope for full cutover

A consumer can import/use shared primitives yet remain out of scope for full thematic cutover in Phase 2. Import presence alone does not grant full-screen ownership transfer or cleanup authority.

## Primary proof surfaces

### 1) `world` — `src/components/screens/WorldScreen.tsx`

- **Owner files:**
  - `src/components/screens/WorldScreen.tsx`
  - `src/components/screens/WorldScreen.scss`
  - linked shell surface: `src/components/screens/CityMapHub.tsx`
- **Existing owner that must remain intact:** city/map ownership on World.
- **Already-used shell/fx features:**
  - `TopRibbon`
  - `InspectorPanel`
  - `InspectorDrawer`
  - `ScenicLabel` (via `CityMapHub`)
  - no live ScreenFxStage scene in current World screen path.
- **P2 packets allowed to touch:** `P2-02`, `P2-05`, `P2-08`, `P2-10` (and governance packets as docs-only).
- **Explicitly deferred:** full world-family thematic completion and module-screen full theming (later phases).
- **Required screenshot evidence for later touching packets:** use `docs/release/qa/ui-cutover/<screen-id>/` with Section A core slots (`01-base`..`06-reduced-motion`), using the exact approved World screen id.

### 2) `cultivation` — `src/components/screens/CultivateScreen.tsx`

- **Owner files:**
  - `src/components/screens/CultivateScreen.tsx`
  - `src/components/screens/CultivateScreen.scss`
- **Existing owner that must remain intact:** central altar/cultivator ownership.
- **Already-used shell/fx features:**
  - `ScreenFxStage`
  - `FxStagePortal`
  - `FxQualityProvider` hooks (`useFxQuality`, `useFxStageSnapshot`)
  - runtime contract builder + `CultivationFxScene`
- **P2 packets allowed to touch:** `P2-01`, `P2-06`, `P2-11` (QA inheritance), `P2-13` (no-cleanup guardrails).
- **Explicitly deferred:** hero-family art completion and broader cultivation thematic overhaul.
- **Required screenshot evidence for later touching packets:** use `docs/release/qa/ui-cutover/<screen-id>/` with Section A core slots, using the exact approved Cultivation screen id.

### 3) `status` — `src/components/screens/StatusScreen.tsx`

- **Owner files:**
  - `src/components/screens/StatusScreen.tsx`
  - `src/components/screens/StatusScreen.scss`
- **Existing owner that must remain intact:** diagnostic center / troubleshooting chamber ownership.
- **Already-used shell/fx features:**
  - `ScreenFxStage`
  - `FxStagePortal`
  - `FxQualityProvider` hooks (`useFxQuality`, `useFxStageSnapshot`)
  - runtime contract builder + `StatusFxScene`
- **P2 packets allowed to touch:** `P2-01`, `P2-07`, `P2-11`, `P2-13`.
- **Explicitly deferred:** broader status-family aesthetic completion outside shared substrate proof goals.
- **Required screenshot evidence for later touching packets:** use `docs/release/qa/ui-cutover/<screen-id>/` with Section A core slots, using the exact approved Status screen id.

## Secondary proof consumers (not primary shell-cutover screens)

| File | Classification | Notes |
| --- | --- | --- |
| `src/components/screens/PrestigeScreen.tsx` | meaningful shell consumer (secondary) | Uses `TopRibbon` and shell `PaperStamp`; not designated primary P2 proof surface. |
| `src/components/modals/PrestigeRitualModal.tsx` | meaningful shell consumer (secondary) | Uses `RitualModalFrame`; bounded modal proof, not full Prestige screen cutover authority. |
| `src/components/modals/CurrentChapterExhaustedModal.tsx` | meaningful shell consumer (secondary) | Uses `RitualModalFrame` with chapter-end variant. |
| `src/components/modals/LifeSummaryModal.tsx` | meaningful shell consumer (secondary) | Uses `RitualModalFrame` with summary variant. |
| `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx` | meaningful shell consumer (secondary) | Uses `RitualModalFrame`; remains local modal surface. |
| `src/components/BottomTabBar.tsx` | partial shell consumer (secondary) | Uses `BottomNavDock`; this is shell-routing infrastructure, not a standalone primary screen proof surface. |

## Explicit out-of-scope surfaces for Phase 2 full cutover

Even if they import shared primitives, these remain later-phase screen work for full thematic completion:

- Life Start / Path / Heart Law selection family
- Outskirts / Ruins / Gate Trial full screen theming
- Manual Pavilion / Techniques / Inventory thematic completion
- Apothecary / Forge full room theming
- Bounties / Expeditions full board theming
- broader Prestige thematic completion beyond already-live shell proof usage

## Screenshot expectations (inherited)

Phase 2 packets must reuse existing screenshot approval workflow and storage:

- Workflow: `docs/ui/section-a-screenshot-approval-workflow.md`
- Operational gate: `docs/ui/phase-0-p0-14-universal-cutover-gate.md`
- Legal gate doctrine: `docs/ui/section-a-cutover-gate.md`
- Evidence root: `docs/release/qa/ui-cutover/<screen-id>/`

No parallel screenshot root should be invented for normal screen approval.

## Art-readiness constraint

- Phase 1 support-art roots remain scaffold-only unless later packets explicitly prove packaged assets.
- No Phase 2 packet may assume support-art binaries exist by default.
- P2-00 does not imply any art request.
- Proof-surface validity does not weaken because support art is missing.

## No-cleanup-authority reminder

This register grants no cleanup permission. Phase 2 remains additive-first unless a later packet explicitly runs a cleanup request and passes the existing cutover gate with exact-screen evidence.
