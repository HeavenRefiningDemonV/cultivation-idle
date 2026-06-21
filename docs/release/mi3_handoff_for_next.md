# M.I.3 — STATUS-RECONCILE-PORT · Session Handoff (for the next chat)

**Date:** 2026-06-21 · **Branch:** `Latest` · **Status:** M.I.3 **code-complete, verified, committed** (`7d64909d`).

Read this before the next Observatory/Status packet. It assumes the M.I.1 handoff (`mi1_handoff_for_mi3.md` /
`MI1_MI1B_HANDOFF_FOR_MI3.md`) as background.

---

## 0 · TL;DR

- **M.I.3 STATUS-RECONCILE-PORT** (the Observatory's liveness layer — telemetry motion, the 4th cross-highlight
  family, and a read-only motion-hint surface field) is **done** and committed (`7d64909d`, branch `Latest`).
- Battery green: typecheck / check:icons / validate:content / build, `test:contracts` **543/543 files, 1875 cases**;
  e2e **matrix 10/10** + **mi3-liveness 3/3**. Adversarial-reviewed (perf ship, contract ship, regression block→fixed).
- Movement I now has **M.I.1** (mech, derived re-point) + **M.I.1b** (percent-of-peak) + **M.I.3** (port) landed.

---

## 1 · What M.I.3 changed

- **S0 (additive field):** `meta.motionHints: { qiPerSecond, cultivationRate }` on the frozen
  `StatusObservatorySurfaceV1`, populated by a **pure store-reading seam** `src/systems/ui/status/observatoryMotionInput.ts`
  (`toObservatoryMotionHints()` reads the raw `qiPerSecond` Decimal string; `cultivationRate = clamp(log10(1+qi/s)/QI_RATE_LOG_SPAN, 0, 1)`,
  `QI_RATE_LOG_SPAN = 6` `[tune]→D15`). Same pure-adapter discipline as the M.I.1 seam — the builder never calls `.getState`.
- **G1 (perf-safe motion cascade — the load-bearing design):** the shell `StatusLivingStateObservatory.tsx` (NOT
  memoized; re-renders every tick) sets the **GLOBAL** tick-driven vars `--qi-flow-rate` / `--tick-spin-dur` /
  `--breath-period` once on `.obsStageViewport` (next to `--obs-scale`) from `meta.motionHints`, and they **cascade via
  CSS** to every instrument's keyframes. The instruments **stopped setting those globals locally** (astrolabe keeps only
  `--needle-target-deg`/`--purity-fill`; vessel + canopy dropped `useObservatoryMotion`/`style={motion}`, keep
  `data-animate`). Because `meta.motionHints` lives **only on the surface sibling — never in a memoized instrument
  slice** — the deep-equal-memoized heavy SVGs do **not** re-render on a qi tick (stop condition #3). Live motion is
  gated to the explicit **high** FxQuality tier (default board static).
- **G2:** bind `--qi-flow-rate` to the qi-drift `animation-duration` (divide ⇒ faster qi/s = faster drift) on vessel
  `__channelFlow`/`__threadGlow` and canopy **`__cord`** (the packet's `__thread` is static — corrected). Reduced-motion
  already freezes both.
- **G3:** the Root/Law instrument is the **4th cross-highlight family** — `StatusRootLawCoupledInstrument` consumes
  `useObservatorySelection`; the bridge + astrolabe brighten on a `kind:'rootLaw'` selection; the bridge is a
  selectable `aria-pressed` toggle; SCSS brighten rule beside the other three.
- **G4:** six-state matrix + reduced-motion verified; fixed the e2e's stale region list (added `obs-region-jars`, the
  10th region).

---

## 2 · Gotchas carried forward (verified / earned this session)

- **rootLaw brighten MUST key on `isSelected`, not `isRelated`.** `isRelated(family,id)` is **thread-derived only**
  (`deriveObservatoryRelatedKeys` reads causal-thread endpoints), and the surface emits **no** `rootLawInstrument`
  thread — so `isRelated('rootLawInstrument', …)` is always false. The vessel/canopy idiom works only because their ids
  ARE thread endpoints. The adversarial review caught this as a *functionally dead* brighten; the fix is
  `isSelected('rootLawInstrument','root-law-bridge') || isRelated(...)`. **Any future "rootLaw lights from another
  instrument's selection" needs a real `rootLawInstrument→bottleneckCanopy` causalThread emitted in the surface builder
  (mirror `statThread`/`causeThreadFromRow`).**
- **`test:contracts` does NOT run the Playwright e2e** (`test:e2e` is separate). The G3 dead brighten was green on the
  full packet battery and only the **e2e + adversarial review** caught it. Run both for any render-layer packet.
- **E2E harness quirks on the LIVE status-tab route:** it keeps **hidden duplicate** observatory mounts, and the
  rootLaw bridge can compute to `visibility:hidden` in Playwright at 2048×1152 dSF2 (it renders fine in the browser —
  see the matrix screenshots). Scope to one `[data-observatory-root="status-living-state-observatory"]` mount and
  **dispatch the click** (`el.evaluate(e => e.click())`) rather than relying on `:visible` / `toBeVisible` / actionability.
- The **motion vars cascade** (CSS custom properties inherit) — set them on an ancestor (`.obsStageViewport`) once;
  never per-instrument if the instrument is memoized and the value is tick-driven (that would re-render the heavy SVG).
- Live motion is **high-FxQuality-tier only** (`useRitualMotion` → `animate = effectiveQuality === 'high'`); the
  default/medium board is static by doctrine. `requestedQuality` is in-memory React state (FxQualityProvider) with no
  localStorage/URL override — forcing high tier in a headless spec is not clean, so the live-motion temporal/profiler
  capture is reviewer-side; the wiring + perf are proven structurally + by the cascade/perf specs.

---

## 3 · Recorded follow-ups (NOT built here)

- **rootLaw cross-instrument thread** — emit a `rootLawInstrument→bottleneckCanopy` `causalThread` so the 4th family is
  symmetric with the other three (lights when the canopy bottleneck is selected via the bottleneck-anchor convention).
- **Live-motion temporal/profiler evidence** — capture the moving board at the high FxQuality tier (reviewer-side).
- **Closer C2** — `forceLegacy` / legacy card-grid retirement (Movement I retires nothing; deferred).
- The stale `useObservatoryMotion.ts` header comment ("EXPOSED but not yet applied") is now out of date — left
  untouched per the packet's "don't touch the file solely for a comment" rule; fold the fix into the next packet that
  touches that file.

---

## 4 · Commits (branch `Latest`, this Movement)

| hash | packet |
|---|---|
| `28709f70` | M.I.1 — constellation re-point at the live derived engine |
| `27e01f7e` | M.I.1b — martial nodes as percent-of-peak shape |
| `f9b6bce7` | docs — M.I.1/M.I.1b handoff log |
| `7d64909d` | **M.I.3 — Observatory liveness (motion / rootLaw / motion-hint field)** |

Evidence: `docs/release/status_reconcile_port_evidence.md`. Battery + e2e green; `forceLegacy` retained; no
frozen-contract field reshaped; no `data-testid` changed; token-only SCSS. The QA screenshot
(`docs/release/qa/mi3-liveness/observatory-live.png`) is in the repo but excluded from this bundle per the bundle's
QA-PNG exclusion rule.
