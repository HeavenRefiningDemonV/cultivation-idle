# F1 / SA-A0 — Stat-engine parity baseline (evidence)

**Packet:** F1 sub-packet #1 — `SA-A0` · class `infra-only` (recon + harness) · risk III
**Landed:** 2026-06-21 · **Product code changed:** none (harness + fixtures + docs only)

SA-A0 stands up the per-realm parity harness and captures the **legacy** baseline — the
oracle the entire stat-engine cutover is judged against (SA-A2 matches it per realm;
SA-A4 / B-MERID re-assert it in hold mode). It changes no product code.

---

## 1 · Recon gate (ground truth re-verified against the LIVE tree)

The packet was authored against the `section-a-roundup` snapshot; every assumption below
was re-proven on the live tree before authoring (Appendix H discipline).

| Claim | Proof on live tree | Result |
|---|---|---|
| The derived layer is **inert** (combat never reads it) | `computeDerivedStats` callers = its def (`src/systems/meridians/derivedStats.ts:227`) + the contract test only | ✅ confirmed |
| The wiring seam is **`calculatePlayerStats`**, NOT the dead stub | `calculatePlayerStats` at `src/stores/gameStore.ts:962` computes the 8 channels from `REALMS[].baseStats × multipliers`, writes `state.stats`, bumps `statsVersion` (L1191/1198) | ✅ confirmed |
| The dead stubs are **zero-caller** (SA-A3's targets, not the seam) | `resolveCultivatorStatEffectSnapshot` / `resolveStatProgressionPreview` appear only at their own definitions — no consuming caller | ✅ confirmed |
| The damage law is preserved (`K=100`) | `DEFENSE_CONSTANT_K = 100` at `combatStore.ts:164`, used L1512/1602/2298; `Damage = ATK × (1 − DEF/(DEF+K))` | ✅ `[live]` invariant |
| `derivedRealmScalar` is a flat placeholder | `1 + (clamped-1)*0.25` → spans 1.00→2.25 over the six live realms (`derivedStats.ts:207`) — the scale gut (RK-02) | ✅ confirmed |
| Save version | `CURRENT_SAVE_VERSION = '2.2.0'` (`saveVersion.ts:3`) — SA-A4 bumps to `2.3.0` | ✅ confirmed |

**Line numbers drifted slightly from the packet (as it warned); every module path + symbol is exact.**

---

## 2 · The deterministic seed (reproducibility — SA-A0 stop condition)

Every field that feeds `calculatePlayerStats` is pinned so the baseline is identical
run-to-run (`tests/fixtures/statEngineParitySeeds.ts` → `DETERMINISTIC_SEED`):

- path **heaven** (hp×0.8 / atk×1.3 / def×0.9 / crit+10 / dodge+5), focus **balanced** (all ×1.0), substage **1** (substageMultiplier 1.0);
- **no** upgrade tiers, **no** equipment, **no** path perks, **no** active buffs;
- **prestige neutralized** — `spiritRoot` set to `null`. *This was load-bearing:* a fresh save calls `generateSpiritRoot()` (`prestigeStore.ts:548`), which rolls grade/element with `Math.random()` → a **random, non-reproducible** spirit-root multiplier (the first capture showed a stray uniform ×2.24). `getSpiritRootTotalMultiplierForRoot(null) === 1.0` and the element-bonus branch is skipped, so the null root yields the pure, reproducible REALMS×heaven curve. Combat multiplier is already 1.0 on a fresh store. The derived path (SA-A1+) runs the **same** multiplier stack, so neutralizing here cancels on both sides and parity is unaffected.

The harness proves reproducibility two ways: it captures twice and asserts the two
vectors are identical, **and** it asserts R0 equals the exact REALMS×heaven values
(80 / 13 / 4.5 / 1 / 15 / 150 / 10 / 1.0) — which only holds if no random multiplier leaked in.

---

## 3 · The legacy baseline (the oracle SA-A2 must match)

Captured from `gameStore.state.stats` for the deterministic seed, swept across the six
live realms (R7 sealed, out of parity scope). Representative damage = the deterministic
**mirror** hit (seed ATK vs its own DEF through the unchanged `K=100` formula, no crit).

| Realm | rung | maxHp | atk | def | regen | crit | critDmg | dodge | speed | mirror dmg |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Qi Condensation | 1 | 80 | 13 | 4.50 | 1 | 15 | 150 | 10 | 1.00 | 12.44 |
| Foundation Establishment | 2 | 400 | 65 | 22.50 | 5 | 18 | 160 | 13 | 1.10 | 53.06 |
| Core Formation | 3 | 2,000 | 325 | 112.50 | 25 | 22 | 175 | 17 | 1.20 | 152.94 |
| Nascent Soul | 4 | 10,000 | 1,625 | 562.50 | 125 | 25 | 190 | 20 | 1.30 | 245.28 |
| Soul Formation | 5 | 50,000 | 8,125 | 2,812.50 | 625 | 28 | 200 | 23 | 1.40 | 278.97 |
| Spirit Severing | 6 | 250,000 | 40,625 | 14,062.50 | 3,125 | 32 | 215 | 27 | 1.50 | 286.85 |

- **GEO channels** (maxHp/atk/def/regen) hold the clean geometric **×5.0 per realm** ladder (80 → 250,000 = ×3,125 total) — the magnitude `derivedRealmScalar`'s placeholder (×2.25 over its whole range) misses by >1,000×. This is the gap SA-A2 closes.
- **GENTLE channels** (crit/critDmg/dodge/speed) grow slowly and are NOT realm-scaled — they must be carved out of the scalar (§3.1/Appendix D).
- Mirror damage flattens at high realms (DEF saturates through `DEF/(DEF+100)`) — expected, and the integrated cross-check SA-A2 reproduces.

Machine-readable: `docs/release/qa/f1-stat-engine/baseline/legacy-baseline.json`
Rendered: `docs/release/qa/f1-stat-engine/baseline/legacy-baseline.md`

---

## 4 · The visual oracle (fixture-state screenshots, 2048×1152 dSF2)

Legacy Status / Observatory surface captured in every fixture state — the flag-off
render reference SA-A1 must reproduce identically:

`docs/release/qa/f1-stat-engine/baseline/screenshots/legacy-status-{healthy,blocked,postFailure,prestigePressure,contentCap}.png`

---

## 5 · Verification battery (the recorded green floor)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | ✅ pass |
| Icons | `npm run check:icons` | ✅ "No emoji icon usage found" |
| Content | `npm run validate:content` | ✅ "Content validation passed." |
| Contracts | `npm run test:contracts` | ✅ **531 / 531** |
| Build | `npm run build` | ✅ built in ~9s (pre-existing chunk-size warning only) |
| Parity harness (capture mode) | `npx playwright test tests/e2e/stat-engine-parity.spec.ts` | ✅ **6 / 6** (baseline + 5 fixture states) |

> **Contract-count reconciliation (honesty over tidiness).** The packet narrates a
> "506/508" baseline from the `section-a-roundup` snapshot. The **live** floor is **531
> contract files, all green (531/531)** — the count grew as contracts were added since the
> snapshot. SA-A0 records the *live* floor as the reference for the rest of F1; it adds
> **no** contract test (only an e2e spec, a data fixture, and docs), so the count is
> unchanged by SA-A0. Note: the working tree also carries the prior, separate **F0-KIT**
> additive change (uncommitted); F0 contributed the one extra token-sheet `test()` block.

---

## 6 · Diff scope (SA-A0 acceptance — zero product code)

New SA-A0 files only:
- `tests/e2e/stat-engine-parity.spec.ts` — the parity harness (capture mode; compare/hold modes plug in at SA-A2/SA-A4).
- `tests/fixtures/statEngineParitySeeds.ts` — the deterministic seed + channels + realms + `[tune→D15]` band (±5% placeholder) + helpers.
- `docs/release/qa/f1-stat-engine/baseline/**` — the baseline table (JSON+MD) + the 5 fixture-state screenshots.
- `docs/release/f1_sa_a0_parity_baseline_evidence.md` — this file.

**Zero edits under `src/`** by SA-A0 — confirmed `git status` shows no new modifications in
`src/systems`, `src/stores`, `src/save`, `src/features`, `src/constants` (the `src/` entries
in the working tree are the unrelated, pre-existing F0-KIT change). The seam, the curve,
the flag, and the migration are all **untouched** — they are SA-A1 … SA-A4's work.

---

## 7 · Gate edge

SA-A0 satisfies the precondition for **SA-A1** (the baseline now exists). Per the packet's
one rule above all others — *parity before retirement* — the next sub-packets are gated:
SA-A1 wires the derived read behind a dev-OFF flag (no observable change), SA-A2 rebuilds
the realm curve to match this table per realm, and only then does SA-A4 flip (dev-on).
**Held for review before SA-A1.**
