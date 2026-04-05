# Phase 0 Source Lock — P0-00

## Purpose

This file is the Phase 0 operating note for UI branch safety. It exists to stop destructive rollout drift before screen recovery work starts. It is a thin entrypoint that points to Section A doctrine, not a replacement for that doctrine stack.

## Phase 0 thesis

Phase 0 keeps the vision and discards the destructive rollout logic: recovery-first, asset-preserving, additive-only governance.

## Blocking merge rule

No old scenic/background/header/icon removal until exact-screen approval.

Phase 0 default cutover permission is **no destructive cleanup**.
Operational shorthand: **default cleanup posture = no destructive cleanup**.

## Imported laws

- Preserve-first
- Enhance-first
- No infrastructure-caused regression
- No future-art excuse
- No cutover without exact-screen approval
- Readable truth stays in the DOM

## Three truth checks

- **gameplay truth**: reviewers confirm the screen still communicates correct mechanic/readiness/outcome meaning.
- **interaction truth**: reviewers confirm visible controls and states match real interaction behavior with no hidden critical state.
- **archetype truth**: reviewers confirm the surface still reads as the right screen-family archetype (hero/scenic/module/dense/ritual), not generic temporary chrome.

## Forbidden behaviors

The following are forbidden in Phase 0 packets and merges:

- stripping scenic backgrounds early;
- stripping headers/ribbons/icons early;
- broad refactors that visibly weaken live screens;
- allowing shared shell or temporary chrome to become the visible owner of a screen;
- leaving duplicate old/new headers, ribbons, or wrappers visible;
- leaving floating cutout states;
- moving run-critical truth into decorative text or hover-only states;
- bundling cleanup into unrelated packets;
- using future art / later FX as an excuse for present weakness.

## Recovery order

1. Path / Life Start
2. Cultivation
3. Status
4. World
5. Manual Pavilion
6. Techniques
7. Apothecary
8. Forge
9. Bounties / Expeditions
10. Prestige

## Where detailed doctrine lives

Use Section A doctrine for full legal detail:

- Global doctrine: `docs/ui/section-a-global-doctrine.md`
- Destructive freeze: `docs/ui/section-a-destructive-freeze.md`
- Cutover gate: `docs/ui/section-a-cutover-gate.md`
- Recovery order: `docs/ui/section-a-recovery-order.md`
- Recovery sequencing: `docs/ui/section-a-recovery-sequencing.md`

## How later packets should cite this

Future Phase 0 prompts should cite:

- `docs/ui/phase-0-source-lock.md`
- `docs/ui/phase-0-packet-register.md`
- `docs/ui/phase-0-p0-14-universal-cutover-gate.md` (operational cutover publication)
- `docs/ui/phase-0-destructive-migration-audit.md` (P0-01 canonical destructive-migration ledger handoff)
- `docs/ui/phase-0-screenshot-baseline.md` (P0-02 baseline evidence path and capture status)
- the relevant Section A doctrine file(s) for detailed law.
