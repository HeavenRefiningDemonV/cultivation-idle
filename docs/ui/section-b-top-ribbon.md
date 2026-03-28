# Packet B.7 — TopRibbon Family

## 1) Purpose of B.7
B.7 converges top-of-screen identity/context strips into a shared quiet ribbon family so hero and dense screens use one canonical language for realm/path/root/law/city context and compact status chips.

## 2) Dependency on B.1–B.6
This packet assumes:
- B.1 shared chrome barrel ownership
- B.2 token normalization
- B.3 `FrameCard` shell ownership
- B.4 shared plaque/ribbon groundwork
- B.5 canonical chip family
- B.6 shared bottom dock convergence

## 3) Current repo top-ribbon drift inventory
- `CultivationHeaderRibbon` was a bespoke local header ribbon.
- `StatusSummaryHeader` was a bespoke identity header block.
- Techniques lacked compact shared identity/context ribbon.
- Prestige lacked compact shared identity/context ribbon.

## 4) Canonical ownership decision
- Canonical owner components:
  - `TopRibbon`
  - `RibbonStat`
- `CultivationHeaderRibbon` remains a screen wrapper but composes canonical ribbon family.
- `StatusSummaryHeader` remains a screen wrapper/composition but composes canonical ribbon family.

## 5) Canonical API for `TopRibbon`
- `children: ReactNode`
- `chips?: ReactNode`
- `end?: ReactNode`
- `compact?: boolean`
- `surface?: 'none' | 'tray'`
- `className?: string`

## 6) Canonical API for `RibbonStat`
- `label: ReactNode`
- `value: ReactNode`
- `detail?: ReactNode`
- `icon?: ReactNode`
- `tone?: 'default' | 'success' | 'warning'`
- `truncate?: boolean`
- `title?: string`
- `className?: string`

## 7) Content-lane table
| Lane | Intended content |
| --- | --- |
| Realm | current realm name / stage context |
| Path | current selected path/doctrine |
| Spirit Root | compact root summary |
| Heart Law | current law + verse context |
| City/context | current city or contextual location line |
| Status chips | compact readiness/advisor/activity context (max two chips) |

## 8) Adoption table
| target file | old pattern | new mapping | preserved compatibility classes |
| --- | --- | --- | --- |
| `src/ui/cultivation/CultivationHeaderRibbon.tsx` | bespoke local ribbon row system | wrapper over `TopRibbon` + `RibbonStat` + `ChromeChip` | `cultivationHeaderRibbon`, `cultivationHeaderRibbon__panel`, `cultivationHeaderRibbon__inner`, `cultivationHeaderRibbon__handle` |
| `src/ui/status/StatusSummaryHeader.tsx` | bespoke identity header grid | top section replaced by `TopRibbon` + `RibbonStat` + chips; shortfall/combat strips remain | `statusSummaryPanel` |
| `src/components/screens/TechniqueLibraryScreen.tsx` | title row only | compact direct `TopRibbon` adoption above BuildAltarSummary | screen placement classes only |
| `src/components/screens/PrestigeScreen.tsx` | title row only | compact direct `TopRibbon` adoption under top header and above RunCompassCompact | screen placement classes only |

## 9) Styling ownership rules
- Shared look owners:
  - `src/ui/chrome/TopRibbon.scss`
  - `src/ui/chrome/RibbonStat.scss`
- Screen-local SCSS owns only placement/integration adjustments.

## 10) No-layout-shift and truncation rules
- Ribbon stats and chips use stable row structure.
- Truncation-safe value/detail lanes (`min-width: 0`, ellipsis) are used for long city/law/root strings.
- Chip lane remains compact (max two chips) and treated as secondary context.
- No hover/active state changes layout dimensions.

## 11) Explicit non-goals
- No Run Compass embedding in `TopRibbon`.
- No full screen redesign of Cultivation/Status/Techniques/Prestige.
- No world scenic/header/plaque overhaul.
- No asset generation.

## 12) Manual QA and acceptance criteria
Manual QA focus:
- Cultivation/Status ribbons show realm/path/root/law/city + compact chip context.
- Techniques and Prestige show compact context ribbons in dense layouts.
- Long Heart Law and city labels truncate without row-height drift.
- Existing non-ribbon blocks remain (Status shortfall/combat, Techniques BuildAltarSummary, Prestige AP/Reset/Advisor blocks).

Acceptance:
- `TopRibbon` and `RibbonStat` are real shared owners,
- Cultivation and Status migrated,
- Techniques and Prestige have compact direct adoption,
- no Run Compass embedding in `TopRibbon`,
- layout remains stable.
