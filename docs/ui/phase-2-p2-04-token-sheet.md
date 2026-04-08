# P2-04 — Paper / ink token normalization and backward-compatible alias cleanup

## Packet objective
Harden `src/styles/paperInkTokens.scss` as the single shared-token source for palette, shell surfaces, layout rhythm, size minima, typography scale, and compatibility aliases, while keeping existing screens visually stable.

## Why now
P2-01 locked runtime split and P2-02 locked screen FX contract surfaces. The remaining drift risk is token truth fragmentation across raw literals, legacy aliases, and bridge vars.

## Dependency chain
- Uses Phase 2 runtime/FX constraints from:
  - `docs/ui/phase-2-p2-01-runtime-split.md`
  - `docs/ui/phase-2-p2-02-screen-fx-contract.md`
- P2-03 doc is present in-repo; canonical doctrine references:
  - `docs/ui/renderer-stack-foundation.md`
  - `docs/ui/phase-1-phase2-handoff.md`
  - `docs/ui/phase-1-exit-audit.md`
  - `docs/ui/section-a-global-doctrine.md`
  - `docs/ui/section-a-layout-stability-rules.md`
  - `docs/ui/section-a-screen-family-matrix.md`
  - `docs/ui/section-a-touchpoint-registry.md`
  - `docs/ui/section-a-screenshot-approval-workflow.md`

## Current repo truth (before packet)
- Canonical `--paper-*` palette/surface/shadow tokens already existed.
- `inkTheme.scss` already bridged `--paper-*` into `--ink-*`.
- Structural design-lock values (page width/padding, typography, row/chip/button minima) were not fully encoded as canonical `--ui-*` tokens.
- Compatibility aliases were partly present, but legacy paper aliases (`--paper-border`, `--paper-bg-*`, `--paper-shadow`) were not centralized in the canonical token sheet.

## Canonical token taxonomy
- `--paper-*` = canonical material system (palette, semantic roles, shell surfaces, depth shadows, chip state fills/borders, texture/backdrop).
- `--ink-*` = derived bridge namespace for ink components; no independent design-truth ownership.
- `--ui-*` = structural/shared shell law (layout rhythm, spacing, size minima, typography scale, reserved badge slots, motion vars/aliases).

## Canonical token table (P2-04)

### Structural shell tokens (`--ui-*`)
- `--ui-layout-page-max-inline: 1280px`
- `--ui-layout-page-pad-inline: 16px`
- `--ui-layout-section-gap: 16px`
- `--ui-layout-card-gap: 12px`
- `--ui-space-card-pad-default: 16px`
- `--ui-space-card-pad-compact: 12px`
- `--ui-size-button-min-block: 36px`
- `--ui-size-chip-min-block: 22px`
- `--ui-size-row-min-block: 44px`
- `--ui-size-progress-block: 8px`
- `--ui-type-page-title: 20px`
- `--ui-type-section-title: 18px`
- `--ui-type-card-title: 16px`
- `--ui-type-body: 14px`
- `--ui-type-meta: 12px`
- `--ui-type-button: 14px`

### Semantic palette coverage (`--paper-*`)
- safe/ready: `--paper-jade`, `--paper-success`, `--paper-complete`
- caution: `--paper-amber`, `--paper-warning`, `--paper-gold` (compat alias)
- critical: `--paper-stamp`, `--paper-danger`
- structural emphasis: `--paper-rare`, `--paper-bronze`
- explanatory text: `--paper-ink-muted`, `--paper-ink-faint`

### Compatibility aliases preserved intentionally
- Legacy base aliases: `--paper-0`, `--paper-1`, `--ink-0`, `--ink-1`, `--seal-red`, `--jade`, `--gold`, `--shadow-soft`, `--shadow-strong`.
- Shell compatibility aliases: `--paper-shell-base`, `--paper-shell-muted`, `--paper-shell-border`, `--paper-shell-outline`, `--paper-shell-active`, `--paper-shell-active-subtle`, `--paper-progress-fill`, `--paper-scrollbar-*`, `--paper-shadow-soft`, `--paper-shadow-strong`.
- Legacy paper aliases still used by compatibility surfaces: `--paper-border`, `--paper-outline`, `--paper-bg`, `--paper-bg-strong`, `--paper-bg-soft`, `--paper-shadow`.

## Compatibility-only consumers
Consumers outside canonical shell primitives (such as `TabNav`, `TrialProgress`, `DetailScrollModal`, `uiPanelChrome`) remain compatibility surfaces in this packet and are supported through alias shims rather than broad refactors.

## Deferred to P2-05+
- Full `ui/ink` vs `ui/paper` primitive convergence.
- Broad screen-level SCSS cleanup.
- Non-token visual redesign.

## QA commands
- `npm run typecheck`
- `npm run build`
- `npm run test:contracts`

## Manual QA checklist
1. World screen: ribbon, scenic labels, inspector shell, bottom dock remain coherent.
2. Status screen: card/chip spacing and diagnostics remain stable.
3. Ink modal: frame/backdrop/close affordance remains legible.
4. Bounty + expedition paper surfaces remain stable via compatibility aliases.
5. TabNav / TrialProgress / DetailScrollModal continue to render with legacy alias paths.
6. Hover/selected states in shared shell surfaces do not produce layout shift.
7. Reduced Motion / High FX / Low FX mode switching does not expose missing token fallbacks.

## Acceptance gate
Packet passes when:
- one canonical shared token sheet owns material + structural laws,
- ink bridge remains derived and readable,
- required structural lock values are tokenized,
- legacy aliases are explicit and intentional,
- packet-scoped contract tests prove token + alias + consumer guardrails.
