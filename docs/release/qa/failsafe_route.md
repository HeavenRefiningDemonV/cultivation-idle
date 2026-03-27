# Fail-safe Route (Packet 7.3a)

- **Route id**: `fail_safe`
- **Goal**: Verify Safety Net bypass is a real emergency route: threshold-gated, economically bounded, and non-dominant.
- **Automation**: `automated_non_blocking`

## What automated verification proves
- Safety Net purchase is locked before threshold and unlocks only after enough **eligible** failures.
- Blocked trial states do not increment eligible-failure progress.
- Purchase runs through the live post-failure fix action path and resolves the trial to `bypassed` (not `cleared`).
- Route continuity holds after bypass (breakthrough can continue when requirements are met).
- Current prep-vs-bypass and support-reserve read models still classify bypass as emergency-only.

## What it does not prove
- Full real-combat defeat automation for every gate.
- Balance redesign or policy retuning.

## Live systems touched
- `getTrialLifecycleSnapshot`
- `trialStore.recordFailure` / `trialStore.markBypassed`
- `performPostFailureFixActionWithDeps` safety-net purchase path
- `buildPrepVsBypassEconomyReport`
- `buildSupportReservePacingReport`

## Checkpoints
- `route_started`
- `gate_available`
- `eligible_failure_1..3`
- `bypass_available`
- `bypass_purchased`
- `post_bypass_continuity`
- `route_completed`

## Acceptance checks
- Bypass stays locked before threshold.
- Eligible defeats increment toward threshold.
- Blocked starts do not increment threshold.
- Purchase occurs only after threshold + affordability.
- Trial resolves to bypassed and never fakes a clear.
- Route remains in live semester slice (no fake city 6).
- Bypass remains emergency-only in comparison rows.

## Known limitations
- Defeat counting is deterministic via live `recordFailure(countsTowardFailSafeOnStart)` instead of full combat-death loop to keep CI stable.
- This packet validates emergency-path truth, not recommended route strategy.
