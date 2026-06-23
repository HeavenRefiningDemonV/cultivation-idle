# DR — Breakthrough risk/failure table drift vs D6/D15 canon

**Status:** OPEN — tracked, deliberately deferred (do NOT fix in a Seat/surface pass).
**Recorded:** 2026-06-23, during the M.II.3 "truthful-now" Seat compliance pass.
**Owner of the fix:** progression runtime + D15 (the **F-BAL** progression-spine packet, D16 Part B.5 / Wave C).

## What diverges

The live per-realm breakthrough transition table (`src/systems/breakthrough/breakthroughStabilityResolver.ts` → `TRANSITION_RISK`) diverges from the **anchored** D6 §D.6.2 / D15 §13.1 canon (`D6-TRANSITION-TABLE`, status ANCHORED, "inherited from D6 verbatim as [canon]"):

| Transition | Field | LIVE | Canon (D6/D15) | Δ |
|---|---|---|---|---|
| R1 (2→3) | baseRisk | 8 | **9** | −1 |
| R2 (3→4) | baseRisk | 11 | **12** | −1 |
| R3 (4→5) | baseRisk | 14 | **15** | −1 |
| R1 (2→3) | qiLossPct | 18 | **20** | −2 |
| R2 (3→4) | qiLossPct | 22 | **25** | −3 |
| R3 (4→5) | qiLossPct | 28 | **30** | −2 |
| R3 (4→5) | turbulenceGain | 24 | **25** | −1 |

Matches canon exactly: R0/R4 baseRisk (6 / 18), every clamp range ([1,45]…[5,65]), R0/R4 failure costs, the turbulence bands + fractured veto, the parity bands, and pity (gate-trial failsafe).

## Why it is NOT fixed here

1. **Ownership / render-only law.** `TRANSITION_RISK` is an ANCHORED balance constant owned by the progression runtime + D15. A render-only Seat/surface pass must not author or re-baseline an anchored balance constant (D14 §B render-only law; D16 §A.2 — "a packet moves owned work into the build; it does not author a number"). Magnitude (≤1pp) does not launder the scope breach.
2. **Regime coherence.** These risk numbers belong to the **same** balance regime as the still-legacy ×10 realm cost step (canon `D6-COST-REALMSTEP` ≈ ×4), the 1.18 stage growth (live 2.5), and the 6-realm `9/9/9/6/6/6` ladder (canon 7×9). D15 §15 verifies the ladder's three readings must "land together." Pulling the 6 risk numbers to canon while cost/ladder stay legacy is the coefficient-level "foundation-after-frame" trap and front-runs F-BAL, which D16 sequences last precisely so no coefficient drifts into an incoherent intermediate.

## The decision

**Hold all of it; flip the whole progression regime once** — base risk, failure costs, ×4 cost step, 1.18 stage growth, and the 7×9 ladder **together**, under **F-BAL**, gated on the stat-activation linchpin (D16 Part E).

## What the Seat pass DID do (truthful display, not a balance change)

- The Gate-Readiness preview now shows the **same** odds the real `breakthrough()` rolls (shared `buildLiveBreakthroughSnapshot`), so the displayed band/`riskPercent` is the live engine's honest current value — whatever `TRANSITION_RISK` holds today, the player sees the truth, not a hardcoded approximation. When F-BAL re-baselines the table, the preview tracks it automatically with no Seat change.

## Acceptance for the F-BAL packet

When F-BAL lands, set `TRANSITION_RISK` R1/R2/R3 baseRisk → 9/12/15 and the failure costs above to canon **in the same packet** as the ×4 cost-step + 7×9 ladder rebuild, and re-baseline any risk-parity contract in that packet. Then delete this DR.
