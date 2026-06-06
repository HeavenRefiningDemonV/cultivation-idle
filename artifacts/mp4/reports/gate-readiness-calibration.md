# MP4 Gate Readiness Calibration

Generated: 2026-05-29T03:45:00+03:00

MP4 did not change gate combat stats or readiness thresholds. The post-tune balance report verifies the existing gate envelopes still pass.

| Gate | Below-min win rate | Minimum win rate | Recommended win rate | Minimum duration | Recommended duration | Pass |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0.060 | 0.350 | 0.875 | 39s | 27s | Yes |
| 2 | 0.050 | 0.300 | 0.850 | 44s | 31s | Yes |
| 3 | 0.040 | 0.265 | 0.830 | 49s | 35s | Yes |
| 4 | 0.035 | 0.235 | 0.790 | 56s | 41s | Yes |
| 5 | 0.025 | 0.175 | 0.750 | 63s | 49s | Yes |

## Prep And Fail-Safe

| Gate prep family | After status |
|---|---|
| Consumables-only recovery windows | Pass for gates 1-5 |
| Forge-floor-only recovery windows | Pass for gates 1-5 |
| Build-correction-only recovery windows | Pass for gates 1-5 |
| Minimum prep vs bypass ratio | Pass for gates 1-5 |
| Recommended prep vs bypass ratio | Pass for gates 1-5 |
| Reserve reachability | Pass for gates 1-5 |

The fail-safe remains an emergency valve in route comparison, and the reclaim/route reports did not trigger duplicate reward or unsupported-node exploit watch entries.
