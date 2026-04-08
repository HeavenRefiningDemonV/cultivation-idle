# P2-10 — Secondary consumer classification and containment

## Objective

Lock a small, auditable contract for secondary shell consumers so P2 packet work cannot drift into full-screen thematic cutover.

## Scope

- `src/ui/shell/ScenicLabel.tsx`
- `src/ui/shell/index.ts`
- `src/components/screens/CityMapHub.tsx`
- `tests/contracts/scenicLabelCityMapHubContract.test.ts`

## Classification

- `ScenicLabel` is a canonical shared shell primitive.
- `CityMapHub` is a World-linked secondary consumer that must remain diegetic and map-attached.
- Importing or extending this pair does **not** grant authority to perform broad World-family UI rewrites.

## Implementation notes

- Added canonical option registries for `ScenicLabel` variant/state/emphasis dimensions.
- Re-exported those registries from the shell barrel to freeze import paths for downstream consumers.
- Froze CityMapHub hotspot label wiring with explicit constants for:
  - building-variant diegetic label mode
  - reserved state slot behavior
- Added a contract test to lock this API and containment wiring.

## Non-goals

- No visual restyle of ScenicLabel.
- No WorldScreen/CityMapHub layout rework.
- No support-art requests.
- No cleanup authority granted.
