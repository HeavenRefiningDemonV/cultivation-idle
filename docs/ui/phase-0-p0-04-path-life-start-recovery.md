# P0-04 — Path / Life Start recovery

## Purpose

Restore/harden the first-contact Life Start surface so Step 1 keeps one scenic owner (portrait-led triptych) without expanding into Phase 3 ritual polish or gameplay truth redesign.

## Dependency state

- Required Section A + codex packet docs: present and reviewed.
- Section C baseline docs + life-start cutover READMEs: present and reviewed.
- Existing Phase 0 docs: present and consumed (`phase-0-source-lock`, `phase-0-packet-register`, `phase-0-destructive-migration-audit`, `phase-0-destructive-migration-ledger`, `phase-0-screenshot-baseline`, `phase-0-screenshot-manifest`).

## Current snapshot findings

- **Step 1 (Path)**: already structurally correct (fullscreen, triptych, portrait-led owner, attached preview plaque).
- **Step 1 residue found** (`fix-now`): life-start path surface used low z-index shell values and only hid bottom tabs, leaving generic global overlays (city-arrival/onboarding/toasts) available to intrude above/beside first-contact scenic ownership.
- **Step 2 (Heart Law)**: live and functional with readable lock/unlock/resonance truth; still generic/non-final presentation but **not broken** (`defer-to-phase-3`).
- **Step 3 (Breath Focus)**: remains forced-only in audit context and not a normal live route (`defer-to-phase-3`).
- `SelectionFxScene.tsx`: not mounted as a destructive dependency in the life-start owner chain (`already-stable` for P0-04 scope).
- `PathSelectionModal.tsx`: absent; not recreated.

## What was already correct and preserved

- Portrait-led Step 1 triptych ownership.
- Existing path gameplay truth and doctrine summaries.
- Attached/adjacent preview plaque relationship.
- Existing `body.lifePathMode .bottomTabBar` suppression rule.
- Heart Law lock/unlock/resonance truth surfaces and current Ink/paper modal stack.
- Breath Focus flow and gating behavior (no Step 3 redesign).

## Path-step recovery changes

- Hardened life-start shell stacking so Step 1/step modal shell reliably sits above unrelated app overlays:
  - `lifeStartWizardOverlay` z-index `70 -> 1300`
  - `lifeStartWizardFrame` z-index `80 -> 1300`
- Added explicit path-mode suppression for intrusive generic overlays during Step 1 ownership:
  - `.cityArrivalBannerShell`
  - `.onboardingPromptHost`
  - `.notificationToasts`

These are local containment changes only; no triptych composition redesign, no portrait swap, and no shell-family migration was introduced.

## Heart-law touch / defer decision

- Runtime Heart Law UI was **not changed**.
- Decision: **defer** premium or structural Heart Law redesign to later packet family; current Step 2 remains functional and readable for lock/unlock/resonance truth.

## Breath-focus no-regression note

- Breath Focus step was not modified.
- P0-04 shell hardening did not alter Breath Focus logic, mode selection behavior, or finish CTA flow.

## Files changed

- `src/components/modals/LifeStartWizardModal.scss`
- `docs/ui/phase-0-p0-04-path-life-start-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-04-path-life-start/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence

- Added packet evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-04-path-life-start/`.
- Screenshot status in this runtime: **manual-pending** (no approved capture tool available in this Codex runtime).
- README includes exact harness URLs and required capture slots for:
  - path high/low/reduced
  - interaction/base slots
  - optional narrow slot

## Verification results

Commands run:
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`

Narrow helper tests were not run because P0-04 did not touch doctrine presentation helpers or Heart Law presentation helper logic.

## Scope confirmation

- Recovery/hardening packet only (not ritual redesign).
- No new art created.
- No gameplay path truth/store rewrites.
- No shared-shell expansion/refactor packet work.
- No Step 2/Step 3 redesign was smuggled into this patch.
