# Packet B.6 — BottomNavDock and Primary Shell Navigation

## 1) Purpose of B.6
B.6 converges the live fixed footer navigation into a reusable chrome primitive (`BottomNavDock` + `NavDockButton`) while preserving existing tab IA, internal tab ids, layout reserve, and no-layout-shift behavior.

## 2) Dependency on B.1–B.5
B.6 assumes prior packets are in place:
- B.1 ownership barrel (`src/ui/chrome/index.ts`)
- B.2 token/layer normalization
- B.3 `FrameCard` shell ownership
- B.4 plaque/ribbon family
- B.5 chip/stamp convergence

## 3) Current repo nav truth inventory
- **BottomTabBar**: live nav state wiring from `uiStore`, fixed footer classes, label source from `getShellTabLabel(...)`.
- **GameLayout**: still mounts `<BottomTabBar />` and reserves content height using `var(--ui-bottom-nav-total)`.
- **uiStore tab ids** (locked): `status`, `cultivation`, `adventure`, `inventory`, `techniques`, `prestige`, `settings`.
- **playerFacingLabels**: keeps `adventure` internal id mapped to visible `World` label.
- **life-start dependency**: `body.lifePathMode .bottomTabBar { display: none !important; }` must continue to work.
- **release visual manifest dependency**: nav ownership/`uiNoShift` diagnostics must remain truthful.

## 4) Canonical ownership decision
- Canonical shared owners:
  - `src/ui/chrome/BottomNavDock`
  - `src/ui/chrome/NavDockButton`
- `src/components/BottomTabBar.tsx` is now a compatibility wrapper over canonical owners.

## 5) Canonical API for `BottomNavDock`
`BottomNavDockItem`
- `id: string`
- `label: string`
- `icon?: ReactNode`
- `disabled?: boolean`
- `notificationMarked?: boolean`
- `title?: string`

`BottomNavDockProps`
- `items: BottomNavDockItem[]`
- `activeId: string`
- `onSelect: (id: string) => void`
- `ariaLabel?: string`
- `className?: string`

## 6) Canonical API for `NavDockButton`
- `label: ReactNode`
- `icon?: ReactNode`
- `active?: boolean`
- `disabled?: boolean`
- `notificationMarked?: boolean`
- `onClick?: () => void`
- `className?: string`
- `title?: string`

## 7) Wrapper mapping table
| legacy file | old responsibility | new canonical mapping | preserved compatibility classes |
| --- | --- | --- | --- |
| `src/components/BottomTabBar.tsx` | live DOM owner + state + styling coupling | state/label adapter that feeds canonical `BottomNavDock` items | `bottomTabBar`, `bottomTabBarInner`, `bottomTabBarList`, `bottomTabBarButton`, `bottomTabBarButton--active` |
| `src/components/BottomTabBar.scss` | real visual owner | compatibility import bridge to canonical dock/button styles | same class family remains styled |

## 8) Styling ownership rules
- Real owners:
  - `src/ui/chrome/BottomNavDock.scss`
  - `src/ui/chrome/NavDockButton.scss`
- Compatibility-only:
  - `src/components/BottomTabBar.scss`

## 9) Z-layer, safe-bottom, and layout-reserve rules
- Dock uses tokenized nav layering: `var(--ui-layer-chrome-dock, var(--ui-layer-bottom-nav))`.
- No raw nav layer values are used in canonical dock styles.
- Dock layout uses `--ui-safe-bottom`, `--ui-bottom-nav-total` semantics.
- Game content reserve remains `calc(100vh - var(--ui-bottom-nav-total))` in layout shell.

## 10) Selected / disabled / notification-marked state rules
- **Selected**: active class increases emphasis via color/border/shadow without border-width or padding growth.
- **Disabled**: muted and non-clickable but still readable.
- **Notification-marked**: bounded corner mark (`navDockButton__mark`) with fixed footprint.
- **Hover/focus**: tokenized lift/tint only, no layout shift.

## 11) Explicit non-goals
- No tab order/id change.
- No global shell redesign.
- No scene-specific nav FX.
- No top-ribbon, header, or scenic world navigation expansion.
- No asset generation.

## 12) Manual QA and acceptance criteria
Manual QA focus:
- Cultivation/World/Techniques/Prestige/Settings tab visibility and selected state clarity.
- `adventure` internal id still shows `World` label.
- life-start mode continues hiding dock via `.bottomTabBar` root class.
- narrow width horizontal scroll remains usable.
- overlays/modals/toasts layer above dock where expected.

Acceptance:
- canonical dock/button own visuals and DOM behavior,
- wrapper preserves legacy tab truth,
- no-layout-shift controls remain (`uiNoShift` on real button root),
- release diagnostics reflect canonical ownership,
- layout reserve contract remains intact.
