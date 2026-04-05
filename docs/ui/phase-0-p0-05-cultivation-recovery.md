# P0-05 — Cultivation recovery

## Purpose

Restore/harden Cultivation as one stable sacred owner while preserving the existing cultivator/dantian center and current truthful gameplay surfaces, without expanding into full hero-completion work.

## Dependency state

- Core packet/doctrine docs present and consumed: `AGENTS.md`, codex packet docs, Section A doctrine stack.
- Phase 0 docs present and consumed: `phase-0-source-lock`, `phase-0-packet-register`, `phase-0-destructive-migration-audit`, `phase-0-destructive-migration-ledger`, `phase-0-screenshot-baseline`, `phase-0-screenshot-manifest`.
- Cultivation baseline/cutover docs present and consumed: `docs/release/qa/ui-cutover/cultivation/*`, `docs/release/qa/ui-cutover/section-d-baseline-index.md`, `docs/ui/section-d-hero-screen-signoff.md`.
- Prompt-requested `.docx` files are absent in this snapshot (no matching files found), so this packet used the in-repo doctrine/baseline records as current source of truth.

## Current snapshot findings

- Sacred ownership status: **intact**. Central cultivator/dantian remains the clear scenic owner.
- Core truth status: **intact**. Top key bar, dominant Qi bar, readiness state, and breakthrough controls are all present in code and retained.
- Duplicate/generic residue status: **present (fix-now)** in two local forms:
  1. Cultivation still wrote to legacy `setHeaderTitles` channel despite local ribbon ownership.
  2. A stray debug-like `.important-class` style block remained in `CultivateScreen.scss` as non-doctrinal residue.
- Verse status: **not broken; unfinished debt only**. Verse is already docked inside doctrine surfaces and not acting as a second global anchor.
- Lotus status: **not broken; unfinished debt only**. Lotus-state icon is present, paired with text/state labels, and semantically readable.
- FX/readability status: no fix-now change required in this packet for Cultivation FX scene.

## What was already correct and preserved

- Central cultivator/dantian scenic ownership.
- Top key bar + dominant Qi bar + readiness/breakthrough truth surfaces.
- Existing breakthrough and doctrine support panel architecture.
- Existing Verse and lotus truth surfaces (no broad redesign).
- Existing gameplay/store logic and no-change posture for Cultivation mechanics.

## Recovery changes

- Removed legacy header-title channel write from `CultivateScreen.tsx` (`setHeaderTitles` side effect), keeping Cultivation ownership local to current ribbon/screen surfaces.
- Removed stray `.important-class` residue from `CultivateScreen.scss` to reduce half-migrated/local-noise risk in the Cultivation surface stylesheet.
- Updated `CultivationHeaderRibbon` default collapse behavior so first-open state keeps the top key bar visible by default (while still preserving persisted user preference in local storage once set).

## Verse decision

- **Decision: already-stable / defer full redesign.**
- Verse is readable and docked under doctrine-owned surfaces; no competition-level breakage was identified that justified structural re-architecture in P0-05.
- Full Verse compositional polish remains deferred to later full Cultivation pass.

## Lotus decision

- **Decision: already-stable / defer full redesign.**
- Lotus-state surface is present and paired with textual state (`Idle`, `Flowing`, `Ready`) in the top key bar.
- No icon-family or full sacred-ornament pass was performed in this packet.

## Deferred full-cultivation-pass work

- Full altar/ring/halo hero completion pass.
- Full atmosphere/Pixi polish pass.
- Broader Verse placement/presentation completion work beyond current stable docking.
- Broader lotus iconography/polish beyond current readable state surface.
- Any cross-screen or token-level architecture changes.

## Files changed

- `src/components/screens/CultivateScreen.tsx`
- `src/components/screens/CultivateScreen.scss`
- `src/ui/cultivation/CultivationHeaderRibbon.tsx`
- `docs/ui/phase-0-p0-05-cultivation-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-05-cultivation/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence

- Added packet after-state evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-05-cultivation/`.
- Screenshot status for this runtime: **manual-pending** (no approved browser/image capture pipeline available).
- README contains exact manual checklist and capture routes for default/high/low/reduced + interaction/truth-state slots.

## Verification results

Commands run:
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`

No extra broad suites were run because this packet did not modify doctrine presentation helper modules or non-local gameplay logic.

## Scope confirmation

- Recovery/hardening packet only.
- No new art created.
- No full Cultivation hero pass implemented.
- No shared-shell expansion/refactor packet work.
- No Status/World or cross-screen redesign work included.
