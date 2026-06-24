# State of the rework — structure-complete baseline (2026-06-24)

The end of the **buildable-while-held** phase. Everything that can be built as inert, flag-gated,
byte-identical structure under held magnitudes now is. Tag: `rework-structure-complete`. What comes next
is a separate phase (F-BAL + a release decision), entered deliberately from this known-good baseline.

The discipline held the whole way: **flag-gated** (`?statEngine=1`, ships off), **preserve-first**
(flag-off byte-identical), **magnitudes held** for the terminal F-BAL pass, **frozen combat core**
(`ATK×(1−DEF/(DEF+K))`, K=100) never edited.

---

## ✅ LIVE under `?statEngine=1` (flag-off byte-identical)
- **Stat engine (F1)** — the 4-tier derived model (`computeDerivedStats`), parity-exact vs legacy.
- **Seat of Becoming** — 3 live per-path instruments: Heaven **Premonition** · Earth **Beast-Lore**
  (persisted) · Martial **Weapon-Bond** (persisted). Proven across the S9/S10 5-state fidelity matrix.
- **B-MERID** — path-meridian combat signatures (armor-pen, iron-skin, mountain-stance, momentum,
  mandate aura, void-gaze), consumed in combat (coefficients held).
- **Element combat** — affinity / resist / the F3 reaction resolver; the **affliction pipeline**:
  lifecycle (decay/expire) · DoT (interval-accumulator) · ICD anti-spam · hard-CC skip-turn · drain
  self-heal. All flag-gated; the effect magnitudes ship inert/held.
- **Enemy-derived layer** — `resolveEnemyDefensiveProfile` seam (flat stub, upgradeable to a symmetric
  snapshot with zero combat re-port); the contested control roll + shred read it. Bases held 0.

## 🅷 HELD for F-BAL (the manifest: `held-numbers-ledger.md`)
Every magnitude deliberately parked, routed through greppable sentinels (`HELD={min:0,max:0}` ·
`HELD_COUNT=-1` · `HELD_RATE=0` · `HELD_MULT=1` · identity coeffs):
breakthrough-risk re-baseline · focus-emphasis coeff · B-MERID magnitudes · element tuning (affinity/
resist/reaction + DoT/ICD/hard-CC + drain) · enemy stagger/CC-resist/element-resist + control-roll coeff +
shred · the whole **D8 content layer** (affix roll ranges, rarity bands + multipliers, drop rates + rarity
weights, set-bonus grants, upgrade rate/cap/max) · the shipped engine-default flag.

## 🅿 PARKED wires (built systems, not yet connected — own gated packets)
Activate the held systems; need F-BAL values + combat-validated drops + a release GO:
- **slice-1b** — `composeGear` → the derived layer + the **legacy refine/temper de-dup** (a behavior-
  changing refactor; needs an equivalence proof).
- **gear-drop wire** — `rollGearDrop` into the live `generateLoot` loop (+ its seed source; the live loot
  path is `Math.random`-seedless).
- **controlPower live read** — wire the real derived `controlPower` into the control roll (passed 0 today;
  moot while `controlSkipChance` held 0, MUST land before F-BAL sets it).
- **D8 effect wires** — compose set-bonus / upgrade multipliers into the gear dict.

## 🧱 BLOCKED on new combat architecture (the wall — author mechanics, packet + decision)
- **spread** — needs a 1-vs-N target model (combat is 1-v-1).
- **cleanse** — needs the player-affliction side (only enemy afflictions are modeled).

## 🏁 TERMINAL — F-BAL (a release decision, not structure)
Author every held number, re-baseline parity once, flip the engine default-on. Gated on: combat +
equipment present (✅ now), and a broad release **GO** (currently NO_GO — see below). The doctrine held
this all session.

---

## Baseline health (verified at this tag)
- Full 5-gate battery green — typecheck · icons · content · **contracts (568 files / 2,025 tests, 0 fail —
  well above the ≥506 anchor; no anchor silently moved)** · build.
- Cross-system coherence + **S9/S10 fidelity** e2e: **73 passed** under `?statEngine=1` — parity byte-exact
  with every rework system present (stat engine · Seat · B-MERID · element resolver · affliction pipeline ·
  enemy-derived seam · D8 composeGear law). The **S9/S10 live-instrument matrix is cleared and accepted**:
  3 live instruments × 5 states (healthy/blocked/postFailure/prestige/contentCap), 15 screenshots under
  `artifacts/mii3-seat-matrix/live-instruments/`.
- Release gate **NO_GO = external/pre-existing only** — exactly two rows (`eng_build_green` +
  `copy_visual_icon_consistency`), both rooted in the single pre-existing `chunks>500kB` build warning + the
  manual visual audit. Every other row YES (content, full suite, migration matrix, fresh-run, balance,
  runtime, save/reload). Classified identically across all 5 consolidation checkpoints — **the rework
  introduced no new red.** This is the release-readiness input for the F-BAL/GO decision.
