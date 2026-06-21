# M.I.1 / M.I.1b — Session Handoff Log (for the M.I.3 chat)

**Date:** 2026-06-21 · **Branch:** `Latest` · **Status:** M.I.1 + M.I.1b **code-complete, verified, committed.**

This log is the authoritative "what happened / where we are / where M.I.3 picks up." Read it before starting M.I.3.

---

## 0 · TL;DR

- **M.I.1 STATUS-RECONCILE-MECH** (re-point the Stat Meridian Constellation at the live Three-Treasures derived
  engine) is **done**. Its adversarial-review follow-up **M.I.1b** (martial nodes → bounded percent-of-peak shape)
  is also **done**.
- Landed as **6 ordered atomic commits** on branch `Latest`. Tip is green: `typecheck` clean, `test:contracts`
  **543/543 files, 1875 cases, 0 fail**.
- **M.I.3 STATUS-RECONCILE-PORT** (threads / telemetry-motion / state-overlays) is the next packet and **gates on
  M.I.1, which is now satisfied.** One small render-only item was explicitly **parked into M.I.3** (see §5).

---

## 1 · The commits (branch `Latest`)

| order | hash | commit |
|---|---|---|
| Phase-0 #00 | `4840ead4` | feat(ui-kit): deposit shared item-language tokens — rarity/affix/path (F0) |
| Phase-0 #01 | `ce7afd21` | feat(stat-engine): Three-Treasures derived combat engine behind dev flag (F1) |
| Phase-0 #03 | `b7308580` | feat(modals): shared Inspector + Ritual Ceremony Shell surfaces (F2) |
| Phase-0 #02 | `bdcd7c53` | feat(elements): single pure element resolver + catalog (F3) |
| M.I.1 (#04) | `28709f70` | feat(status): re-point Stat Meridian Constellation at live derived engine (M.I.1) |
| M.I.1b | `27e01f7e` | feat(status): martial constellation nodes as percent-of-peak shape (M.I.1b) |

> The working tree had been a tangled soup of uncommitted F0/F1/F2/F3 + M.I.1 work. It was untangled by
> **dependency order** (forensic file→feature attribution, cross-validated) so each commit is atomic and reverts as a
> unit. **Left uncommitted by design:** gate-run timestamp churn (`go_no_go_checklist.md`, `known_issues.md`,
> `signoff_sheet.md`, `p4_prestige_runtime_effect_audit.{md,json}`), the deleted `menu-function-evidence/*.png`, the
> `playwright-report` byproduct, and all scratch (`.tmp-*`, `*.zip`, `obs-preview.*`, `status mockups and docs/`,
> `test-results/`, `artifacts/`, `nul`, the standalone `tests/e2e/capture-all-menus.spec.ts` tooling).

---

## 2 · What M.I.1 actually changed (the seam)

The Observatory's **Stat Meridian Constellation** now reads the **live derived engine combat consumes** under
`?statEngine=1` (the dev-on F1 flag), instead of the legacy training snapshot.

- **`src/systems/ui/status/statusObservatorySurface.ts`** — the surface builder. Added a flag-gated branch: when
  `isDerivedStatEngineAuthoritative() && !isForceLegacy()`, `statConstellation` is built from the binding instead of
  `ledger.namedStats`. **The builder stays a pure, contract-locked adapter** (`statusObservatorySurface.test.ts`
  forbids `.getState(` and any `from "…stores/…"` import) — so the store reads live in a new `meridians/` seam.
- **`src/systems/meridians/observatoryConstellationInput.ts`** *(new)* — the store-reading seam,
  `toObservatoryConstellationInput()`, mirroring `derivedStatInput.ts`. It assembles the binding input from the
  **same** getters combat uses: `resolveCourtSharedStats(useTrainingStore...statRatingsById)` for axes/foundation +
  `computeDerivedStats(toDerivedStatInput())` for the derived channels → **structural source-parity, no fork.**
- The live call site stays `buildStatusObservatorySurface(surface)` (one arg, pinned by
  `statusObservatoryRouteSafety.test.ts`); the builder's optional 2nd param is for **test/fixture injection only**.
- Frozen `subtitle` literal / `rootTestId` / 28-node 8-7-6-7 split **preserved**; a module memo keeps qi ticks from
  rebuilding the 28 nodes. **Flag-off / `?forceLegacy=1` ⇒ byte-identical legacy reading.**

---

## 3 · What M.I.1b changed (the doctrine fix the review caught)

The adversarial review found the Tier-2 **martial** nodes were rendering as **bare unbounded magnitudes** (`cap=0`,
e.g. "Speed 1575") — which read as fight stats and **collided with the Vitals Ribbon** on the demo's opening screen
(a doctrine violation: a visual implying wrong mechanics).

- **`src/systems/meridians/observatoryMeridianBinding.ts`** — `boundNode`'s derived branch now renders each Tier-2
  martial node as a **bounded percent-of-peak STANDING**: `currentRating = round(channel / strongest-martial-channel
  × 100)`, `cap = 100`. The branch reads as the **silhouette/shape** of the martial build (D2 anti-funnel: role/shape,
  not power) — the same *kind* as the axis/foundation nodes. Copy (`effectSummary`/`detail`/`value`) reframes them as
  "N% of your peak martial channel — relative emphasis, not a combat total" / "peak martial channel." **Divide-by-zero
  guard:** an all-zero martial set reads 0 (dim), never 100. **Stat source unchanged** (value-presentation + copy
  only — source-parity preserved).
- This **edits the W8 spec-locked binding** (owner-approved); §5's "imported as-is" no longer holds for it. The
  binding contract (`observatoryMeridianBindingContract.test.ts`) rose to assert the bounded presentation strictly.

### The deeper bug the review surfaced — the parity invariant (IMPORTANT for every downstream Status surface)

Packet **§19's "every stat-bearing instrument's value equals the value combat reads" is MIS-SPECIFIED** and would
poison every downstream surface's acceptance. **Parity is PER-INSTRUMENT:**
- **Source-parity** for the **constellation** — it reads the same `computeDerivedStats(toDerivedStatInput())` combat's
  GEO base derives from; it is a **role/shape readout**, never a literal combat magnitude.
- **Literal value-parity** only for the **Vitals Seal Ribbon** — which already tracks `game.stats` post-F1 (it is the
  sole owner of the literal fight number).

*Recommended packet edit (M.I.1 §19): rewrite the invariant to this per-instrument form.*

---

## 4 · Verification + evidence

- **Battery (committed tip):** `typecheck` ✅ · `check:icons` ✅ · `validate:content` ✅ · `test:contracts` ✅
  **543/543 files, 1875 cases, 0 fail** · `build` ✅. The contract floor rose by the parity / divide-by-zero /
  live-seam tests; nothing was deleted or weakened.
- **Live parity-pair e2e** (`tests/e2e/mi1-parity.spec.ts`, 2048×1152 dSF2, **passes**): seeds a real cultivator (the
  13 shared-tier ratings) so the live-derived constellation has coherent data, then captures `?statEngine=1` vs
  `?forceLegacy=1` and asserts the constellation node-aria + vitals **differ** and that the derived martial branch is
  percent-of-peak. Screenshots in `docs/release/qa/mi1-status-reconcile/` (`observatory-{derived,legacy}.png`,
  `constellation-derived.png`, `vitals-derived.png`). *(Screenshots are excluded from the round-up zip per its own
  QA-PNG exclusion rule; they are in the repo working tree.)*
- **Perf proxy** (same spec, passes): under the flag the constellation node-aria is **stable across qi ticks** while
  vitals advance — the behavioral form of the W8.3 memo (the heavy instruments are also `React.memo`-guarded).
- **Six-state scenic matrix** (`tests/e2e/status-observatory-states.spec.ts`, `?obsFixture=`): renders all six states
  with the nine instrument regions + correct tone/dominant/canopy-mode. *(That existing spec trips a stale hardcoded
  `regionCount === 9` — the tree now renders a 10th `obs-region-*` from other WIP; all nine NAMED regions are present
  and correct, so the screenshots are valid. Unrelated to M.I.1.)*
- Full evidence: **`docs/release/mi1_status_reconcile_mech_evidence.md`**.

---

## 5 · What M.I.3 inherits and must do

**M.I.3 = STATUS-RECONCILE-PORT** — the display-functional finish on top of the now-correct numbers:
selection cross-highlight **threads**, telemetry-driven **motion** (tick-ring ∝ cultivation rate, breath pulse,
qi-flow shimmer), and **state overlays** (postFailure "GATE TRIAL FAILED" chop, prestige "REINCARNATION RECOMMENDED"
edict). It is the render/port packet; **its territory is the render-only instrument components**, which M.I.1/M.I.1b
deliberately did **not** touch.

**Item parked into M.I.3 — the numeric/aria "% of peak" reframe.** Today the martial nodes carry the percent-of-peak
*meaning* in the bead's **Effect** copy (`effectSummary`, rendered verbatim by `StatusStatBeadLens`), which matches
the doctrine; but the bead's numeric "Current Value" and the SVG `aria-label` still format generically as `X / 100`
(`StatusStatMeridianConstellation.tsx` `ariaLabelForNode` line ~195; `StatusStatBeadLens.tsx` `valueLabel` line ~29).
That is a **labeled, coherent interim** (consistent with the axis/foundation "X / 100" idiom), **not a lie** — so it
was correctly deferred. To reframe the numeral to literal "N% of peak":
- It is a **render-only** change (off-limits to a mechanical reconcile; it's M.I.3's lane).
- There is **no legacy-safe discriminator** to special-case derived nodes in the renderer without breaking the
  byte-identical-legacy guarantee (keying on `tier === 'advanced'` would bleed into the legacy path). The clean fix
  needs a **`valueFormat: 'ratingOfCap' | 'percentOfPeak'`** field on the frozen `StatusObservatoryStatNodeSurface`.
- **That field addition is an additive surface-field packet that must land FIRST and feed the render packet** — do
  NOT add a contract field inside a reconcile, and do NOT hack a flag-reading heuristic into a render-only component.

**Key files M.I.3 will work in** (all unchanged by M.I.1, at current state in the bundle):
- `src/ui/status/observatory/*.tsx` + `*.scss` — the ten instruments + the `StatusLivingStateObservatory` shell +
  `StatusStatBeadLens.tsx` + `fx/memoProps.ts` (the heavy instruments are already `React.memo`-guarded).
- `src/systems/ui/status/statusObservatoryTypes.ts` — the **FROZEN** contract (any new field = a separate prior
  additive surface packet).
- `src/systems/ui/status/statusObservatoryPresentation.ts` — geometry + label registries.
- `src/systems/ui/status/statusObservatorySurface.ts` — the builder (now flag-gated; M.I.3 adds threads/motion/
  overlay *data* to the typed surface, the components render it).
- `src/systems/ui/status/statusObservatoryFixtures.ts` — the `?obsFixture=` six-state harness.

---

## 6 · Deferred ELSEWHERE (scope corrections — not M.I.3, not a gap)

The original packet §9-step-3 told M.I.1 to also re-point the **Meridian Vessel Compass** and the **Spirit Root
Astrolabe** at the derived engine. That was a **category error** (§3's narrow-and-defer covers it), now corrected:

- **Vessel → M.VI (Tempering Court).** Its organs are the meridian training/model state and already read a **live**
  source (`ledger.currentState.blocks`), not the legacy combat stats F1 cut over — so it never needed F1's re-point.
  `computeDerivedStats` yields 21 **combat** channels and no organ-readiness channel; inventing one would be a
  fabricated source. Further liveness belongs to M.VI ("two surfaces, one model, no drift").
- **Astrolabe → Roots / Ceremony (D9).** Purity/fit already read a **live** source (`ledger.spiritRootObservation`
  from the D9 resolver), not legacy combat stats. The derived engine has no spirit-root-purity channel. Further
  liveness (and the `meridianAstrolabeAptitudeChips`, which would also need a frozen-contract field per §6) belongs to
  the Roots Movement.

---

## 7 · Gotchas carried forward (verified this session)

- The Observatory **surface builder must stay pure** — `statusObservatorySurface.test.ts` greps its source for
  `/\.getState\s*\(/` AND `from "…stores/…"`. Keep store reads in a `meridians/` seam (the F1 / M.I.1 pattern).
- The live call site is pinned to **`buildStatusObservatorySurface(surface)`** (one arg) by
  `statusObservatoryRouteSafety.test.ts`. Do not add a second arg there.
- `test:contracts` **does compile `tests/e2e`** via `tsconfig.tests.json` — an e2e spec with a type error (e.g.
  Playwright `annotations.push({text})` instead of `{description}`) **fails the contract gate**. Run `test:contracts`,
  not just Playwright, after touching e2e specs.
- Element-screenshot of an Observatory instrument **hangs** (continuous JS-driven motion never stabilizes); use
  `page.screenshot({ fullPage: true })` (no `animations:'disabled'` on fullPage) and treat region close-ups as
  best-effort with a short timeout + `.catch()`.
- **`?obsFixture=` is NOT coherent with the derived constellation under the flag** (it injects a synthetic ledger; the
  derived re-point reads LIVE stores). A flagged six-state matrix needs a seeded SAVE per state, or the harness
  extended to inject a per-state derived input via the builder's optional `derivedConstellationInput` param. This is a
  tracked **harness follow-up**. The seeded-live **parity pair** is the correct derived oracle.
- Contract floor count is the **case** count from the sequential runner (`1875` now), distinct from the **file** count
  (`543`). Don't conflate.

---

## 8 · Bundle note

This handoff sits in the M.I.1b refresh of `section-a-roundup.zip` (prior F1/F2/F3 state backed up as
`section-a-roundup.zip.bak-pre-mi1-20260621`). The zip refresh replaced `statusObservatorySurface.ts`,
`observatoryMeridianBinding.ts`, and `observatoryMeridianBindingContract.test.ts` with current content, and added
`observatoryConstellationInput.ts`, `mi1-parity.spec.ts`, `mi1_status_reconcile_mech_evidence.md`, and this log.
