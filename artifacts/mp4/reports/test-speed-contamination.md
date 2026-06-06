# MP4 Test-Speed Contamination Scan

Generated: 2026-05-29T02:58:56.9444622+03:00

Raw scan: `artifacts/mp4/reports/test-speed-contamination.raw.txt`

Pattern: `TESTING|testing|debug|DEBUG|1000x|instant|one second|1000|dev-only|fixture-only`

## Verdict

No confirmed runtime test-speed leak was found that explains the MP4 timing drift. The dominant findings are test fixtures, debug/audit scripts, millisecond-to-second conversions, deterministic test timestamps, and UI/release evidence helpers. One non-MP4 runtime value remains noted for later review: loot pity uses a 1000-kill legendary guarantee, but it is not on the MP4 timing route and was not changed.

## Classification Summary

| Classification | Count / scope | Action |
|---|---|---|
| dev_fixture_required | Broad in `tests/**`, `tests/helpers/**`, migration fixtures, and release seeded diagnostics | Keep. These are test clocks, fixtures, or negative-case data. |
| comment_only_stale | Formatting/comments such as number display examples and release audit wording | No MP4 action. |
| intentional_fast_intro | None confirmed | No action. |
| runtime_test_speed_leak | None confirmed | No action. |
| unknown | `src/systems/loot.ts` legendary pity at 1000 kills | Document only; not MP4 timing/economy route evidence. |

## Representative Findings

| File / area | Finding | Classification | Notes |
|---|---|---|---|
| `tests/**` | `now: () => 1000`, large seeded Qi/currency, deterministic timestamps | dev_fixture_required | Isolated to test harnesses. |
| `tests/helpers/release/runFreshSaveRoute.ts` | `maxMs = 14 * 60 * 60 * 1000` and deterministic route timing math | dev_fixture_required | Release helper bound, not runtime speed. |
| `tests/helpers/release/runAlternativeRoute.ts` | Offline catchup simulations at 8h/16h and route improvement math | dev_fixture_required | Report harness only. |
| `scripts/release/runRuntimeDiagnostics.ts` | `source: 'debug'` negative-case manual | dev_fixture_required | Expected-invalid diagnostics scenario. |
| `src/utils/timeFormat.ts`, `src/utils/numbers.ts` | `/ 1000` and display threshold examples | comment_only_stale | Unit conversion / display formatting. |
| `src/stores/*`, runtime UI clocks | Millisecond conversions and tick durations | comment_only_stale | Normal unit handling; no direct speed contamination found. |
| `src/ui/motion/uiMotionTokens.ts` | `instant` language | comment_only_stale | Reduced-motion/UI feedback token, not gameplay timing. |
| `scripts/release/*Capture*.ts` | Debugging ports, overlay text checks, artifact capture helpers | dev_fixture_required | Release/browser evidence tooling. |
| `src/systems/loot.ts` | Legendary pity after 1000 kills | unknown | Runtime loot tuning, not used as a MP4 timing fix. |

## MP4 Decision

Do not quarantine or rewrite any test-speed scaffolding for MP4. The failing baseline signal is a proportional runtime timing drift in balance reports, not an isolated debug/test scaffold leaking into normal play.
