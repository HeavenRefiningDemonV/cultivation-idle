# P2-06 — Shared shell API freeze (FrameCard / PlaqueHeader)

## Objective

Freeze the public option registries for `FrameCard` and `PlaqueHeader` so downstream consumers use one canonical, auditable API surface for variant enums.

## Scope

- `src/ui/shell/FrameCard.tsx`
- `src/ui/shell/PlaqueHeader.tsx`
- `src/ui/shell/index.ts`
- `tests/contracts/shellApiFreezeContract.test.ts`

## Implementation notes

- Added exported canonical option registries for all `FrameCard` and `PlaqueHeader` variant dimensions.
- Re-exported those registries from the `ui/shell` barrel for stable consumer imports.
- Added contract tests that lock exact option sets and ordering.

## Non-goals

- No visual restyling.
- No class-name rename/migration.
- No consumer cutover or cleanup authority.
