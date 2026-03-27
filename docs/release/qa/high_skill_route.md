# High-skill Route (Packet 7.3d)

- **Route id**: `high_skill`
- **Goal**: Verify optimizer-style play improves pacing/cleanliness without violating live economy and progression guardrails.
- **Automation**: `automated_non_blocking` (hybrid policy-guided simulation)

## What automated verification proves
- At least one meaningful checkpoint pace metric (gate/foundation/core) improves versus representative baseline timing.
- Spend-order, prep-vs-bypass, and reserve pacing policies remain coherent under optimized routing.
- The route emits a structured exploit watchlist and blocks on blocker-level exploit triggers.
- The route remains inside the live semester slice with no fake city-6 leaks.

## What it does not prove
- Human speedrun optimum.
- Future packet meta optimization.
- Full manual UX parity for every high-APM playstyle.

## Economy/policy guardrails used
- `getSpendOrderPolicy`
- `getPrepBudgetByGateIndex`
- `buildPrepVsBypassEconomyReport`
- `buildSupportReservePacingReport`
- `buildLiveEconomicRecommendationEngine`
- `runPhaseTimingProbe` (representative and highest-Qi variants)
- `runPrestigeApHourProbe` (AP/hour drift sentinel)

## Exploit-watchlist criteria
- bypass unexpectedly outperforming honest prep
- reserve depletion with no support-loop pressure
- recommendation-loop dominance by repeated blind gate retries
- timing outside locked phase envelopes
- AP/hour implications drifting outside prestige policy expectations

## Acceptance checks
- High-skill route yields faster/cleaner checkpoint metrics vs representative baseline.
- Bypass remains emergency-only and non-dominant.
- Reserve assumptions remain valid.
- No blocker exploit-watch entries trigger.
- No out-of-slice city or fake city 6 appears.
