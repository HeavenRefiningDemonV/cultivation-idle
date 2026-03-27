# Surface Truth Audit (Packet 7.5b)

## Tracked surfaces
- Cultivation
- Status
- World
- Gate Trial
- Techniques
- Manual Pavilion
- Apothecary
- Forge
- Prestige
- Current Chapter Exhausted
- Life Summary

(Full canonical scope source: `src/services/diagnostics/release/liveSurfaceManifest.ts`.)

## Tracked scenarios
- Fresh life
- Post first gate / first city unlock
- Prestige-ready
- Cap reached

## Surface truth expectations
- Canonical semester labels and nouns only.
- No raw internal id leakage (`city_*`, `trial_*`, raw enum keys) in player-facing lines.
- No fake/future city leakage.
- No stale placeholder/prototype/debug wording.
- Prestige/Life Summary/World use consistent vocabulary for gates, readiness, and progression framing.

## Current automated coverage
- Runtime truth checker: `src/services/diagnostics/release/surfaceTruthAudit.ts`
- Integration gate: `tests/integration/release/surfaceTruthAudit.test.ts`
- Supporting vocabulary/placeholder contract gates:
  - `tests/contracts/releaseVocabularyAudit.test.ts`
  - `tests/contracts/placeholderStringPurge.test.ts`

## Current limitations
- The audit is intentionally semester-surface scoped; dead/unreachable legacy files are not the primary target.
- The checker is semantic/string-rule based and focuses on release regressions, not exhaustive full-app copy linting.
