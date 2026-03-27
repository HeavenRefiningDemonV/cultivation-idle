# Release Waiver Policy (Packet 7.6b)

## Purpose
This policy defines what is and is not waivable for semester RC sign-off in `release:gate`.

## Classifications
- **blocker**: must be fixed before GO.
- **accepted waiver**: explicitly accepted for this RC with owner, rationale, mitigation, and evidence.
- **post-semester debt**: deferred work that is visible and tracked, but not allowed to hide live-slice truth failures.

## Required fields for every waiver/debt entry
- owner
- rationale
- mitigation
- evidence paths
- last reviewed date
- (for temporary waivers) expiry date

## Never waivable (NO-GO if present)
- Build blockers / red build output.
- Content validation failure.
- Progression contract **error** severity drift.
- Fresh-run automation failure.
- Missing required manual fresh-run coverage.
- Migration primary-risk failure.
- Balance regression hard failures.
- Route comparison final-truth failure.
- Runtime diagnostics error-level issues.
- Failing full test suite.
- Fake city 6 / out-of-slice live content leakage.
- Save corruption, silent fallback, or contradictory player-facing truth on live surfaces.

## Potentially waivable (explicit acceptance required)
- Build warnings already classified as acceptable for current semester RC.
- Non-blocking vocabulary/visual polish warnings that do not violate live-slice truth.
- Route watchlist warnings explicitly marked non-blocking by route report logic.

## Review expectations
- Waivers are reviewed at each RC checkpoint.
- Expired waivers revert to unresolved waiver-candidate findings.
- Untracked non-pass findings always keep the gate red.
