# M.I.3 — STATUS-RECONCILE-PORT · evidence

**Packet:** M.I.3 (Movement I, port leg) — the Living State Observatory's liveness layer: telemetry-driven
motion, the 4th cross-highlight family, and the read-only motion-hint surface field. **Class II**, additive,
preserve-first. Gates on **M.I.1** (landed) + F1/SA-A4 dev-on (landed). **Landed:** 2026-06-21.

Touched layers `{2 (typed-attribute wiring), 4 (polish/motion)}`. Layer 1 (scenic) untouched — no instrument
repainted. The frozen contract grows by one **additive** field; no existing field changed shape.

---

## 1 · Deliverables (S0 + G1–G4)

| ID | Gap | Done |
|---|---|---|
| **S0** | Frozen contract carries no motion-hint channel | ✅ `meta.motionHints: { qiPerSecond, cultivationRate }` added (additive); populated in the builder via a pure store-reading seam. |
| **G1** | Motion fed `null` telemetry (spin a constant, qi-flow has no live rate) | ✅ The **global** tick-driven vars are set once on the stage from `meta.motionHints` and **cascade** to all instruments; the heavy instruments stop overriding them — so live motion costs **zero heavy re-renders** (stop #3). |
| **G2** | `--qi-flow-rate` bound to nothing in SCSS | ✅ Bound (divide ⇒ faster qi/s = faster drift) on vessel `__channelFlow`/`__threadGlow` and canopy **`__cord`** (the packet's `__thread` is static — corrected). Reduced-motion already freezes both. |
| **G3** | Root-Law instrument never consumes selection (the 4th family) | ✅ `StatusRootLawCoupledInstrument` consumes `useObservatorySelection`; the bridge + astrolabe brighten on a `kind:'rootLaw'` selection and the bridge is selectable; SCSS brighten rule beside the other three. |
| **G4** | State atmosphere + decree unproven across the six states | ✅ Verified + screenshot matrix (see §4). |

---

## 2 · Changed files

| File | Change |
|---|---|
| `src/systems/ui/status/statusObservatoryTypes.ts` | **S0** — `interface StatusObservatoryMotionHints` + additive `meta.motionHints`. No existing field changed. |
| `src/systems/ui/status/observatoryMotionInput.ts` | **S0 (new)** — pure store-reading seam `toObservatoryMotionHints()` (reads the raw `qiPerSecond` Decimal string, normalizes `cultivationRate = clamp(log10(1+qi/s)/QI_RATE_LOG_SPAN, 0, 1)`, `[tune]→D15`). Mirrors the M.I.1 seam so the builder stays pure. |
| `src/systems/ui/status/statusObservatorySurface.ts` | **S0** — imports the seam, populates `meta.motionHints` (builder stays pure: no `.getState`/`stores/`). |
| `src/ui/status/observatory/StatusLivingStateObservatory.tsx` | **G1** — the shell computes the global motion vars from `meta.motionHints` and sets `--qi-flow-rate`/`--tick-spin-dur`/`--breath-period` on `.obsStageViewport` (cascade). |
| `src/ui/status/observatory/StatusSpiritRootAstrolabe.tsx` | **G1/G3** — applies ONLY its per-instrument vars (needle/purity); adds a `related` prop → `data-related` on its section. |
| `src/ui/status/observatory/StatusMeridianVesselCompass.tsx` | **G1** — drops its local motion (cascade provides qi-flow/breath); keeps `data-animate`. |
| `src/ui/status/observatory/StatusBottleneckTalismanCanopy.tsx` | **G1** — same (4 part-roots); keeps `data-animate`. |
| `src/ui/status/observatory/StatusRootLawCoupledInstrument.tsx` | **G3** — consumes selection; bridge `data-related` + selectable; passes `related` to the astrolabe. |
| `src/ui/status/observatory/StatusLivingStateObservatory.scss` | **G2/G3** — `--qi-flow-rate` calc-binds (vessel + canopy `__cord`); rootLaw bridge/astrolabe brighten rule. Token-only, no raw hex, no layout shift. |
| `tests/contracts/statusObservatorySurface.test.ts` | **S0** — `motionHints` presence + null-safety (cultivationRate ∈ 0..1) assertion. |
| `tests/e2e/status-observatory-states.spec.ts` | **G4** — fixed the stale region list (added `obs-region-jars`, the 10th region) so the matrix captures. |
| `tests/e2e/mi3-liveness.spec.ts` | **G1/G3/perf (new)** — cascade-structure + cross-highlight + perf-proxy spec. |

---

## 3 · The perf-safe design (stop condition #3)

The hazard: feeding live qi/s into the per-instrument `useObservatoryMotion` call sites would re-render the
heavy SVGs every tick. The fix exploits two facts the recon confirmed:
1. The heavy instruments (Vessel, Canopy, Constellation) are `memo(Base, deepEqualProps)` — they absorb the
   per-tick new-ref surface and **do not re-render** when their slice content is unchanged.
2. CSS custom properties **cascade** — set once on `.obsStageViewport`, they reach every instrument's
   keyframes with zero per-instrument prop change.

So the **global** tick-driven vars (`--qi-flow-rate` ∝ qi/s, `--tick-spin-dur` ∝ cultivation rate, breath)
are set once on the stage by the shell (which already re-renders each tick), and `meta.motionHints` lives
**only on the surface sibling** — never in a memoized instrument slice. The heavy SVGs never re-render on a
qi tick; the live motion rides the cascade (compositor-level CSS recalc). Per-instrument vars (needle/purity,
from the stable surface) stay local. **Doctrine note:** `useRitualMotion` gates `animate` to the explicit
**high** FxQuality tier, so the default board is static — the live feed is reviewer-opt-in and inert by default.

---

## 4 · Verification (battery + matrix)

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ clean |
| `npm run check:icons` | ✅ no emoji (in build) |
| `npm run validate:content` | ✅ passed |
| `npm run test:contracts` | ✅ **543/543 files, 1875 cases, 0 fail** (S0 added assertions to an existing test; nothing weakened) |
| `npm run build` | ✅ vite `✓ built` |

- **Six-state matrix** — `tests/e2e/status-observatory-states.spec.ts` (`?obsFixture=` × motion-on/reduced),
  2048×1152: blocked / healthy / postFailure / prestigePressure / contentCap render the **ten** instrument
  regions with correct tone/dominant/canopy-mode; scorch (postFailure), ritual-gold (prestige), and the decree
  seal (敗 / 轉生) render; reduced-motion preserves all meaning. Screenshots → `artifacts/s9-observatory-foundation/`.
  *(unknown has no fixture seed — falls through to the live surface by design.)*
- **Liveness wiring** — `tests/e2e/mi3-liveness.spec.ts`: the stage carries the three global motion vars and the
  heavy instruments do **not** (cascade proof, G1); the heavy instruments' DOM is stable across qi ticks (perf
  proxy, stop #3); the rootLaw bridge + astrolabe brighten on selection (G3, via the fixture route — the live
  status-tab route keeps hidden duplicate mounts). Screenshot → `docs/release/qa/mi3-liveness/observatory-live.png`.

### Adversarial review (3 lenses)

- **perf-correctness → ship.** `meta.motionHints` is structurally isolated from every memoized instrument's prop
  slice (`deepEqualProps` never walks `meta`); the global vars cascade from `.obsStageViewport` and the instruments
  no longer set them locally; the non-memoized astrolabe is gated by its parent (`memo(StatusRootLawCoupledInstrument)`)
  whose slice is qi-invariant. **No heavy SVG re-renders on a qi tick.**
- **contract-safety → ship.** S0 purely additive (raw-hex count identical 101==101; no `deepEqual`/`Object.keys` on
  meta); the builder stays pure (no `.getState`/`stores/` in its source — the read is in the seam); no pinned anchor
  changed; G2/G3 SCSS token-only.
- **regression → block → FIXED.** The review caught a real bug the battery missed (`test:contracts` doesn't run e2e):
  the **G3 brighten was functionally dead** — `isRelated('rootLawInstrument', …)` is populated *only* from causal-thread
  endpoints, and **no thread targets rootLaw**, so it was always false. **Fix:** key the brighten on
  `isSelected('rootLawInstrument', 'root-law-bridge')` (the selection itself, thread-independent) OR'd with `isRelated`
  (so a future rootLaw thread also lights it). Added `aria-pressed` to the now-toggleable bridge (a11y nit). The
  vessel/canopy idiom worked only because their ids *are* thread endpoints — the idiom doesn't transfer to rootLaw.

**Honest notes:**
- The **live motion responding to qi/s** is high-tier-only (reviewer-opt-in); a temporal/profiler capture of
  it is reviewer-side. The wiring + the perf invariant are proven structurally + by the cascade-structure spec;
  the motion model's qi→var mapping is already unit-covered.
- **G3 cross-instrument coupling is dormant:** no `causalThread` with `fromFamily:'rootLawInstrument'` is emitted
  today, so the rootLaw brightens via the **selection** path (its own bridge), not a thread from another
  instrument's selection. Emitting a `rootLawInstrument→bottleneckCanopy` thread (to make the 4th family
  symmetric) is a recorded follow-up, not built here.
- The stale header comment in `useObservatoryMotion.ts` ("EXPOSED but not yet applied") is now out of date but
  was **left untouched** per the packet's "do not touch the file solely for this" instruction (G1 wired the
  consumers + shell, not that file).
