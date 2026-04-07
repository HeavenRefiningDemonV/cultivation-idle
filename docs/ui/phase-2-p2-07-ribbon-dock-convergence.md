# P2-07 — TopRibbon and BottomNavDock convergence

## Objective

Freeze `TopRibbon` and `BottomNavDock` as stable shared-shell families, keep `BottomTabBar` as the explicit live compatibility wrapper for global navigation, and reduce label drift by using canonical shell label helpers where live ribbon/dock wording duplicates top-level destinations.

## Why now

After P2-04 token normalization and P2-05 material convergence, ribbon/dock shell primitives are already live but still relied on implicit contract behavior. P2-07 locks API/usage law without redesigning screen ownership.

## Dependency chain

- `docs/ui/phase-2-p2-04-token-sheet.md`
- `docs/ui/phase-2-p2-05-material-primitive-convergence.md`
- fallback to Section A / Phase 1 doctrine when P2-06 filename variants differ across branches.

## Current repo truth (verified in this packet)

- `TopRibbon` live consumers: `WorldScreen`, `PrestigeScreen`.
- `BottomNavDock` live path: `BottomTabBar` compatibility wrapper in `GameLayout`.
- Canonical tab labels are sourced from `getShellTabLabel()` / `SHELL_TAB_LABELS`.
- `BottomTabBar.scss` remains a tracked compatibility stylesheet entrypoint.

## Canonical TopRibbon API (frozen)

| Field | Type | Rule |
| --- | --- | --- |
| `variant` | `'hero' \| 'world' \| 'dense'` | Shallow orientation strip variants only. |
| `density` | `'compact' \| 'default'` | Compact/default shell density only. |
| `tone` | `'paper' \| 'ink'` | Material tone only; no decorative overhaul channels. |
| `title`, `subtitle`, `eyebrow`, `meta` | `ReactNode` | Auto-header inputs. |
| `header` | `ReactNode` | **Precedence wins** over auto-header inputs. |
| `startSlot`, `endSlot` | `ReactNode` | Bounded side slots; no second card-row behavior. |
| `items` | `TopRibbonItem[]` | Small info chips/custom item rows only. |
| `className`, `contentClassName` | `string` | Compatibility styling hooks. |
| `hostAttrs` | bounded host attrs | `id`, `role`, `style`, `aria-*`, `data-*`. |

Header precedence law: when `header` is supplied, auto-header props are ignored (dev warning emitted to prevent accidental double truth).

## Canonical BottomNavDock API (frozen)

| Field | Type | Rule |
| --- | --- | --- |
| `items` | `BottomNavDockItem[]` | Narrow global top-level nav model. |
| `indicator` | `'none' \| 'recommended' \| 'attention'` | Limited semantic indicator vocabulary only. |
| `className`, `itemClassName` | `string` | Compatibility hooks for current live wrapper/styles. |
| `preserveLegacyHooks` | `boolean` | Keeps `BottomTabBar*` class hooks alive for tracked surfaces. |
| `hostAttrs` | bounded host attrs | `id`, `role`, `style`, `aria-*`, `data-*`. |

Dock law: global top-level navigation owner only; no icon-grid, counter badges, or multi-row module chooser expansion.

## BottomTabBar compatibility policy

- `BottomTabBar` stays the live wrapper around `BottomNavDock`.
- Top-level tab order remains: `status`, `cultivation`, `adventure`, `inventory`, `techniques`, `prestige`, `settings`.
- Compatibility hooks remain enabled (`preserveLegacyHooks`, `bottomTabBarButton`, `uiNoShift`).
- Policy is codified in `BOTTOM_TAB_BAR_COMPAT_POLICY`.

## Label-sourcing rules

- Top-level dock labels must use `getShellTabLabel()`.
- World and Prestige ribbon titles normalize to `getShellTabLabel('adventure')` and `getShellTabLabel('prestige')`.
- Do not broaden into global copy rewrites in this packet.

## Live consumers

- `src/components/screens/WorldScreen.tsx`
- `src/components/screens/PrestigeScreen.tsx`
- `src/components/BottomTabBar.tsx`
- `src/components/GameLayout.tsx`

## Non-canonical / future-adoption classification

- `ManualPavilionPanel` (`pavilionTopRibbon`): local screen-owned header; **future adoption target**, not migrated in P2-07.
- `TechniqueLibraryScreen` (`techTopRibbon`): local screen-owned header; **future adoption target**, not migrated in P2-07.
- `ApothecaryPanel` (`apothecaryTopRibbon`): local screen-owned header; **future adoption target**, not migrated in P2-07.
- `Sidebar`, `TabNav`: **legacy non-live nav surfaces** (not mounted by `GameLayout`); retained and documented, not removed.

## Preserve / enhance / defer

- **Preserve:** current live World/Prestige ribbon usage and BottomTabBar no-shift compatibility hooks.
- **Enhance:** explicit API option registries, bounded host attrs, precedence law, canonical label sourcing.
- **Defer:** module-screen TopRibbon adoption, legacy nav quarantine/removal, inspector/drawer/ritual/scenic convergence packets.

## Non-goals

- No InspectorPanel/InspectorDrawer/RitualModalFrame/ScenicLabel work.
- No screen redesign or IA changes.
- No support-art requests or asset/binary dependencies.

## Manual QA script

1. Launch app and verify `GameLayout` still mounts `BottomTabBar`.
2. Confirm bottom tab order and active-state readability/no-shift.
3. Verify World ribbon remains shallow; city selector `endSlot` works.
4. Verify Prestige ribbon remains coherent with stamp end slot.
5. Smoke-check Manual Pavilion / Techniques / Apothecary headers remain unchanged.
6. Verify High/Low/Reduced motion still render ribbon/dock coherently.
7. Confirm no duplicate global nav systems appear.

## Screenshot requirements

- Standard packet proof screenshots should follow existing release workflow surfaces.
- This packet is shell-contract convergence and does not request new art captures by itself.

## Acceptance gate

- TopRibbon and BottomNavDock contracts are explicit/frozen.
- BottomTabBar remains the single live compatibility wrapper.
- Canonical shell labels are used for dock + live duplicate destination ribbon titles.
- Legacy/ad hoc header/nav surfaces are explicitly classified and deferred.
- No destructive cleanup or screen redesign was performed.
