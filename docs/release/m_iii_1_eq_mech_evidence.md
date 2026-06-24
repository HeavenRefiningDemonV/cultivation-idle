# M.III.1 — EQ-MECH: Equipment & Inventory mechanical packet — acceptance evidence

**Status:** structure-complete, flag-gated, additive, magnitudes HELD → D15/F-BAL.
**Discipline:** every slice ended with the 5-command battery green + a commit. Flag-off ships byte-identical.

The packet wires the already-authored D8 item-model into the live engine and gives the two render-only
surfaces (Panoply + Vault) their live builders — without authoring a single balance number, and without
changing the flag-off (shipped) behaviour by one byte.

---

## 1. The three things this packet built

1. **The composeGear → derived WIRE** (flag-aware, single-count). Equipping an item now moves the build in
   the engine — but only under the derived stat engine (`?statEngine=1`); the legacy default is untouched.
2. **The 5-slot loadout + per-instance Vault STATE** — additive beside the legacy 2-slot weapon/accessory
   ids and the stackable item counts.
3. **The two LIVE SurfaceV1 builders** (Panoply + Vault) — pure, render-only, emitting the S0 contracts the
   painted port (M.III.3) binds.

---

## 2. Recon — the §2 ledger reconciled against the live tree (3 drifts)

The packet's §2 model ledger was verified against the live source before any code. Three drifts were found
and reconciled (each load-bearing):

- **Drift A — the unlisted 8th file.** `equipmentHandlingResolver.ts` was not in the §2 ledger. Its
  multiplier magnitude is sourced from TRAINING ratings (`weapon_bond`/`armor_harmony`/`artifact_attunement`
  × perRatingPct, capped) — **orthogonal in magnitude** to composeGear's forge values, so no single bonus is
  counted twice. The wire correctly leaves it alone. Two honest qualifications the verdict must not bury:
  - **It IS a real second multiply on the same channels.** `combatStore.ts:536-538` does
    `updated.atk *= handling.statMultipliers.atk` (and `.def`, `.maxHp`) — the very channels composeGear
    touches. Orthogonal in *value*, not *unrelated*: its active gate reads the equipped state
    (`hasDefensiveAccessorySignal` even reads accessory `refineLevel>0` and `defPct`/`hpPct` temper,
    `equipmentHandlingResolver.ts:56-60`). So the two share the equipped-state INPUT though not the value.
  - **It is wired to the LEGACY 2-slot ids** (`equippedWeaponId`/`equippedAccessoryId`). When the S1 5-slot
    loadout becomes the equip path, handling will read empty legacy ids and silently go inactive for
    new-model gear (armor harmony / artifact attunement stop firing). That is a **live seam for Movement V
    (combat)**, not this packet — marked in-code at `equipmentHandlingResolver.ts` (the `EquipmentHandlingInput`
    contract): `// [handling: migrate equipmentHandling input to the 5-slot loadout when it becomes the equip path]`.
- **Drift B — the wire target.** `gameStore.ts` already passed `{}` into the derived gear hook
  (`computeDerivedStats(input, {})`) — the explicit, parity-safe wire target. The wire replaces `{}` with
  `composeGear(...)` only when the derived engine is authoritative.
- **Drift C — the de-dup is GEO-ONLY, not "skip the whole legacy stack".** This is the most important
  correction. The legacy stack applies `critPct`/`dodgePct` **additively**, while composeGear maps them
  **multiplicatively** to the GENTLE channels (`critChance`/`evasion`) that the GEO carve-out **discards**.
  So "skip the whole legacy stack" (the packet's literal step) would have silently dropped gear crit/dodge
  in the derived path. The implemented gate skips only the GEO multipliers (refine + atk/def/hp temper —
  which enter via the hook) and KEEPS the additive crit/dodge temper in both branches.

---

## 3. The slice trail (each: battery green + commit)

| Slice | What | Commit | Contract floor |
|---|---|---|---|
| S0 — contracts | `PanoplyExactSurfaceV1` + `VaultExactSurfaceV1` (render-only, 7-state matrix, F2 `selectedDetail`) | `640a4996` | 568 → 569 |
| S1 — state | additive 5-slot `loadout` + per-instance Vault (`gearInstances`); `equipInstance`/`unequipSlot`; pure selectors; reset/prestige clear them | `ea87fddd` | 569 → 570 |
| S2 — wire | `composeGear` → derived hook, flag-aware, **single-count**; the GEO-only de-dup gate | `f4d6f997` | 570 → 571 |
| S3 — builders | LIVE `buildPanoplyExactSurface` / `buildVaultExactSurface` + `toItemDetailSurface` + item-language; fixtures renamed `*Fixture` | `67a931ca` | 571 → 572 |
| S4 — ops | confirm-gated `dismantleGearInstance` (HELD yield) + pure sort/filter proofs + §F idle-parity | `dce807c6` | 572 → 573 |
| S5 — element/path | `toGearAffinity` element-vector seam (inert while payloads null) + `resolvePathIdentity` (the three paths read distinctly) | `51b59789` | 573 → 574 |
| S6 — evidence | gear-catalog integrity contract + this doc | _this commit_ | 574 → 575 |

> **Floor metric:** "568 → 575" is the **raw `test:contracts` file count** (`runNodeTestFilesSequential`
> `passed=N total=N`, where N is *files*), monotonic per slice. It is a DIFFERENT metric from the M.I.3
> handoff's compiled "543 files / 1875 cases" snapshot — a later reader should not think the floor fell from
> 543. Both are monotonic; this packet reports the file count its battery prints.

---

## 4. The de-dup proof (S2 — the load-bearing claim)

`equipmentDerivedWire.contract.test.ts` drives `gameStore.calculatePlayerStats` under the runtime flag with
the **reference cultivator** (all shared ratings = 100), so the derived GEO base reproduces the realm row
(SA-A2 parity) and the only difference between branches is WHERE the gear multiplier lands:

- **parity-safe identity** — flag-on, nothing equipped ⇒ `composeGear` ⇒ `{}` ⇒ ×1 ⇒ the SA-A0 baseline is
  untouched.
- **single-count** — a weapon at refine 5 + atkPct 5% raises atk by **exactly ×1.155**, NOT ×1.155² (≈1.334).
  The double-count bug is provably absent.
- **branch agreement** — the same equipped state yields equal atk/hp/def/regen flag-on vs flag-off, AND equal
  crit/dodge (the GEO-only gate keeps the additive temper in both branches).
- **GEO-only gate DUAL proof** (the load-bearing case for drift C) — ONE equipped state carries a GEO temper
  (atkPct) AND two GENTLE tempers (critPct/dodgePct), so both halves of the gate are stressed at once: atk
  de-dupes to **×1.155** (the gated GEO multiply counts once, not ×1.334) WHILE crit and dodge each rise by
  **exactly +5** (the ungated additive temper survives the derived branch; a delta of *exactly* 5 also proves
  composeGear's MULTIPLICATIVE critChance/evasion — computed then discarded by the carve-out — did not leak).
  A "skip the whole legacy stack" bug fails the +5; a "no gate" bug fails the ×1.155. (Without this case the
  branch-agreement "equal crit/dodge" is trivially true — no crit/dodge temper was equipped — so the drift-C
  correction was *asserted, not proven*; this case proves it.)
- **forceLegacy wins** — `?forceLegacy=1` suppresses the derived gear and runs the legacy stack (== flag-off).

---

## 5. HELD inventory (no magnitude authored — every number is D15/F-BAL's)

- composeGear mirrors the LIVE forge values only (refine `1+0.02×lvl` cap 1.25; temper bands 2–5%) — no new
  magnitude; the 5-slot GearInstance affix compose is the marked seam (`toEquipmentGearInput`), HELD.
- affix values render as the honest **"+?"**; set thresholds stay inactive (`activeTier: null`); weapon-bond
  depth is 0; tier-gap caps and element-affinity weights are structural/null.
- dismantle yield is the **empty list** — the yield EVENT shape, never an authored placeholder number.
- per-path identity is emphasis-only (lead/support/muted) — never a geometry or magnitude change.
- **HELD-still-held, proven post-wire (named green run).** The six D8 inert-gear contracts assert the sentinels
  are unchanged and ran GREEN in the S2 battery (and every battery since — they are part of the 575):
  `gearModel.contract.test.ts` (affix `rollRange` + rarity band = `HELD`), `gearLoadout.contract.test.ts`
  (`HELD_COUNT === -1`; `accessorySlotCount` floors at 1; `resolveSetBonus` `activeTier === null`),
  `gearSetBonus.contract.test.ts` (`HELD_MULT === 1`), `gearDrop.contract.test.ts` (`HELD_RATE`; a held drop
  never drops), `gearRoll.contract.test.ts` (a held ItemDef rolls zero affixes), `gearUpgrade.contract.test.ts`
  (`upgradeMultiplier === 1`; `canUpgrade` false). S2 wired plumbing, not numbers — the sentinels are unchanged.

---

## 6. validate:content & the gear catalog (S6 finding)

`scripts/validateContent.ts` validates the **runtime content-bible JSON** (`RUNTIME_CONTENT_FILE_BY_KEY` →
`validateLoadedContent`). The D8 gear catalog (`src/content/gearItems.ts`) is an **unconsumed TypeScript
demo module**, not runtime JSON — its shape is already validated by `npm run typecheck` against `ItemDef`.
Adding a TS array to the JSON validator would be the wrong layer. The gear **content ids** are instead put
under gate validation in the right layer by `gearCatalog.contract.test.ts` (unique ids, the 5-slot taxonomy,
weaponBondable=weapon-only, setId=armor-only & >1 member, affixPool present). When D15 authors real gear into
the bible JSON, that file earns its `validateContent` entry then.

---

## 7. Flag-off guarantee

`STAT_ENGINE_DERIVED_AUTHORITATIVE_DEFAULT = false` is unchanged; this packet does NOT flip the engine
default. With the flag off (the shipped default) and under `?forceLegacy=1`, the wire's gate evaluates false,
`composeGear` is never called, the legacy refine/temper stack runs in full, and the new loadout/Vault state
is inert — the build is byte-identical. The default-on flip remains F-BAL's separate, later, separately-gated
decision (Closer C1), after the global balance pass deposits the magnitudes this packet held.

---

## 8. Carried-forward gotchas / handoff seams

Recorded here (and in-code) so they do not become a mystery regression three Movements later:

- **[F-BAL / C1] The GEO-only de-dup is correct ONLY while the carve-out discards GENTLE.**
  `deriveLegacyCombatStats` DOES produce `crit: derived.critChance` / `dodge: derived.evasion`
  (`combatStatBridge.ts:50-52`), so composeGear's MULTIPLICATIVE crit/evasion ARE computed in `mapped` — the
  gameStore carve-out (`gameStore.ts:~1088`) is the only thing discarding them, and B-MERID is already layering
  onto the GENTLE channels (`combatStatBridge.ts:38`). The moment a future packet wires crit/evasion OUT of the
  carve-out, composeGear's multiplicative crit/evasion will land AND the additive crit/dodge temper the
  GEO-gate keeps will land → crit/dodge **double-counts**. Revisit the de-dup at that flip. **Marked in-code at
  the carve-out.**
- **[Movement V — combat] `equipmentHandling` reads the legacy 2-slot ids** (see Drift A §2). When the 5-slot
  loadout becomes the equip path, migrate `EquipmentHandlingInput.equipment` to the loadout or armor harmony /
  artifact attunement go silently inactive for new-model gear. **Marked in-code** on the input contract.
- **[5-slot compose] `toEquipmentGearInput` wires only the LEGACY equip state.** The 5-slot GearInstance affixes
  compose through the SAME composeGear dict once their magnitudes leave HELD (D15). **Marked in-code.**
