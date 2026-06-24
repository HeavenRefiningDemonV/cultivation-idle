# State of the rework — structure-complete baseline (2026-06-24)

The end of the **buildable-while-held** phase. Everything that can be built as inert, flag-gated,
byte-identical structure under held magnitudes now is. Tag: `rework-structure-complete`. What comes next
is a separate phase (F-BAL + a release decision), entered deliberately from this known-good baseline.

The discipline held the whole way: **flag-gated** (`?statEngine=1`, ships off), **preserve-first**
(flag-off byte-identical), **magnitudes held** for the terminal F-BAL pass, **frozen combat core**
(`ATK×(1−DEF/(DEF+K))`, K=100) never edited.

---

## 🆕 Since the baseline — Movement III + IV.1 (2026-06-25)
Three packets landed after the structure-complete tag, all flag-gated / held-magnitude / preserve-first:

- **M.III.1 EQ-MECH** — the gear pillar goes mechanically live. `composeGear` is now **WIRED** into the
  derived layer with the **GEO-only de-dup** (refine/temper mapped to gentle channels the carve-out discards,
  additive crit/dodge kept) — single-count **proven** by a dual-affix temper test (`×1.155`, not `×1.155²`),
  flag-off byte-identical. 5-slot loadout + per-instance Vault state. The **foundational gear legendary
  catalog** (`gearLegendaries.ts`, the Cinnabar Phoenix Spire apex + its signature edge, magnitudes held).
  *(This supersedes the old "slice-1b parked" note below.)*
- **M.III.3 EQ-PORT** — the painted **Panoply + Vault is the LIVE default Inventory tab** (1:1 with the locked
  artifact): parchment frames, the arrayed figure, rarity-ramp slips, the docked F2 inspector, the bond gauge /
  compass / gear totals, every mechanic wired (select → rail, equip/unequip, dismantle, filter/sort).
  `?giveTestGear=1` populates it; the legacy InventoryScreen is preserved (`?panoply=legacy`).
- **M.IV.1 ARTS-MECH** — the Techniques + Fortune Draw mechanical layer. Recon found the two-axis model, the
  per-path roll, and the **Fortune weighted-roll + pity already live**; this packet surfaced + extended them:
  the render-only **`FortuneDrawSurfaceV1`** (the M.IV.2 artifact's target — fate-thread / lectern / reveal /
  reroll / satchel), the **paid reroll** (cost held-in-content, gated until D15, pity carries = never-regress),
  the **technique scaling re-point at the derived layer** (full `statRatingsById`, flag-aware byte-identical) +
  the **F3 element query** for elemental arts, and the **foundational legendary-technique catalog** (3 real
  apex ultimates, one per path, signatures grounded in their real effects). Combat consumption = Movement V.

**Pending Movement IV:** M.IV.2 (the Fortune Draw artifact — user-authored, targets `FortuneDrawSurfaceV1`) and
M.IV.3 (the port — consume the surface + reconcile the existing `techniquesExact` altar). The Inner Altar needs
no fresh artifact (it has a built Exact screen).

**Gate now:** `test:contracts` **580 files** green (was 568 at the tag); typecheck · icons · content · build all
green. Ledgers: `docs/codex/EQ_PORT_PROGRESS.md`, `docs/codex/ARTS_MECH_PROGRESS.md`.

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
- ~~**slice-1b** — `composeGear` → the derived layer + the legacy refine/temper de-dup~~ **✅ LANDED in
  M.III.1** (the GEO-only de-dup, single-count proven, flag-off byte-identical — see the "Since the baseline" section).
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
- Release gate **NO_GO** — re-diagnosed 2026-06-24 (the earlier "two external rows = chunk warning + manual
  visual audit" framing was partly mis-attributed):
  - `eng_build_green` is now **YES** — the pre-existing `chunks>500kB` build warning is **FIXED** (`01f26e9a`,
    vite `manualChunks` split; `build_audit` reports 0 warnings / `buildPassed`). The flaky release-handoff
    bundle test was also fixed (`0d7eae0e`, temp-dir isolation).
  - The remaining red is **`full_test_suite`** (and the `copy_visual_icon_consistency` row that links it) —
    NOT a manual visual audit. Its check runs `npm run test`, a **parallel kitchen-sink** that bundles
    Playwright e2e specs (wrong runner — they belong to `npm run test:e2e`), DOM-integration tests (need a
    `localStorage` shim), and integration tests that **pollute each other under parallel `node --test`** (they
    pass in isolation / sequentially). It is flaky-green at best and has never been a reliable gate target.
    The curated, **sequential** node:test gate `npm run test:contracts` is deterministically green
    (568 files / 2,025 tests, 0 fail). Fix tracked as tech debt — see the spawned task "Make `npm run test` a
    reliable green full suite" (exclude e2e from the node:test compile + run sequentially + localStorage-only
    shim; may surface real integration failures to triage). Do **not** simply repoint the gate at
    `test:contracts` — that silently drops integration/matrices/services/story coverage.
  - Every other row YES (content, migration matrix, fresh-run, balance, runtime, save/reload). **The rework
    introduced no new red.** This is the release-readiness input for the F-BAL/GO decision.
