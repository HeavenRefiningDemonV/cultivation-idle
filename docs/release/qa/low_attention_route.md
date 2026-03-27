# Low-attention Route (Packet 7.3c)

- **Route id**: `low_attention`
- **Goal**: Verify bounded-interaction viability using live guidance surfaces.
- **Automation**: `automated_non_blocking`

## What automated verification proves
- The route can operate with a bounded interaction budget.
- Interactions are driven by surfaced signals (run compass, world alerts, troubleshooting surface), not hidden logic.
- Notification policy is not unexpectedly blocking low-attention handoff moments.
- Route remains in the live semester slice (no fake city 6 or out-of-slice leaks).

## What it does not prove
- Full autoplay/zero-click play.
- Globally optimal click minimization for every build.

## Live systems touched
- `buildLiveRunCompassSurface`
- `buildWorldCommandSurface`
- `buildStatusTroubleshootingSurface`
- `buildSection5StatusSurface`
- `isNotificationOverlayBlocked`

## Checkpoints
- `route_started`
- `low_attention_surface_scan`
- `low_attention_alert_response`
- `route_completed`

## Acceptance checks
- Interaction count stays within explicit budget.
- At least one interaction is alert-triggered.
- Troubleshooting/readiness surfaces produce actionable state.
- No hidden overlay suppression of low-attention nudges.
- No out-of-slice city/cap contradictions.

## Known limitations
- This is bounded-interaction validation, not bot automation.
- Uses deterministic representative policy for CI repeatability.
