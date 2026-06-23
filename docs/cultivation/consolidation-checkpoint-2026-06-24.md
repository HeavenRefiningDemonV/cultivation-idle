# Consolidation checkpoint #3 — 2026-06-24

Banks the **enemy-derived-layer batch** (drain + the enemy-defensive-profile packet, Slices A/B/C) as a
known-good baseline. This batch is interaction-heavy even while inert — it added an outgoing-damage
multiplier, the contested control roll, and a new persistent affliction-state field (shred) that carries
through the tick — so it warrants a collective verify before moving on.

## Phase banked (5 feature commits + packet doc since `rework-checkpoint-2026-06-23` @ dd370bb1)
- D11 3b drain — Siphon/Devour self-heal (`f5eb3348`).
- Enemy-derived-layer packet authored (`cf6f38ef`).
- Slice A — `resolveEnemyDefensiveProfile` seam + flat stub, unconsumed (`0e999420`).
- Slice B — control roll consumes the enemy stagger denominator, contested (`5d5a9b11`).
- Slice C — shred debuff + enemy element-resist reader (`b68f01b4`).

## 1. Coherence — full 5-gate battery (HEAD)
| gate | result |
| --- | --- |
| `typecheck` · `check:icons` · `validate:content` · `build` | ✅ 0 |
| `test:contracts` | ✅ 0 — **1,997 tests, 0 fail** (release-handoff flaky pair both ✔) |

## 2. Cross-system coherence under `?statEngine=1` (Chromium e2e)
**73 passed.** The new combat interactions compose without disturbing parity:
- `stat-engine-parity` + `mi1-parity` — derived path reproduces the legacy curve **byte-exact** with the
  full stack present: focus seam · B-MERID · element affinity · the affliction pipeline (DoT/ICD/hard-CC/
  drain) · **the enemy-derived layer** (the new outgoing enemy-resist multiplier is ×1 while held; the
  contested control roll resolves to 0; shred `+= 0`).
- `cultivation-seat-states` / `-live` / `-live-instruments` (the 15-cell S9/S10 matrix) — green.
- `b-merid-signatures`, `c-path-premonition` — green.

## 3. Release gate — refreshed, NO_GO classified, no new red
Verdict **NO_GO** (unchanged). Driven by **exactly two rows — identical to checkpoints #1/#2**:
`eng_build_green` + `copy_visual_icon_consistency`, both rooted in the single pre-existing
`chunks > 500 kB` build warning + the manual visual audit. **Every other row is YES**. **This batch added
no new red.**

## 4. F-BAL manifest
`held-numbers-ledger.md` §4 carries the enemy-derived bases (`enemyStaggerBase`/`enemyCcResistBase`/
`enemyElementResistBase`/`enemyShredApplyBase`, all 0), the control-roll coefficient, and the **deferred
controlPower-read sub-item** (the one landmine: the live player `controlPower` is passed 0 at the call
site and MUST be wired before F-BAL sets `controlSkipChance` > 0). Nothing held this batch is lost.

## 5. State of the element-combat layer
As complete as it gets without F-BAL or new combat architecture:
**lifecycle · DoT · ICD · hard-CC · drain · affinity/resist/reactions · the enemy defensive layer
(control roll + shred).** The seam's promise holds — a symmetric `computeEnemyDerivedSnapshot` later
swaps in as the resolver *body* with zero combat re-port.

**Still on the wall (need combat architecture, not held magnitudes):** spread (1-vs-N targets), cleanse
(player-affliction side). F-BAL owns the activation of everything held.

## Baseline banked
Tag `rework-checkpoint-2026-06-23` moved to this HEAD.
