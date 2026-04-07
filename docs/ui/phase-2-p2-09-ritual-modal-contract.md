# P2-09 — RitualModalFrame and modal-lifecycle contract

## Objective

Freeze `RitualModalFrame` as the canonical ritual-modal shell and lock deterministic lifecycle behavior across the live ritual family (Prestige Ritual, Current Chapter Exhausted, Life Summary, Change Heart Law) without redesigning modal content.

## Why now

Ritual shell zones existed but precedence/lifecycle ownership were partially implicit. Focus and scroll ownership also had split-risk (close button outside trap boundary, potential nested scroll). P2-09 hardens those contracts.

## Dependency chain

- `docs/ui/phase-2-p2-04-token-sheet.md`
- `docs/ui/phase-2-p2-07-ribbon-dock-convergence.md`
- `docs/ui/phase-2-p2-08-inspector-panel-drawer.md`
- `docs/ui/phase-2-p2-06-framecard-plaqueheader.md` / `docs/ui/phase-2-p2-03-shared-motion-token-normalization.md` where present.

## Current repo truth

- `RitualModalFrame` remains the ritual shell owner used by:
  - `PrestigeRitualModal`
  - `CurrentChapterExhaustedModal`
  - `LifeSummaryModal`
  - `ChangeHeartLawModal`
- `InkModalFrame` remains structural modal owner (backdrop/dialog shell/Escape/overlay/close button).
- Section C surface IDs and existing evidence-folder roots remain unchanged.

## Canonical RitualModalFrame API table

| Field | Type | Rule |
| --- | --- | --- |
| `open`, `onClose` | `boolean`, `() => void` | Required lifecycle entry points. |
| `title`, `subtitle`, `meta` | `ReactNode` | Auto-header inputs. |
| `header` | `ReactNode` | Custom header wins over auto-header inputs. |
| `ornament` | `ReactNode` | Symbolic support zone only. |
| `footer` | `ReactNode` | Action lane zone. |
| `variant` | `'ritual' \| 'chapterEnd' \| 'summary'` | Ritual shell variants. |
| `size` | `'md' \| 'lg'` | Ritual shell size set. |
| `scrollBody` | `boolean` | Ritual body scroll owner toggle. |
| `showCloseButton` | `boolean` | Structural close affordance toggle. |
| `className`, `panelClassName`, `bodyClassName`, `footerClassName` | `string` | Compatibility hooks. |
| `ariaLabel`, `ariaLabelledBy` | `string` | Explicit dialog-label contract. |
| `children` | `ReactNode` | Modal truth content (unchanged by this packet). |

## Lifecycle ownership contract

- **RitualModalFrame owns:**
  - focus trap rules
  - initial focus target selection
  - restore-focus safety
  - body scroll lock + scrollbar compensation
  - ritual body scroll-shadow state
  - reduced-motion class toggle semantics
- **InkModalFrame owns:**
  - backdrop
  - dialog role / modal semantics
  - overlay click close
  - Escape close
  - close button shell

The split remains explicit and non-conflicting.

## Focus / close / restore semantics

- Focus scope for trap now uses the modal panel host (includes close button in the same focus model).
- Initial focus resolves to the first focusable inside panel scope.
- Tab/Shift+Tab wrap deterministically within the panel scope.
- Restore focus checks `isConnected` before focusing to avoid stale-element errors.

## Scroll ownership and shadow contract

- `scrollBody=true` => ritual body owns scrolling, and `InkModalFrame` panel switches to non-scrolling (`contentScrollOwner`) to avoid nested-scroll ambiguity.
- Scroll shadows are derived from the real ritual body scroll container only.
- `scrollBody=false` => no ritual scroll-shadow state is applied.

## Reduced-motion rule

- Reduced-motion state is tracked via live `matchMedia('(prefers-reduced-motion: reduce)')` subscription rather than one-shot read.
- Ritual open/content animations are disabled via `ritualModalFrame--static` when reduced motion is active.

## Proof surfaces preserved

- `src/components/modals/PrestigeRitualModal.tsx`
- `src/components/modals/CurrentChapterExhaustedModal.tsx`
- `src/components/modals/LifeSummaryModal.tsx`
- `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx`

## Preserve / enhance / defer

- **Preserve:** all modal inner truth content and action semantics; no-shift selectors stay intact.
- **Enhance:** shell API freeze, lifecycle/focus/scroll/reduced-motion determinism, labeling contract clarity.
- **Defer:** broad modal-system redesign, scenic/art work, content redesign, non-ritual modal overhaul.

## Non-goals

- No redesign of Prestige / Chapter Exhausted / Life Summary / Change Heart Law content hierarchy.
- No Section C route or evidence-root replacement.
- No token-sheet or global motion retune packet scope expansion.

## Manual QA script

1. Open each ritual modal from real trigger and verify:
   - close button in tab order
   - Escape + overlay + close button close behavior
   - safe focus restore after close
2. Verify `scrollBody=true` modal paths on narrow viewport:
   - single effective scroll owner
   - scroll shadows match body scroll state
3. Verify reduced-motion route (`fx=reduced`) removes non-essential flourish while keeping clarity.
4. Confirm no changes to modal inner truth blocks and action semantics.

## Screenshot requirements

- Reuse existing Section C routes and evidence folders:
  - `prestige-ritual`
  - `current-chapter-exhausted`
  - `life-summary`
  - `change-heart-law`
- Do not create new screenshot roots in this packet.

## Acceptance gate

- Ritual modal API and precedence rules are explicit/frozen.
- Lifecycle ownership split is explicit and deterministic.
- Close button participates in intentional focus model.
- Scroll ownership is single-source in scroll-body mode.
- Reduced motion is live and calm.
- No modal-content redesign or art work was introduced.
