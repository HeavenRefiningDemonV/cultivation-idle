# Enemy-Derived-Layer Packet — Stagger/CC-Resist + Element-Resist behind a Resolver Seam

**Status:** AUTHORED (design only — no code yet). Resolves the architecture-wall blocker the D11 3b arc
hit (the real control roll + shred both need an enemy resist/stagger source that does not exist). Built
from an exact-touchpoint recon + an adversarial review; the review's one blocker (D1, shred byte-identity)
and four minor relabels are folded into this final version.

---

## 0. Packet summary & the decision

**What it adds.** An *enemy* defensive profile — `staggerResist`, `ccResist`, `resistByElement` — exposed
through ONE pure resolver (`resolveEnemyDefensiveProfile`) and consumed at two seams that already exist but
run inert:

- **The control roll** — `resolveEnemyControlSkip` ([elementControlGate.ts:33](src/systems/elements/elementControlGate.ts:33))
  today gates only on the held `tuning.controlSkipChance` (0). It gains the enemy's stagger/CC-resist as the
  *denominator* so the canon roll — Control Power(player) vs enemy Stagger/CC-Resist — can fire. Replaces the
  held-`controlSkipChance` path from 3b-iii.
- **Shred** — an enemy resist debuff. `stepEnemyElementOnHit` ([elementCombatReactions.ts:60](src/systems/elements/elementCombatReactions.ts:60))
  already computes shred reactions (4 fireable: corrode/superconduct/erosion/unmakingTouch) but drops them;
  this gives the debuff a place to live + a reader.

**The decision (settled — not re-litigated).** Expose these through a **resolver seam backed NOW by a
FLAT / realm-scaled stub**, shaped so a **symmetric enemy derived snapshot** can later back the **SAME seam**
with **zero combat re-port**. *Stub the value, not the contract.* The resolver SHAPE/signature is the stable
interface; the magnitudes are HELD for F-BAL.

**Why this shape.** Combat just got the player derived-stat seam (the flag-gated affinity/resist/control
plumbing at [combatStore.ts:1550](src/stores/combatStore.ts:1550)). Standing up a *second* full porting
effort (enemy meridians, enemy axes, an enemy `computeDerivedStats`) is premature and would re-touch the
frozen damage core. Instead we install the *consumer-facing contract* now (a resolver taking
`enemy + realm + flag + tuning → EnemyDefensiveProfile`), back it with a flat realm-scaled stub, and let
F-BAL later "fill the resolver" — swap the stub body for a symmetric snapshot read — **without the
`combatStore.ts` call sites changing at all.**

**Discipline.** Additive; flag-gated by the same `isDerivedStatEngineAuthoritative()`; preserve-first
(**flag-off byte-identical**); flag-on stays byte-identical too while the stub returns neutral values and the
held magnitudes keep both consumers inert until F-BAL.

---

## 1. The resolver seam (the stable contract)

### 1.1 The returned shape — `EnemyDefensiveProfile`

A new **pure, leaf** type (new file `src/systems/elements/enemyDefensiveProfile.ts`, alongside
`elementControlGate.ts`). This is the *contract* — the field set the consumers read. Values are flat /
realm-scaled stubs (HELD).

```ts
export interface EnemyDefensiveProfile {
  readonly staggerResist: number;            // flat scalar: hard-CC control-roll denominator
  readonly ccResist: number;                 // flat scalar: soft-CC / future control denominator
  readonly resistByElement: ElementWeights;  // the 14-element resist vector (same shape as player weights)
}
```

- `staggerResist`/`ccResist` are **flat scalars**, opposing the player's `controlPower` (a scalar). Note the
  player's `staggerResist` at [derivedStats.ts:194](src/systems/meridians/derivedStats.ts:194) is a
  **DERIVED_WEIGHT_MAP derivation recipe** (`willpower × 0.5`), not a stored value — the *enemy* staggerResist
  here is a **flat stub**, deliberately NOT yet symmetric with that recipe (that's the whole point: symmetric
  comes later as a resolver-body swap).
- `resistByElement` is the SAME `ElementWeights` 14-vector the player resolver consumes
  ([elementCombatAffinity.ts:46](src/systems/elements/elementCombatAffinity.ts:46) `buildPlayerElementWeights`),
  so it flows straight into the generic, source-agnostic `resolveResist`
  ([elementResolver.ts:98](src/systems/elements/elementResolver.ts:98)) with **no resolver change**.

### 1.2 The resolver signature — `resolveEnemyDefensiveProfile`

```ts
export function resolveEnemyDefensiveProfile(input: {
  enemy: EnemyDefinition;   // params-only: the spawned enemy (whole object ⇒ future fields ride along)
  realm: number;            // 1..7 = useGameStore.getState().realm.index + 1
  engineActive: boolean;    // isDerivedStatEngineAuthoritative()
  tuning: ElementTuning;    // injected; magnitudes HELD (D15/F-BAL)
}): EnemyDefensiveProfile
```

Pure / leaf / params-only (no store reads inside; the caller injects realm/flag/tuning, exactly as
`resolveEnemyControlSkip` and `resolvePlayerElementResist` are called today). **Today's stub body:**

```ts
if (!input.engineActive) return INERT_ENEMY_DEFENSE;       // preserve-first ⇒ byte-identical
const scalar = derivedRealmScalar(input.realm);            // SAME scalar as derivedStats.ts:220
return {
  staggerResist: input.tuning.enemyStaggerBase * scalar,   // enemyStaggerBase HELD 0
  ccResist:      input.tuning.enemyCcResistBase * scalar,   // enemyCcResistBase HELD 0
  resistByElement: input.enemy.element
    ? buildEnemyElementWeights(input.enemy.element, input.tuning) // {[element]: enemyElementResistBase} (HELD 0)
    : ZERO_ELEMENT_WEIGHTS,
};
```

`INERT_ENEMY_DEFENSE = { staggerResist: 0, ccResist: 0, resistByElement: ZERO_ELEMENT_WEIGHTS }`.
`buildEnemyElementWeights` is the exact twin of `buildPlayerElementWeights`.

### 1.3 How a symmetric snapshot later backs the SAME signature — zero combat change

The signature never mentions *how* values are produced. Today the body multiplies a flat
`tuning.enemyStaggerBase` by `derivedRealmScalar`. Tomorrow (F-BAL): swap ONLY the body —
`const snap = computeEnemyDerivedSnapshot(input.enemy); return { staggerResist: snap.staggerResist, … }`.
The call sites still call the same function and read the same three fields. The enemy *input* evolves flat →
symmetric; the **contract is frozen**. That is the literal "stub the value, not the contract" guarantee.
**Re-port avoidance validated by review:** the generic `resolveResist` is element-source-agnostic, and passing
the whole `enemy` (not destructured fields) lets future enemy-state fields ride along without a signature
change. No leak found.

---

## 2. Exact touchpoints (verified against live source)

| # | Edit | File:line:symbol | Nature |
|---|------|------------------|--------|
| T1 | **New resolver + profile type** | `src/systems/elements/enemyDefensiveProfile.ts` (NEW) — `EnemyDefensiveProfile`, `resolveEnemyDefensiveProfile`, `buildEnemyElementWeights`, `INERT_ENEMY_DEFENSE` | New leaf module |
| T2 | **Profile fields on the enemy** | [types/index.ts:810](src/types/index.ts:810) `EnemyDefinition` (after `element?` @831) — add `staggerResist?: number`, `ccResist?: number` (optional ⇒ legacy absent ⇒ resolver yields INERT) | Additive, optional |
| T3 | **Spawn stays offence-only** | [enemyFactory.ts:49](src/systems/enemyFactory.ts:49) `createEnemy` — leave new fields absent; the *resolver* applies realm scaling at combat-time | No magnitude baked |
| T4 | **Control-roll consumer takes the profile** | [elementControlGate.ts:33](src/systems/elements/elementControlGate.ts:33) `resolveEnemyControlSkip` — extend `input` with `controlPower: number` + `staggerResist: number`; derive the skip chance from controlPower-vs-staggerResist via a HELD coefficient instead of reading `controlSkipChance` directly. Keep the `!engineActive` (L39) + lazy-RNG (L41–45) guards | Signature extension |
| T5 | **Control-roll call site** | [combatStore.ts:1657](src/stores/combatStore.ts:1657) — thread player `controlPower` + `profile.staggerResist` from `resolveEnemyDefensiveProfile({ enemy, realm: realm.index+1, engineActive, tuning: DEFAULT_ELEMENT_TUNING })` | Inject at the existing call |
| T6 | **Player controlPower read (scoped)** | `controlPower` = [derivedStats.ts:191](src/systems/meridians/derivedStats.ts:191) (soulStrength·0.5 + spiritualSense·0.4). **Slice B reads it from the SAME `computeDerivedStats` output the Status UI consumes — name the selector at build time; do NOT recompute a parallel formula.** If the live wire-up is non-trivial, ship Slice B's contract with an *injected* controlPower first and land the live read as an explicit sub-item (no smuggled derived-stat plumbing) | New read path, flag-gated |
| T7 | **Shred debuff storage** | [elementCombatReactions.ts:31](src/systems/elements/elementCombatReactions.ts:31) `EnemyElementStates` — add `shredResistDelta?: number` (cumulative; optional ⇒ default 0) | Additive |
| T8 | **Shred application (gated)** | [elementCombatReactions.ts:60](src/systems/elements/elementCombatReactions.ts:60) `stepEnemyElementOnHit` — at the reaction-kind branch (today burst/sever @80–82, drain @~88) add `kind === 'shred'` → fold `resistDelta × tuning.enemyShredApplyBase` into `states.shredResistDelta` (fresh object, purity preserved). **The new held `enemyShredApplyBase` (0) is the byte-identity gate** (see §3) | New kind, gated HELD 0 |
| T9 | **Shred reader (OUTGOING chain)** | [combatStore.ts:1567](src/stores/combatStore.ts:1567) playerAttack `finalDamage` chain — apply the shredded enemy element-resist as a **post-core multiplier alongside `elementAffinityMult`** (@1556, applied @1567–1574, the OUTGOING path — NOT the `resolvePlayerElementResist` incoming path @1710). Reads `profile.resistByElement` minus `shredResistDelta` pre-curve via the generic `resolveResist` | New post-core multiplier |
| T10 | **Tuning shape (HELD fields)** | [elementTuning.ts:11](src/systems/elements/elementTuning.ts:11) `DEFAULT_ELEMENT_TUNING` (+ `ElementTuning` type @~232) — add `enemyStaggerBase: 0`, `enemyCcResistBase: 0`, `enemyElementResistBase: 0`, **`enemyShredApplyBase: 0`**, + the control-roll coefficient — each `[tune] D15/F-BAL`, mirroring the `controlSkipChance` comment | New tuning fields, HELD 0 |
| T11 | **Realm scalar reuse** | [derivedStats.ts:220](src/systems/meridians/derivedStats.ts:220) `derivedRealmScalar` — imported into T1 (same ρ=5 ladder) | Reuse, no edit |

**Frozen-core boundary (do NOT touch):** `ATK×(1−DEF/(DEF+K))` and `DEFENSE_CONSTANT_K = 100`
([combatStore.ts:173](src/stores/combatStore.ts:173)). Every enemy-resist effect composes as a *post-core
multiplier*, exactly like the player affinity at @1567–1574.

---

## 3. Flag-gate & preserve-first

**Flag-off ⇒ byte-identical:** `resolveEnemyDefensiveProfile` returns `INERT_ENEMY_DEFENSE` on `!engineActive`;
`resolveEnemyControlSkip` keeps its `!engineActive → NO_SKIP` + lazy-RNG (no draw when chance resolves to 0);
shred writes only when `engineActive`.

**Flag-on stays byte-identical while HELD — the two real gates (corrected from the review's D1/D2):**

1. **Control roll.** The roll is *wired* (denominator threaded) but inert: with `enemyStaggerBase = 0` the
   profile returns `staggerResist = 0`, and the roll coefficient is HELD so the computed skip chance is 0 —
   matching today's `controlSkipChance: 0`. The lazy-RNG short-circuit means **no draw**, so the combat RNG
   stream is unperturbed.
2. **Shred — TWO independent reasons it is inert (this is the review's blocker fix).** ⚠️ The raw shred
   `resistDelta` is **NOT** 0 in live source — `voidShredDelta`/`counterPenetration` are authored `0.1`
   ([elementTuning.ts](src/systems/elements/elementTuning.ts)), and 4 shred reactions can fire. So inertness
   must NOT be claimed on "delta 0." Instead:
   - **(a) The application gate.** T8 folds `resistDelta × enemyShredApplyBase` with **`enemyShredApplyBase`
     HELD 0** ⇒ `shredResistDelta` accumulates `+= 0` ⇒ no-op. This is the explicit "mechanism wired, value
     held" gate.
   - **(b) Nothing to shred yet.** Even absent (a), the enemy `resistByElement` is held 0, so the reader
     computes `max(0, 0 − shredResistDelta) = 0` — shred against a 0 resist is a no-op regardless.
   Both hold today ⇒ flag-on byte-identical. The Slice-C contract must inject **both** a non-zero
   `enemyShredApplyBase` AND a non-zero enemy element-resist to demonstrate the subtract.

**Stub-but-typed rule.** Where canon defines a value the engine can't yet compute (enemy stagger, the
control-roll coefficient, the shred delta, the enemy element-resist), the resolver/tuning returns a **typed
HELD placeholder** (0 / `ZERO_ELEMENT_WEIGHTS`), never an authored balance number.

---

## 4. Acceptance

1. **Control roll reads enemy stagger (mechanism wired, value held).** With the stub (`staggerResist = 0`,
   coefficient HELD) the skip outcome equals today's `controlSkipChance: 0`. Contract: (a) flag-off → NO_SKIP,
   no RNG draw; (b) flag-on + held → NO_SKIP, no RNG draw; (c) flag-on + **injected** non-zero stagger +
   injected coefficient → the roll fires against the right denominator (mechanism proven with injected
   magnitudes only).
2. **Shred debuffs enemy resist (mechanism wired, value held).** Contract: held (`enemyShredApplyBase 0`,
   enemy resist 0) → no resist change → outgoing damage unchanged; **injected** non-zero apply-base + non-zero
   enemy element-resist → reduced resist on the *next* hit, purity preserved (fresh state object).
3. **Contracts cover BOTH branches** (flag-off INERT + flag-on-held byte-identical) for the profile resolver,
   the control roll, and shred apply/read.
4. **Parity e2e stays green** — no new player-vs-enemy roll fires; RNG stream identical.

---

## 5. Slice plan — ordered, smallest first (each flag-gated, preserve-first, HELD)

- **Slice A — Seam + profile shape + flat stub (wired but UNCONSUMED).** T1, T2, T3, T10, T11. Contracts:
  resolver INERT off, flat realm-scaled stub on, no caller yet. **No combat behavior change at all.** The
  linchpin — once it lands, B and C only *consume* it (no further enemy-model porting).
- **Slice B — Control roll consumes it.** T4, T5, T6. Held coefficient ⇒ byte-identical; contract proves the
  denominator wiring with injected magnitudes.
- **Slice C — Shred debuff state + reader.** T7, T8 (with the `enemyShredApplyBase` gate), T9. Held ⇒
  byte-identical; contract proves storage→apply→read with injected apply-base + enemy resist.

---

## 6. Held / F-BAL (for the ledger)

| Held value | Where | Stub today | Owner |
|---|---|---|---|
| `enemyStaggerBase` | `elementTuning.ts` (+ type) | `0` | F-BAL (enemy stagger magnitude / curve) |
| `enemyCcResistBase` | `elementTuning.ts` | `0` | F-BAL (soft-CC resist) |
| `enemyElementResistBase` | `elementTuning.ts` | `0` | F-BAL (per-element enemy resist weight) |
| **`enemyShredApplyBase`** | `elementTuning.ts` | `0` | F-BAL (shred application strength — the byte-identity gate) |
| Control-roll coefficient (Control Power vs Stagger curve) | `elementControlGate.ts` roll body / replaces `controlSkipChance` | held ⇒ 0 skip chance | F-BAL (DR-11c; + the duration/immunity-window model) |
| Enemy realm/tier → stagger scaling formula | `resolveEnemyDefensiveProfile` body | flat `base × derivedRealmScalar(realm)` | F-BAL (enemy tier-band model) |
| Symmetric enemy snapshot (`computeEnemyDerivedSnapshot`) | future T1 body swap | flat stub stands in | F-BAL (the enemy derived layer) |

Consumed-not-authored (pre-existing HELD): `resistHardcap 0.75`, `resistHalfSaturation 100`,
`counterPenetration 0.1`, `voidShredDelta 0.1` — the generic `resolveResist` already applies them, unchanged.

---

## 7. Risks

- **Re-port avoidance.** Upgrade-safe *if* the signature stays `enemy + realm + engineActive + tuning →
  EnemyDefensiveProfile` and consumers read ONLY the three fields. Watch-item: a future symmetric snapshot may
  want enemy meridian-like inputs not on `EnemyDefinition` — mitigated by passing the whole `enemy` so future
  fields ride along without a signature change.
- **Frozen-core.** Enemy resist must be a post-core multiplier (alongside `elementAffinityMult` @1567–1574),
  never a DEF substitution inside `ATK×(1−DEF/(DEF+K))`. Contracts assert the core is untouched.
- **`controlPower` read drift (T6).** Source it from the same `computeDerivedStats` output the Status UI reads
  — do NOT recompute. Flag-gated. If non-trivial, defer the live read behind a contract-injected value.
- **F-BAL surface (the enemy stat model).** The honest blocker behind `controlSkipChance: 0`: enemies have no
  derived layer, and refresh-not-stack vs a 4000 ms duration would perma-lock an enemy under a 1000 ms attack
  cadence once a live value lands. This packet installs the seam ONLY; the duration/immunity-window model is
  F-BAL's, and the held coefficient keeps the roll inert until it exists.

---

## Build handback

> Author/build Slice A first (seam + `EnemyDefensiveProfile` + flat stub, wired but unconsumed) — additive,
> flag-gated, preserve-first, byte-identical when off AND on. Then Slice B (control roll consumes the
> stagger denominator) and Slice C (shred debuff state + outgoing reader, gated by `enemyShredApplyBase` 0).
> Touchpoints per §2 (exact, verified). Keep every magnitude HELD; stub-but-typed. Acceptance: the control
> roll + shred mechanisms are wired and contract-proven with injected magnitudes, while held values keep
> flag-on byte-identical. Do not author balance numbers; do not build the symmetric enemy model (F-BAL).
