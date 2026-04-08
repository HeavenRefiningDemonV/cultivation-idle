# P2-08 — InspectorPanel and InspectorDrawer convergence

## Objective

Freeze the inspector family so `InspectorPanel` is the canonical wide-layout contextual inspector and `InspectorDrawer` is the canonical narrow-layout structural fallback, with World as the only live proof surface.

## Why now

The World proof surface already uses both wide and narrow inspector paths, but it had duplicate content trees and duplicate narrow header truth. This packet locks one shared hierarchy and contract without redesigning World ownership.

## Dependency chain

- `docs/ui/phase-2-p2-04-token-sheet.md`
- `docs/ui/phase-2-p2-07-ribbon-dock-convergence.md`
- `docs/ui/phase-2-p2-06-shell-api-freeze.md` (canonical; `framecard-plaqueheader` treated as legacy alias).

## Current repo truth

- `InspectorPanel` is mounted in World wide layout (`aside` contextual inspector).
- `InspectorDrawer` is mounted in World narrow layout via a button trigger.
- `Modal` owns dialog mechanics (escape/overlay close, body lock, focus return).
- `liveSurfaceVisualManifest` tracks `InspectorPanel.scss` and `InspectorDrawer.scss`.

## Canonical InspectorPanel API table

| Field | Type | Rule |
| --- | --- | --- |
| `title`, `eyebrow`, `subtitle` | `ReactNode` | Auto-header inputs when `header` absent. |
| `header` | `ReactNode` | Custom header wins over auto-header inputs. |
| `statusArea` | `ReactNode` | Context status zone. |
| `recommendationArea` | `ReactNode` | Context recommendation zone. |
| `actions` | `ReactNode` | Header actions lane support. |
| `footer` | `ReactNode` | Optional footer zone. |
| `variant` | `'world' \| 'module' \| 'dense'` | Bounded contextual variants. |
| `density` | `'compact' \| 'default'` | Bounded density variants. |
| `tone` | `'paper' \| 'ink'` | Bounded tone variants. |
| `sticky` | `boolean` | Wide-layout sticky behavior switch. |
| `emptyZoneBehavior` | `'reserve' \| 'collapse'` | Explicit empty-zone policy (default reserve). |
| `className`, `headerClassName`, `bodyClassName`, `footerClassName` | `string` | Compatibility hooks. |
| `hostAttrs` | bounded host attrs | `id`, `role`, `style`, `aria-*`, `data-*`. |

## Canonical InspectorDrawer API table

| Field | Type | Rule |
| --- | --- | --- |
| `open` | `boolean` | Controls narrow fallback visibility. |
| `onClose` | `() => void` | Canonical close callback (overlay/escape/button). |
| `title` | `string` | Accessible drawer label source. |
| `headerMode` | `'title' \| 'close-only'` | Prevents duplicate visible header truth when panel owns title. |
| `closeLabel` | `string` | Explicit close-button aria label. |
| `className`, `panelClassName` | `string` | Compatibility hooks. |
| `hostAttrs` | bounded host attrs | `id`, `role`, `style`, `aria-*`, `data-*`. |
| `children` | `ReactNode` | Shared inspector hierarchy content. |

## Wide vs narrow fallback contract

- Wide (`!isNarrowInspectorLayout`): sticky `InspectorPanel` in right inspector region.
- Narrow (`isNarrowInspectorLayout`): `uiNoShift` trigger opens `InspectorDrawer`.
- Breakpoint query is centralized as `WORLD_INSPECTOR_NARROW_QUERY`.
- Drawer auto-closes when leaving narrow layout.
- Narrow drawer uses `headerMode='close-only'` so the inner `InspectorPanel` remains the single visible title/subtitle owner.

## Zone order and empty-zone policy

Inspector hierarchy order remains:
1. status area
2. recommendation area
3. body (city summary → inline onboarding → quick-open chips → RunCompass → alerts/empty state)
4. footer (optional)

Empty-zone policy is explicit via `emptyZoneBehavior`:
- `reserve` (default): keeps stable reserved shells for status/recommendation.
- `collapse`: explicitly hides empty zones.

## World proof-surface description

- World remains map-owned (`CityMapHub` + module groups remain primary).
- Inspector remains contextual support.
- Wide and narrow now consume one shared `worldInspectorBody` content tree to prevent drift.
- Full `RunCompass` and alert surfaces remain in the DOM on both paths.

## Preserve / enhance / defer

- **Preserve:** map ownership, world routing, module cards, city selector, RunCompass presence, no-shift drawer trigger.
- **Enhance:** inspector API clarity, explicit zone policy, drawer labeling/focus behavior, shared content tree.
- **Defer:** inspector adoption on other screens, broader modal lifecycle overhaul, token retuning, art work.

## Non-goals

- No World map/module-card redesign.
- No TopRibbon/BottomNavDock/ScenicLabel/RitualModalFrame work.
- No broad modal-system overhaul.
- No art requests or support-art dependencies.

## Manual QA script

1. Wide World layout: verify sticky contextual inspector and stable order.
2. Narrow World layout: open drawer, verify focus lands on close button, close via button/Escape/overlay, focus returns.
3. Verify no duplicate visible “World Details” header stack in narrow layout.
4. Verify alerts/recommendations/RunCompass coexist without vertical jitter.
5. Verify world routing and map ownership remain unchanged.

## Screenshot requirements

- Use existing World proof-surface screenshot workflow for human review evidence.
- This packet does not request any new art generation or support-art binaries.

## Acceptance gate

- `InspectorPanel` and `InspectorDrawer` contracts are explicit/frozen.
- Wide vs narrow fallback is one documented/implemented hierarchy, not two drifting trees.
- Duplicate narrow header truth is removed.
- World remains map-owned and inspector remains contextual.
- No screen redesign or art work was performed.
