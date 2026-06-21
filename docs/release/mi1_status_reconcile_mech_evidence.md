# M.I.1 — STATUS-RECONCILE-MECH · evidence

**Packet:** M.I.1 (D16/D17 manifest #04) — re-point the Status Living State Observatory's stat-bearing
instruments at the live Three-Treasures derived engine (the same source combat consumes post-F1), behind
the dev-on stat-engine flag, preserve-first, zero frozen-contract change.

**Landed:** 2026-06-21. **Class II** (high-fragility, most-tested surface). **infra-only / layer {1}.**

---

## 1 · Scope landed vs. narrowed (sanctioned by §3 + §14 stop #2)

| Instrument | M.I.1 action | Rationale |
|---|---|---|
| **Stat Meridian Constellation** (28 nodes) | ✅ **Re-pointed** at the live derived engine (M.I.1, flag-gated); the 7 Tier-2 martial nodes re-presented as **bounded percent-of-peak standings** (M.I.1b) | Source-parity to combat's engine; the martial branch reads as build *shape*, not magnitude (§6). |
| **Meridian Vessel Compass** (organs) | ⏸️ **Deferred to M.VI (Tempering Court)** | Not a gap — a §9-step-3 **category error** (§3's narrow-and-defer covers it). The vessel's organs are the meridian training/model state and already read a **live** source (`ledger.currentState.blocks`), not the legacy combat stats F1 cut over — so it never needed the F1 re-point. `computeDerivedStats` produces 21 **combat** channels and no organ-readiness channel; inventing one would be a fabricated source. Further liveness belongs to M.VI, where the meridian model is the centerpiece ("two surfaces, one model, no drift"). |
| **Spirit Root Astrolabe** (purity / fit) | ⏸️ **Deferred to Roots / Ceremony (D9)** | Same category error. Purity/fit already read a **live** source — `ledger.spiritRootObservation` from the D9 spirit-root resolver — not legacy combat stats, so no F1 re-point was ever needed. The derived engine has no spirit-root-purity channel. Further liveness (and the `meridianAstrolabeAptitudeChips`, which would also need a frozen-contract field per §6) belongs to the Roots Movement. |
| **Vitals Seal Ribbon** | ✅ **Verified (unchanged)** | `buildMetrics` already reads `useGameStore.getState().stats`, which is the F1 cutover seam — the ribbon tracks F1 automatically. Verify-only, no edit. |

The constellation is the **only** instrument with a true Observatory-vs-combat parity counterpart in the F1
derived engine, and is where the drift the packet targets actually exists. Narrowing to it is the disciplined,
preserve-first reading of §3's missing-dependency clause.

---

## 2 · Changed files

| File | Change |
|---|---|
| `src/systems/ui/status/statusObservatorySurface.ts` | Flag-gated derived-constellation branch (`+99/−23`). When `isDerivedStatEngineAuthoritative() && !isForceLegacy()`, `statConstellation` is built from the binding (subtitle coerced to the frozen literal); else the **verbatim** pre-M.I.1 literal. Builder stays **pure** (no store import, no `.getState`). Optional 2nd param `derivedConstellationInput` for test/fixture injection (live call site unchanged). Module-memo on the input signature so the 28 nodes are not rebuilt on raw qi ticks. |
| `src/systems/meridians/observatoryConstellationInput.ts` | **NEW** store-reading seam (mirrors `derivedStatInput.ts`): `toObservatoryConstellationInput()` assembles `MeridianConstellationInput` from `resolveCourtSharedStats(statRatingsById)` + `computeDerivedStats(toDerivedStatInput())` + `selectedPath`/realm + `MERIDIAN_REALM_CAPS` — the **same** getters combat reads. Keeps the surface adapter pure. |
| `src/systems/meridians/observatoryMeridianBinding.ts` | **M.I.1b** (value-presentation + copy only, no stat-source change). `boundNode`'s derived branch now renders each Tier-2 martial node as a **bounded percent-of-peak standing** (`cap = 100`, `currentRating = round(channel / strongest-martial-channel × 100)`) with shape/relative-emphasis copy and a divide-by-zero guard, instead of a bare magnitude (`cap = 0`). See §6. |
| `tests/contracts/observatoryMeridianBindingContract.test.ts` | **source-parity** test (martial nodes == `round(channel / peak × 100)`, `cap == 100`; combat GEO atk == channel × `GEO_CALIBRATION.atk` — one engine, distinct scale), **divide-by-zero guard** test (all-zero martial → 0, never 100), **live-seam** test (`toObservatoryConstellationInput().derived` deep-equals `computeDerivedStats(toDerivedStatInput(), {})`), and tightened W8 assertions to the bounded presentation. Honest: asserts source-parity + the per-instrument split, **not** a false `node == combat-fight-value` equality. |

`statusObservatoryTypes.ts` (frozen contract): **untouched.** No `data-testid` changed.

---

## 3 · Stop-condition determinations (§14)

| # | Condition | Result |
|---|---|---|
| 1 | Derived input getter combat reads wired under `?statEngine=1` | **Clear.** `gameStore.ts:990-1003` branches on `isDerivedStatEngineAuthoritative() && derivedInputGetter`; getter wired at `gameLoop.ts:326` (`setDerivedStatInputGetter(() => toDerivedStatInput())`). |
| 2 | Binding input satisfiable without a new adapter | **Clear (constellation).** `MeridianConstellationInput` fully assembled from the same live functions `toDerivedStatInput` reads. Vessel/astrolabe → no derived source → narrowed (M.I.1b). |
| 3 | Flag-off / forceLegacy byte-identical | **Clear.** The legacy branch is the verbatim original literal; `useDerived=false` reduces `nodes`/`selectedStatId`/`weakLinks` to the original expressions. All flag-off Observatory contracts pass. |
| 4 | `data-testid` / 28-node / 8-7-6-7 preserved | **Clear.** Binding pins `rootTestId 'status-stat-constellation'`, 28 ids = live geometry, branchCounts {8,7,6,7} (contract-locked). |
| 5 | Contract floor only rises | **Clear.** +1 parity test; none deleted/weakened. |

---

## 4 · Verification battery (all green)

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ `tsc --noEmit` clean |
| `npm run check:icons` | ✅ No emoji icon usage |
| `npm run validate:content` | ✅ Content validation passed |
| `npm run test:contracts` | ✅ **543/543 files, 1875 cases, 0 fail** (`✔ M.I.1 source-parity …`, `✔ M.I.1b … divide-by-zero guard …`, `✔ M.I.1 live seam …` all passed). Floor rose; nothing deleted/weakened. |
| `npm run build` | ✅ vite build `✓ built in 7.84s` (chunk-size warning only) |

The purity contract `statusObservatorySurface.test.ts` ("adapter stays pure — no `.getState`, no `stores/` import")
is **green** — the store reads live in the `meridians/` seam, exactly as F1's `derivedStatInput.ts` does.

---

## 5 · Perf (W8.3)

- The heavy instrument components (`StatusStatMeridianConstellation`, …) are already `React.memo`'d via a shared
  deep-equal `fx/memoProps.ts`, so they do **not** re-render on a qi tick when their data is unchanged (the §19
  acceptance). The M.I.1 module-memo (`buildDerivedConstellation`, keyed on the input signature) returns a **stable
  reference** across qi ticks — the derived input never changes on a raw tick — so the 28-node surface is rebuilt
  only when the derived inputs actually change.
- The deeper hook-level `useObservatoryVitals` subscription split (decoupling the *legacy* whole-surface rebuild
  from qi ticks in `useStatusDashboardSurface.ts`) is a pre-existing optimization opportunity **not** required to
  meet M.I.1's acceptance (no heavy re-render on qi ticks) and is held as a non-blocking follow-up rather than risk
  a render-layer refactor on a Class II screen.

---

## 6 · Parity — what IS and ISN'T achieved (adversarial-reviewed)

A 3-lens adversarial review (contract-safety, runtime-correctness, parity) ran on the diff. Contract-safety and
runtime-correctness returned **ship**; the parity lens surfaced a real, important distinction that is recorded
here honestly rather than papered over.

**✅ Source-parity (achieved, machine-checked).** The Observatory and combat consume **one engine on one input** —
there is no parallel/forked computation, which is the §10 failure mode M.I.1 exists to prevent. The live seam
`toObservatoryConstellationInput().derived` deep-equals the exact `computeDerivedStats(toDerivedStatInput(), {})`
call `gameStore.calculatePlayerStats()` consumes (live-seam test), and the 13 axis/foundation nodes show the same
shared-tier ratings (`resolveCourtSharedStats`) that feed combat's derived engine. **This is the real anti-drift win:
the constellation no longer reads the stale legacy training snapshot — it reads the live derived model combat uses.**

**✅ Display resolved by M.I.1b (the 7 martial nodes are now a bounded shape readout).** The review found the
spec-locked binding originally rendered the Tier-2 martial nodes as **bare unbounded magnitudes** (`cap = 0`) — e.g.
selecting `flow_step` showed "Speed — 1575" while the Vitals Ribbon, two instruments away, showed the real combat
speed (~1.5). Two "attack/speed" numbers disagreeing on the demo's opening screen is a doctrine violation (a visual
implying wrong mechanics). The fix (decided with the packet owner) is **M.I.1b**, a tight value-presentation + copy
change to the binding:
- Each martial node is now a **bounded percent-of-peak standing**: `currentRating = round(channel / strongest-martial-channel × 100)`, `cap = 100`. The branch reads as the **silhouette/shape** of the martial build (D2 anti-funnel: role/shape, not power) — the same *kind* as the axis/foundation nodes, with `capPct`-driven relative brightness.
- Copy (`effectSummary`/`detail`/`value`) reframes them as "N% of your peak martial channel — relative emphasis, not a combat total" / "peak martial channel," never "your attack = N."
- **Divide-by-zero guard:** an all-zero martial set (fresh/locked) reads 0 (dim), never a spurious 100.
- **Stat source unchanged** — still `computeDerivedStats(toDerivedStatInput())` (source-parity preserved); this is value-presentation + copy only.

This dissolves the collision at the source: the constellation no longer voices a magnitude, and the **Vitals Ribbon
remains the sole owner of the literal fight number** (already F1-tracked).

**Corrected parity invariant (the deeper bug the review surfaced).** Packet §19's "every stat-bearing instrument's
value equals the value combat reads" is **mis-specified** — it would poison every downstream surface's acceptance.
Parity is **per-instrument**: **source-parity** for the constellation (same engine input; a shape readout), and
**literal value-parity** for the Vitals Ribbon (which already holds). The contract test asserts exactly this split.
*Recommended packet edit: rewrite §19 accordingly.*

**Scope honesty (§5).** M.I.1b **does edit** the spec-locked binding's Tier-2 value-presentation, so §5's "imported
as-is — never edited" no longer holds for the binding. This was the packet owner's explicit call; it lands
contract-true — the binding contract rose to assert the bounded percent-of-peak presentation strictly (floor up, not
weakened): the parity test now asserts `node == round(channel / peak × 100)` and `cap == 100`, plus a divide-by-zero
guard test, and the prior `Number(String(x))===x` tautology flagged by the review was removed.

**Residual (honest, minor).** The render-only `StatBeadLens` / `ariaLabelForNode` (M.I.3 territory, off-limits, and
not cleanly gateable to derived-only nodes without a frozen-contract field) still format the **numeric** "Current
Value" and aria generically as "X / 100" (peak → "100 / 100"). The percent-of-peak *meaning* is carried by the bead's
**Effect** copy (shown verbatim) and the node `detail`/`value`. Reframing the numeric/aria text to "N% of peak"
literally is a small M.I.3-adjacent renderer follow-up.

## 7 · Visual oracle — captured (Playwright / Chromium vs the dev server)

- **Live parity pair** — `tests/e2e/mi1-parity.spec.ts` at 2048×1152 dSF2, seeded with a real cultivator (the 13
  shared-tier ratings that feed `resolveCourtSharedStats → computeDerivedStats`) so the live-derived constellation
  has coherent data:
  - `docs/release/qa/mi1-status-reconcile/observatory-{derived,legacy}.png` — the whole Observatory under
    `?statEngine=1` vs `?forceLegacy=1`. The constellation + vitals readings visibly differ; `forceLegacy` restores
    the legacy training-snapshot reading.
  - `constellation-derived.png` / `vitals-derived.png` — derived close-ups.
  - The spec also machine-asserts that the constellation node-aria set and the vitals **differ** between the two
    engines (one input, distinct readings).
- **Perf proxy** (same spec) — under `?statEngine=1` the constellation node-aria is **stable across qi ticks** while
  the vitals advance: the behavioral form of the W8.3 memo (the heavy instruments are also `React.memo`-guarded).
- **Six-state scenic matrix** — `tests/e2e/status-observatory-states.spec.ts` (`?obsFixture=`) renders all six states
  with the nine instrument regions and correct tone/dominant/canopy-mode (the scenic/state-overlay + legacy-reading
  proof), captured to `artifacts/s9-observatory-foundation/screenshots/`. *(That existing spec trips a stale hardcoded
  `regionCount === 9` assertion — the WIP tree now renders a 10th `obs-region-*` from other work; all nine named
  regions are present and correct, so the screenshots are valid; the count assertion is unrelated to M.I.1.)*

**NAMED GAP (not papered over):** the `?obsFixture=` matrix injects a SYNTHETIC ledger, but the derived re-point reads
LIVE stores — so under `?statEngine=1` the fixtures are **not** coherent with the derived constellation. A flagged
six-state matrix would need a seeded SAVE per state (or the harness extended to stub the derived input via the
builder's optional `derivedConstellationInput` param); that is a tracked harness follow-up, not built here. The
seeded-live-state **parity pair** is the correct oracle for the derived constellation.

---

## 8 · Continuity & fallback

`?forceLegacy=1` always wins (`isDerivedStatEngineAuthoritative()` returns false) → the legacy training-snapshot
reading and the legacy card-grid are restored. Flag-off (shipped default) is byte-identical. No legacy path removed;
`forceLegacy` retirement remains deferred to Closer C2.

> **Working-tree note:** this packet was implemented on a tree already carrying uncommitted F0/F1/F2/F3 work.
> M.I.1's edits are confined to the three files above + this doc; they were **not** committed (no commit was
> requested), so the "one preserve-first commit" can be staged from exactly these paths when desired.
