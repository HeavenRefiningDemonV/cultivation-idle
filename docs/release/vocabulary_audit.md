# Vocabulary Audit (Packet 7.5a)

## Canonical vocabulary sources
- `src/ui/text/playerFacingLabels.ts`
- `src/ui/text/playerFacingFormatters.ts`
- `src/systems/world/liveWorldLeakAudit.ts`
- `src/services/diagnostics/release/liveSurfaceManifest.ts`

## Tracked scope
- Tracked files are defined centrally in `LIVE_SURFACE_MANIFEST.trackedFiles`.
- Tracked surfaces are defined centrally in `LIVE_SURFACE_MANIFEST.trackedSurfaceIds`.
- Internal ids in code are allowed; rendered player-facing strings are the audit target.

## Stale replacement map
- `Embermist -> Spirit Cavern`
- `Silverkeep -> Lotusford`
- `Starsea -> Ironpeak`
- `Coming Soon -> Unavailable in current semester`
- `under development -> unavailable in current semester`
- `Not implemented yet -> Unavailable in current semester`
- `(debug) -> (removed in player-facing copy)`
- `for debugging -> for diagnostics`
- `debug tools -> diagnostics tools`

## Placeholder/stale-copy policy
- Forbidden on tracked live surfaces: `coming soon`, `under development`, `not implemented yet`, stale debug phrasing, `todo`, `wip`.
- Implemented scanner: `scripts/release/findPlaceholderStrings.ts`.
- Contract gate: `tests/contracts/placeholderStringPurge.test.ts`.

## Narrow exceptions
- `src/components/GameLayout.tsx` keeps an unknown-tab fallback branch as a defensive guard, but the fallback copy itself must remain release-safe.
