# F1 / SA-A1 — Wire the derived read behind the flag (dev-OFF) (evidence)

**Packet:** F1 sub-packet #2 — `SA-A1` · class `infra-only` (additive seam, flag-gated) · risk III
**Landed:** 2026-06-21 · **Cutover statement:** additive-only; the legacy `calculatePlayerStats` path remains the default; the derived read is added on the dev-OFF flag path and replaces nothing. No destructive cleanup.

SA-A1 makes combat *able* to read the Three-Treasures derived engine — but only behind the
dev-OFF `STAT_ENGINE_DERIVED_AUTHORITATIVE` flag. Nothing observable changes (the flag is off).

## 1 · The seam (the minimal, lowest-risk change — §1.3)

The cutover seam is a single conditional at the **source** of the base stats in
`gameStore.calculatePlayerStats`, not a duplicated branch. When the flag is on (and the input
getter is wired), `baseStats` is sourced from the derived engine; otherwise it is the REALMS
row, **byte-identical to before**. The entire downstream multiplier stack (substage, focus,
path, upgrades, prestige, spirit-root, perks, equipment, temper, buffs, hpRatio, version bump)
is **unchanged** — the seam changes only the *source* of the base, never its *shape*. This is
§1.3's "one function changes its source, nothing else changes its shape," which keeps the
multiplier stack byte-for-byte intact (cleaner than the §3.2 separate-branch sketch, same effect).

The **transitional-shim semantics** (recorded per §3.2): the derived branch computes the realm
GEO base (replacing the REALMS base) and then runs the **same** multiplier stack on top — so
"derived base × same multipliers" reproduces "legacy base × same multipliers" once SA-A2
curve-matches the derived base. Every downstream system keeps working unchanged.

**GENTLE carve-out.** The GEO channels (hp/atk/def/regen) come from the derived engine; the
GENTLE channels (crit/critDmg/dodge/speed) are carried from the realm row, because their derived
sources cannot reproduce the per-realm GENTLE constants (e.g. `critDamage` has no Tier-0/1
source — §3.1/App.D). So SA-A2 tunes only the GEO scalar; B-MERID later layers meridian/signature
contributions onto the GENTLE channels.

## 2 · Changed files

**New (additive):**
- `src/systems/meridians/statEngineFlag.ts` — the leaf flag: `STAT_ENGINE_DERIVED_AUTHORITATIVE_DEFAULT = false`, `isDerivedStatEngineAuthoritative()`, `isForceLegacy()` (forceLegacy always wins). Mirrors `courtFlag.ts`. No React/SCSS/store imports.
- `src/systems/meridians/combatStatBridge.ts` — **pure** 21→8 adapter `deriveLegacyCombatStats` (GEO direct as Decimal strings; GENTLE sourced; speed normalized into 1.0–1.5) + the `mapFoundationViewsToRecord` / `mapAxisViewsToRecord` rename maps. No store reads ⇒ unit-testable.
- `src/systems/meridians/derivedStatInput.ts` — `toDerivedStatInput()` assembles a `DerivedStatInput` from the live stores (court shared stats, meridian ratings, realm index). Reads stores ⇒ lives at the seam boundary.

**Edited (additive):**
- `src/stores/gameStore.ts` — imports the (pure) flag + bridge + resolver; adds the `_getDerivedStatInput` lazy injector (`setDerivedStatInputGetter`); changes the `baseStats` source to the flag-conditional. The legacy multiplier stack is untouched.
- `src/systems/gameLoop.ts` — wires `setDerivedStatInputGetter(() => toDerivedStatInput())` in the store-bootstrap block (alongside `setPrestigeStoreGetter`).

**Tests (additive):**
- `tests/contracts/combatStatBridgeContract.test.ts` — asserts the eight channel mappings + the speed normalization band + the foundation/axis rename maps.
- `tests/e2e/stat-engine-parity.spec.ts` — adds the seam proof (flag-on differs from legacy, flag-off unchanged, GENTLE identical).

## 3 · Why the lazy injector (the cycle guard)

`trainingStore` imports `gameStore`, so a direct `gameStore → trainingStore` import would close a
cycle. SA-A1 reuses gameStore's **proven** `_getPrestigeStore` pattern: the store-reading
`toDerivedStatInput` is injected from the gameLoop bootstrap, so gameStore imports only **pure**
modules and gains **no** new import cycle. Until the getter is wired (and during the first
init-time `calculatePlayerStats`), the flag-on path safely falls back to legacy.

## 4 · Verification

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run check:icons` | ✅ (via build) |
| `npm run validate:content` | ✅ pass |
| `npm run test:contracts` | ✅ **532 / 532** (was 531; +1 = the additive bridge contract) |
| `npm run build` | ✅ built ~8s |
| Parity harness | ✅ **7 / 7** — incl. the SA-A1 seam proof |

**Seam proof (flag forced on via `localStorage.statEngine='1'`):** at R0 the derived-sourced
`maxHp` (~40, wrong-scaled because the fresh seed's foundation/axes are ~0 — expected until SA-A2)
**differs** from the legacy baseline (80), is finite and positive, and the GENTLE channels
(crit/critDmg/dodge/speed) are **identical** under both engines (the carve-out). Flag-off
reproduces the SA-A0 baseline (R0 maxHp = 80) — additivity confirmed. The flag-off Chromium
render is identical to SA-A0's baseline by construction (the flag-off code path is byte-unchanged).

## 5 · Diff scope / continuity

Diff = the two/three new leaf modules + the additive gameStore seam + the gameLoop wiring + the
additive tests. The legacy `calculatePlayerStats` multiplier stack is byte-unchanged; the flag
ships **OFF** (the shipped const stays `false`); `forceLegacy` overrides to legacy at runtime.
Reverting strands nothing (the legacy path was never modified). §F idle-parity: the idle/offline
accrual clock is untouched (it reads the same `state.stats`).
