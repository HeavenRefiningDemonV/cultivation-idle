# Held-numbers ledger — the running list for the terminal F-BAL pass

**Purpose:** every balance magnitude deliberately HELD during the rework's feature-structure work is
parked here so the terminal **F-BAL** pass (D16 Part B.5 — the near-terminal join that tunes every
system, after combat + equipment exist) authors them as one coherent flip and loses none.

**Doctrine (why these are held, not authored now):** the rework ships feature STRUCTURES + real
MAPPINGS but holds the magnitudes, because (a) the magnitudes are D15/F-BAL-owned, (b) authoring them
against unbuilt consumers (D11 combat, D8 equipment) is the foundation-after-frame trap one layer up,
and (c) flipping the engine to players is a release decision gated on completion + a GO release gate.
**Do NOT author any value below outside F-BAL.** This is a checklist, not a spec.

Last updated: 2026-06-23 (consolidation checkpoint #2 — D8 law + D11 3b-0/i/ii/iii affliction-effect
coeffs all held/inert; S9/S10 live-instrument fidelity matrix landed).

**F-BAL manifest (the single terminal-pass checklist — every held/inert magnitude this rework parked):**
1. Breakthrough risk / failure table (progression regime) — §1
2. B-MERID path-meridian signature coefficients (`‹tune W12›`) — §2
3. B-STATS focus-emphasis coefficient (`FOCUS_EMPHASIS_PRIMARY = 0`, inert) — §3
4. B-ELEM element tuning + Beast-Lore drop + Weapon-Bond curve + per-enemy element assignment + the
   D11 affliction-effect coeffs (DoT `dotTickCoeff`/interval, ICD windows, hard-CC `controlSkipChance`) — §4
5. D8 equipment gear hook (`composeGear` mapping/rarity/affix/set magnitudes) + the slice-1b de-dup
   **refactor precondition** (a behavior change, not a magnitude — logged so it isn't lost) — §5
6. The shipped engine flag (flip #2: default-on for players) — §6

---

## 1. Breakthrough risk / failure table (progression regime)
- **What:** live per-realm `TRANSITION_RISK` (`src/systems/breakthrough/breakthroughStabilityResolver.ts`)
  diverges from D6/D15 canon: base risk R1/R2/R3 = `8/11/14` (canon `9/12/15`); failure qiLoss R1/R2/R3
  = `18/22/28` (canon `20/25/30`); R3 turbulenceGain `24` (canon `25`).
- **Held because:** anchored progression constant; belongs to the same regime as the legacy ×10 cost /
  6-realm ladder — flip the whole regime once (cost + ladder + risk together).
- **Detail:** [DR-breakthrough-risk-table-drift.md](DR-breakthrough-risk-table-drift.md).

## 2. B-MERID — path-meridian signature coefficients (`‹tune W12›`)
- **Where:** `meridianSignatureEffects()` in `src/systems/meridians/derivedStats.ts`.
- **Held values (rating × k):** swordHeartDrIgnorePct `×0.3` · ironSkinThreshold `×0.5` ·
  mountainStanceReflectPct `×0.4` · unbrokenMomentumStacking `×0.02`/turn · heavenlyMandateAuraPct
  `×0.3` · voidGazeWeaknessPenPct `×0.5`. (Root-Depth + capstones are structural booleans, not tuned.)
- **Held because:** D15/F-BAL owns the magnitudes; B-MERID consumes the function output, never retunes.
- **Status:** consumed live in combat under `?statEngine=1` (provisional effect; flag-off byte-identical).

## 3. B-STATS — focus emphasis coefficient
- **Where:** `FOCUS_EMPHASIS_PRIMARY` in `src/systems/meridians/focusEmphasis.ts` — currently **0**.
- **Intended (D15, LEAN, no value in doc):** `focusMultiplier_primary` ≈ ×1.5–×2.5 (emphasised axis),
  `focusMultiplier_secondary` ≈ ×0.6–×0.8 (others).
- **Held because:** a non-zero value diverges from the derived-stat PARITY baseline by design — that
  re-baseline is F-BAL's. Shipped at 0 ⇒ `applyFocusEmphasis` is the identity (parity exact).
- **F-BAL action:** set the primary (and add the secondary if the model wants it), re-baseline parity.

## 4. B-ELEM — element tuning (`DEFAULT_ELEMENT_TUNING`)
- **Where:** `src/systems/elements/elementTuning.ts` (every field `[tune]`; F3 owns shape + caps).
- **Held values (placeholders):** resonanceBonusPerEdge `0.05` · counterAffinityDelta `0.1` ·
  offElementBlunt `0.1` · resistHardcap `0.75` · resistHalfSaturation `100` · counterPenetration `0.1`
  · affinitySoftcapKnee `1` · affinitySoftcapTailDivisor `2` (+ reaction/state fields).
- **D15 bands (intended, not in code):** affinity `+8%…+30%`/tier (LEAN) · off-element floor `×0.65`
  (LEAN — code's `offElementBlunt 0.1` is a different shape, reconcile) · resist cap `75%` (ANCHORED) ·
  resist K `≈120` (PROVISIONAL — code has `100`, reconcile).
- **Held because:** D15 owns the values; applied in D11 combat (in progress) under `?statEngine=1`.
- **Also held (B-ELEM seam):** `buildPlayerElementWeights` puts weight `1` on the root element — a
  structural placeholder, not a tuned magnitude; weights aggregate from D7/D8/D10 in later packets.
- **Per-enemy element assignment (D11 DR-11j):** `EnemyDefinition.element` is a live optional FIELD,
  but WHICH enemy carries WHICH element is **D15-owned** ("fair anti-funnel distribution"). No enemy
  has one yet ⇒ the counter/resist matchup layer (D11 slice 2) is inert until D15 assigns them.
- **Reaction/state effect magnitudes (D11 slice 3):** `reactionBase`, `severCapMultiple`,
  `burstCapMultiple`, `stateBaseDurationMs`, `stateMaxIntensity`, `stateEscalationThreshold`, the
  per-family ICD windows (`icdMsByFamily`) — all in `DEFAULT_ELEMENT_TUNING`, all D15-held.
- **D11 slice 3b-0 (landed):** enemy element afflictions now AGE + EXPIRE on the tick heartbeat
  (`elementStateTick.ts`) — lifecycle only, NO new magnitude (decrement uses live deltaTime +
  the written `remainingMs`), parity-safe (no effect applied yet).
- **D11 slice 3b-i (landed, HELD AT 0):** `dotTickCoeff = 0` + `dotTickIntervalMs = 1000` now exist in
  `DEFAULT_ELEMENT_TUNING` (independent of `reactionBase`). DoT-category afflictions tick via a true
  interval-accumulator (`dotTickCoeff × intensity × realmScalar` per interval) but deal **zero** damage
  until D15 deposits `dotTickCoeff` — F-BAL action: set `dotTickCoeff` (and tune `dotTickIntervalMs`),
  acknowledge the intended flag-on parity divergence.
- **D11 3b-ii (landed):** reaction ICD write/decay/gate is now live — `isEligible` consumes the live
  `icdByPathway` (reaction-id → ms), armed on fire with the **held** `icdMsByFamily = 3000` window
  (consumed live under the flag, B-MERID-style; D15 owns the real per-family windows). Flag-on reactions
  now respect ICD (anti-spam); flag-off byte-identical.
- **D11 3b-iii (landed, INERT):** the hard-CC skip-turn gate is wired (`elementControlGate.ts`,
  `frozen`/`petrified` → enemy loses its turn) but `controlSkipChance = 0` (HELD) ⇒ never skips ⇒
  flag-on byte-identical (DoT-coeff-0 flavor, not the live ICD flavor). **F-BAL/D15 BLOCKERS before a
  non-zero value:** (1) **no enemy Stagger/CC-Resist source** exists (enemies have no derived layer — the
  canon `controlPower` vs `stagger` roll has no denominator); (2) **perma-lock risk** — refresh-not-stack
  (4000ms) vs 1000ms player-attack would lock the enemy all fight, so a live value needs a
  duration/CC-immunity-window model. Also confirm the player `controlPower` channel is combat-readable.
- **D11 3b remaining (HELD):** the real `controlPower`-vs-`stagger` roll (3b-iii-c, blocked above) +
  soft-CC action-rate reduction (3b-iii-b); spread radius/count; drain/tempo/cleanse/catalyst magnitudes
  — all D15-held.
- **Beast-Lore drop rate + per-beast→essence mapping (D11/D15):** the placeholder absorbs the next
  essence per kill; the real drop rate + which beast drops which essence are held.
- **Weapon-Bond curve (D5/D15):** `BOND_KILLS_FOR_FULL=25` + the per-art unlock bands (in
  cultivationSeatSurface buildInstrument martial branch) are placeholders — the real kills→depth and
  art-unlock thresholds are held. The bond store's `bondKills` is a structural count, not a magnitude.

## 5. D8 — equipment gear hook (`composeGear`)
- **Where:** `composeGear()` in `src/systems/equipment/equipmentGearResolver.ts` → the `gear` param of
  `computeDerivedStats` (`derivedStats.ts:265`), fed `{}` at `gameStore.ts:1076` today.
- **Slice 1a (landed):** the LAW only, NOT wired. Re-expresses LIVE forge values (refine `1+0.02×lvl`
  cap 1.25; temper bands 2–5%) through the Tier-3 channels — **no new magnitude**. Parity-safe
  (`composeGear([]) === {}`).
- **Held (D8 content + D15/F-BAL):** the channel-mapping weights, rarity multiplier tuple, affix bands
  (DR-08), bond/set/foresight curves, the hpRegen ½-share, and the whole item-instance model (armor
  slots, drops, upgrade curve).
- **Held refactor (slice 1b, NOT a magnitude — a behavior change):** wiring `composeGear` into
  gameStore MUST make the legacy refine/temper multiply (`gameStore.ts:1231-1269`) flag-aware so an
  equipped bonus counts exactly once; applying the multiplier at the derived-channel level vs the
  legacy-stat level is not guaranteed numerically identical — needs an equivalence check before flip.

## 6. The shipped engine flag (flip #2)
- **Where:** `STAT_ENGINE_DERIVED_AUTHORITATIVE_DEFAULT = false` (`src/systems/meridians/statEngineFlag.ts`).
- **Held because:** flip #2 (default-on for players) is F-BAL's, after the global balance pass + a GO
  release gate. F1 only did flip #1 (dev-on via `?statEngine=1`).

---

### F-BAL preconditions (when this ledger is actioned)
D11 (combat) present so element affinity/resist/reactions have a real consumer; D8 (equipment) present
so the gear half of the derived layer can be tuned; the broad release gate GO (integration/migration +
fresh-run coverage). Then: author §1–§4, re-baseline parity ONCE, flip §5 — coherently, together.
