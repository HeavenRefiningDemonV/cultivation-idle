# F1 / SA-A2 — Rebuild the realm curve · close the scale gut (RK-02) (evidence)

**Packet:** F1 sub-packet #3 — `SA-A2` · class `infra-only` (magnitude rebuild) · risk III · **RK-02, the scale gut**
**Landed:** 2026-06-21 · **Cutover statement:** magnitude-only; no contract change; the flag is still dev-OFF (the curve is exercised only via the flag-forced parity harness). No destructive cleanup.

SA-A2 replaces the flat placeholder `derivedRealmScalar` so that, with the flag forced on, the
derived `state.stats` match the SA-A0 legacy baseline **per realm, within band** — proven by the
committed per-realm parity table. **Result: exact parity (+0.0%) at every realm × channel.**

## 1 · The design (Option A — derived-authoritative)

The legacy baseline is `REALMS × heaven`, and the derived branch runs the **same** multiplier
stack, so parity reduces to: the derived GEO base must equal the **raw REALMS** base per realm.
Two pieces achieve this:

1. **The realm scalar carries the magnitude.** `derivedRealmScalar` is rebuilt geometric,
   `ρ^(realmIndex1to7 − 1)` with **`REALM_SCALAR_RATIO = 5`** — the same ×5.0-per-realm ratio as
   the legacy `REALMS` ladder (HP 100→312,500). Anchored at realm 1 → 1.0, so the existing
   `derivedStatsContract` pins (`scalar(1)===1`, `scalar(7)>scalar(1)`) are **preserved unedited**.
2. **Per-channel GEO calibration aligns the shape.** The derived resolver's natural scale and
   per-channel ratios don't match the legacy band (its atk/def ratio is **structural** — it can't
   reach the legacy 2:1 with positive ratings, so a per-channel correction is mandatory, exactly
   the `[tune]` the packet sanctions). `combatStatBridge.GEO_CALIBRATION` (hp `100/250`, atk
   `10/85`, def `5/55`, regen `1/70`) is tuned to the **reference parity cultivator** (all 13
   shared ratings = 100): at realm 1 its core is maxHp 250 / physAttack 85 / physDefense 55 /
   hpRegen 70, so each factor = `REALMS R0 target / reference core`. Because `ρ = 5` matches the
   REALMS ratio, the realm index **cancels** and the identity holds at **every** realm.

GENTLE channels (crit/critDmg/dodge/speed) are carried from the realm row (the SA-A1 carve-out),
so they are parity-exact by construction. **The derived model `computeDerivedStats` is unchanged**
— the calibration lives in the legacy-compat bridge, and `DEFENSE_CONSTANT_K`/the damage formula
are untouched (INV-6).

## 2 · The per-realm parity table (the proof the scale gut is closed)

Reference cultivator, flag ON, band ±5%. `legacy / derived (Δ%)`:

| Realm | maxHp | atk | def | regen | crit | critDmg | dodge | speed | mirror dmg |
|---|---|---|---|---|---|---|---|---|---|
| Qi Condensation | 80/80 (+0.0%) | 13/13 | 4.5/4.5 | 1/1 | 15/15 | 150/150 | 10/10 | 1.0/1.0 | 12.44/12.44 |
| Foundation | 400/400 (+0.0%) | 65/65 | 22.5/22.5 | 5/5 | 18/18 | 160/160 | 13/13 | 1.1/1.1 | 53.06/53.06 |
| Core Formation | 2000/2000 (+0.0%) | 325/325 | 112.5/112.5 | 25/25 | 22/22 | 175/175 | 17/17 | 1.2/1.2 | 152.94/152.94 |
| Nascent Soul | 10000/10000 (+0.0%) | 1625/1625 | 562.5/562.5 | 125/125 | 25/25 | 190/190 | 20/20 | 1.3/1.3 | 245.28/245.28 |
| Soul Formation | 50000/50000 (+0.0%) | 8125/8125 | 2812.5/2812.5 | 625/625 | 28/28 | 200/200 | 23/23 | 1.4/1.4 | 278.97/278.97 |
| Spirit Severing | 250000/250000 (+0.0%) | 40625/40625 | 14062.5/14062.5 | 3125/3125 | 32/32 | 215/215 | 27/27 | 1.5/1.5 | 286.85/286.85 |

**Every realm × channel is +0.0% — exact parity, well inside the ±5% band.** The geometric span
the rebuilt scalar covers is HP 80 → 250,000 (×3,125), the magnitude the old placeholder (×2.25
over its whole range) missed by >1,000×. Machine-readable + rendered:
`docs/release/qa/f1-stat-engine/compare/parity-table.{json,md}`.

## 3 · Changed files

- `src/systems/meridians/derivedStats.ts` — `derivedRealmScalar` rebuilt geometric + `REALM_SCALAR_RATIO = 5` ([tune → D15]). `computeDerivedStats` body, the channel maps, and the resolver shape are otherwise untouched.
- `src/systems/meridians/combatStatBridge.ts` — added `GEO_CALIBRATION` + the pure `calibrateGeoBase`.
- `src/stores/gameStore.ts` — the flag-on branch now applies `calibrateGeoBase` (one-line change; the legacy branch and the multiplier stack remain byte-unchanged).
- `tests/fixtures/statEngineParitySeeds.ts` — `PARITY_REFERENCE_RATINGS` (the reference cultivator).
- `tests/e2e/stat-engine-parity.spec.ts` — the compare-mode parity gate (writes the table; asserts every realm × channel in band).
- `tests/contracts/statEngineParityContract.test.ts` — unit-level parity proof (the fast-floor complement to the e2e gate).

## 4 · Verification

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run check:icons` | ✅ (via build) |
| `npm run validate:content` | ✅ pass |
| `npm run test:contracts` | ✅ **533 / 533** (was 532; +1 = the additive parity contract; the `derivedStatsContract` pins still pass unedited) |
| `npm run build` | ✅ built ~6s |
| Parity harness (compare mode) | ✅ **8 / 8** — every realm × channel exact |

**`DEFENSE_CONSTANT_K = 100` byte-unchanged** (grep-confirmed; `combatStore.ts` is not in the diff) — INV-6 held.

## 5 · Gate edge / non-reference note

SA-A2 satisfies SA-A4's precondition (INV-1): per-realm parity is **proven** for the reference
cultivator. The flag is still dev-OFF; the curve is exercised only via the flag-forced harness.

A note on scope (honesty): parity is proven for the **reference** cultivator (the parity fixture).
A live cultivator with different ratings produces different (rating-driven) stats — that is the
intended Three-Treasures model, and the *balance* of non-reference cultivators is **F-BAL's** job
(the balance pass before flip #2), out of F1 scope. F1 proves the reference matches and keeps the
cutover dev-on/reversible.
