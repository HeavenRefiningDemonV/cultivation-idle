# Training Hall And Dao Heart Release Handoff

Generated: 2026-06-03
Scope: Mega Prompt 5 prestige memory, reset truth, offline trust, telemetry, balance simulations, and release hardening.

## Packet Verdict

MP5-targeted release handoff: GO.

Full release handoff: NO_GO until the broad release blockers in `docs/release/known_issues.md` are resolved or accepted through the documented waiver process.

## Reset Truth

Prestige reset truth is centralized through `src/services/prestige/PrestigeResetService.ts` and classified in `src/services/prestige/PrestigeResetContract.ts`.

Raw per-life power resets:

- Training raw ratings, raw XP, fatigue, active regimen, current session, and active work.
- Dao Heart turbulence, active study state, raw scripture XP beyond explicit same-law echo, and current-life volatility.
- Spirit Root roll state before rebuilt life start.
- ActivityStore foreground activity and CombatStore combat state.

Explicit memory can return only through the persisted prestige memory ledger and MP5 effect resolvers:

- Form Memory: path-stat floor +4/+8/+12 within current realm caps.
- Scripture Echo: same-law verse echo 10%/25%/40%, plus Heart Law XP catch-up +10%/+20%/+30% until parity.
- Root Clarity: minimum Spirit Root grade floor 2/3/3 while preserving rolled element and purity percent.
- Calm First Breath: breakthrough risk reduction -1/-2/-3 only while Heart Law is at parity.
- Old Sparring Shadows: mastery catch-up +20%/+35% only until the previous milestone is reacquired.

`doctrine_archive` remains hidden and unsupported because no bounded current consumer exists for its minor echo without inventing new gameplay power.

## Save Compatibility

Save version is now `2.2.0`.

The `v2_2_0_backfill_prestige_memory_ledger` migration backfills an empty `prestigeState.memoryLedger` for old saves. The ledger is sanitized on load and stores only bounded milestone/echo data, not raw life-state.

## Offline Trust

Offline progress remains bounded to allowed non-combat systems. Combat remains excluded.

Training trust rows now report:

- Applied time.
- Stat XP and mastery XP movement.
- Fatigue and intensity dampening.
- Cap hits and skipped reasons.

Dao Heart trust rows now report:

- Applied time.
- Heart Law XP movement.
- Verse mastery movement.
- Clarity and turbulence context.
- Recommendation rows and skipped reasons.

The route evidence is stored in:

- `artifacts/mp5/final/offline-route-report.final.txt`
- `artifacts/mp5/final/reclaim-route-report.final.txt`

## Telemetry

MP5 added telemetry coverage for:

- `training/started`
- `training/grade_changed`
- `training/cap_hit`
- `training/offline_applied`
- `dao_heart/started`
- `dao_heart/level_changed`
- `dao_heart/offline_applied`
- `breakthrough/attempted`
- `gate/attempted`
- `prestige/started`
- `prestige/memory_applied`
- `prestige/reset_bucket_applied`

Telemetry schema validation, export, and summary evidence:

- `artifacts/mp5/final/commands/validate-balance-telemetry.stdout.log`
- `artifacts/mp5/final/telemetry-export.final.json`
- `artifacts/mp5/final/telemetry-summary.final.txt`

## Simulation And Regression Evidence

MP5 focused balance simulations pass:

- 36 Path/Root/Law route scenarios.
- 10 named exploit cases.

Evidence:

- `artifacts/mp5/final/mp5-balance-simulations.final.json`
- `artifacts/mp5/final/commands/test-mp5.stdout.log`
- `artifacts/mp5/final/release-gate-mp5-slice.final.json`

## Remaining Release Blockers

The MP5 systems are green, but the full release is not ready. Current full-release blockers are:

- Fresh-run manual coverage is incomplete.
- Migration matrix fails fixture `current-save`.
- Broad balance regression command fails with `Timing probe ended without milestone: spirit_severing_entry`.
- Route comparison fails inside the full release gate.
- Full test suite times out inside the full release gate.

See:

- `docs/release/mp5_release_hardening_final_report.md`
- `docs/release/known_issues.md`
- `artifacts/mp5/final/release-gate.final.json`
