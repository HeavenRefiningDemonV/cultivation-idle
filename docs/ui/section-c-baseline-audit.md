# Section C Baseline Audit (Packet C.0)

## Purpose and scope
Lock current Section C ritual-selection truth before any C.1+ visual packet work. This artifact is baseline-only and does not authorize cleanup.

## Audit method used in this pass
- Verified owner/reachability behavior against the current working tree.
- Verified harness route coverage for all nine surface ids.
- Browser screenshot capture is not available in this Codex runtime, so capture status is marked honestly as manual-pending.

## Surface IDs in scope (exact)
1. `life-start-path`
2. `life-start-heart-law`
3. `life-start-breath-focus`
4. `dao-heart-law`
5. `dao-heart-study`
6. `change-heart-law`
7. `prestige-ritual`
8. `current-chapter-exhausted`
9. `life-summary`

---

## 1) `life-start-path`
- **Human label:** Life Start Path (Step 1)
- **Screen family:** hero ritual screen
- **Owner files:** `src/components/modals/LifeStartWizardModal.tsx`, `src/components/modals/LifeStartWizardModal.scss`
- **Current live reachability:** `live`
- **Already right:** Step 1 already owns the screen with a portrait-led triptych composition and dedicated path art.
- **Still weak / generic / unfinished:** polish debt remains in transition/framing polish only; baseline structure is correct.
- **Retain through cutover:** path portraits and full-height triptych ownership must remain.
- **Later art not justified yet:** replacing the triptych system or introducing new hero art.
- **Desktop / narrow notes:** desktop-first layout is intended; narrow needs manual resize validation for panel clipping.
- **High FX / Low FX / Reduced Motion notes:** record all three; no separate truth-state family (`03-truth-states` is N/A).
- **Layout-shift risk:** hover/select buttons must be checked for no card jump in interaction capture.
- **Blue/flat/generic remnants:** no major dashboard-blue signal in this specific path surface.
- **Screenshot folder:** `docs/release/qa/ui-cutover/life-start-path/`
- **Likely next packet:** C.1

## 2) `life-start-heart-law`
- **Human label:** Life Start Heart Law (Step 2)
- **Screen family:** ritual modal
- **Owner files:** `src/components/modals/LifeStartWizardModal.tsx`, `src/components/modals/LifeStartWizardModal.scss`, `src/ui/ink/InkModalFrame.tsx`, `src/ui/ink/InkModalFrame.scss`
- **Current live reachability:** `live`
- **Already right:** uses real unlocked/locked heart-law data and current `InkModalFrame` + paper primitives.
- **Still weak / generic / unfinished:** card grid treatment is still generic compared with final ritual art direction.
- **Retain through cutover:** Ink modal frame, paper card/chip language, and live lock/unlock truth text.
- **Later art not justified yet:** replacing frame family or rewriting scripture selection logic.
- **Desktop / narrow notes:** narrow width may compress card rows; capture with manual resize.
- **High FX / Low FX / Reduced Motion notes:** capture all three; interaction should include selected card state.
- **Layout-shift risk:** selected/locked card states should be checked for size stability.
- **Blue/flat/generic remnants:** still visually flat/generic in portions of the card grid.
- **Screenshot folder:** `docs/release/qa/ui-cutover/life-start-heart-law/`
- **Likely next packet:** C.1

## 3) `life-start-breath-focus`
- **Human label:** Life Start Breath Focus (Step 3)
- **Screen family:** ritual modal
- **Owner files:** `src/components/modals/LifeStartWizardModal.tsx`, `src/components/modals/LifeStartWizardModal.scss`, `src/ui/ink/InkModalFrame.tsx`, `src/ui/ink/InkModalFrame.scss`
- **Current live reachability:** `forced-only for audit`
- **Already right:** breath mode options and finish CTA are structurally present.
- **Still weak / generic /unfinished:** state is not naturally stable through current live visibility gate after path + heart-law selection.
- **Retain through cutover:** existing breath cards and current life-start shell semantics.
- **Later art not justified yet:** any flow fix/cutover logic rewrite in this packet.
- **Desktop / narrow notes:** narrow behavior must be captured manually once forced view is open.
- **High FX / Low FX / Reduced Motion notes:** capture all three from forced harness state.
- **Layout-shift risk:** selected mode card and finish button emphasis must not resize row height.
- **Blue/flat/generic remnants:** generic card treatment remains.
- **Screenshot folder:** `docs/release/qa/ui-cutover/life-start-breath-focus/`
- **Likely next packet:** C.4

## 4) `dao-heart-law`
- **Human label:** Dao Heart — Heart Law tab
- **Screen family:** ritual modal
- **Owner files:** `src/components/modals/DaoHeartModal.tsx`, `src/components/modals/DaoHeartModal.scss`, `src/ui/cultivation/heartLaw/HeartLawPanel.tsx`, `src/ui/cultivation/heartLaw/HeartLawMindView.tsx`, `src/ui/cultivation/heartLaw/HeartLawMindView.scss`, `src/ui/cultivation/heartLaw/RadialVerseRing.tsx`, `src/ui/cultivation/heartLaw/RadialVerseRing.scss`
- **Current live reachability:** `live but awkward`
- **Already right:** tab shell, dao-element tinting, atmospheric FX layers, radial ring, resonance/chapter/comprehension/ETA truth are all present.
- **Still weak / generic / unfinished:** mixed visual language between rich shell and generic panel regions remains obvious.
- **Retain through cutover:** current DaoHeart scroll shell, dao-element wash, atmosphere layer stack, radial ring and truth text rows.
- **Later art not justified yet:** replacing modal family or rewriting tab information architecture.
- **Desktop / narrow notes:** narrow capture should confirm tab/header/body do not collapse unpredictably.
- **High FX / Low FX / Reduced Motion notes:** capture same tab under all FX modes to compare coherence.
- **Layout-shift risk:** tab switch and ring selection states are key no-shift checks.
- **Blue/flat/generic remnants:** known blue/generic remnants likely persist in sub-panels and should be captured, not fixed here.
- **Screenshot folder:** `docs/release/qa/ui-cutover/dao-heart-law/`
- **Likely next packet:** C.2

## 5) `dao-heart-study`
- **Human label:** Dao Heart — Study tab
- **Screen family:** ritual modal
- **Owner files:** `src/components/modals/DaoHeartModal.tsx`, `src/components/modals/DaoHeartModal.scss`, `src/ui/cultivation/StudyModeWidget.tsx`
- **Current live reachability:** `live but awkward`
- **Already right:** study tab is integrated in the same DaoHeart shell and uses real widget data.
- **Still weak / generic / unfinished:** visual integration between Study widget and modal shell remains uneven.
- **Retain through cutover:** current tab shell and study-widget-in-modal ownership.
- **Later art not justified yet:** new shell family or standalone replacement modal.
- **Desktop / narrow notes:** verify narrow scroll containment manually.
- **High FX / Low FX / Reduced Motion notes:** capture all three with study tab active.
- **Layout-shift risk:** tab toggle and widget controls should be checked for row/card jumps.
- **Blue/flat/generic remnants:** generic sections remain in study controls.
- **Screenshot folder:** `docs/release/qa/ui-cutover/dao-heart-study/`
- **Likely next packet:** C.3

## 6) `change-heart-law`
- **Human label:** Change Heart Law overlay
- **Screen family:** ritual modal
- **Owner files:** `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx`, `src/ui/cultivation/heartLaw/HeartLawPanel.scss`
- **Current live reachability:** `gated by another state`
- **Already right:** functionally clear warning, cost, lock-state and confirm/cancel flow.
- **Still weak / generic / unfinished:** visually generic and still inherits `HeartLawPanel.scss` language.
- **Retain through cutover:** current warning/cost/selection truths and option locking semantics.
- **Later art not justified yet:** logic rewrite or non-additive frame replacement in C.0.
- **Desktop / narrow notes:** narrow checks should ensure option list remains readable.
- **High FX / Low FX / Reduced Motion notes:** mostly static content, but capture all three for consistency.
- **Layout-shift risk:** active/locked option states could shift if border/padding differ.
- **Blue/flat/generic remnants:** generic flat panel treatment remains.
- **Screenshot folder:** `docs/release/qa/ui-cutover/change-heart-law/`
- **Likely next packet:** C.5

## 7) `prestige-ritual`
- **Human label:** Prestige Reincarnation Ritual
- **Screen family:** ritual modal
- **Owner files:** `src/components/modals/PrestigeRitualModal.tsx`, `src/components/modals/PrestigeRitualModal.scss`, `src/ui/shell/RitualModalFrame.tsx`, `src/ui/shell/RitualModalFrame.scss`
- **Current live reachability:** `live`
- **Already right:** reset/carry/rebuilt truth and AP breakdown structure are strong and explicit; hold-to-confirm exists.
- **Still weak / generic / unfinished:** ceremony polish and modal-family refinement remain.
- **Retain through cutover:** `RitualModalFrame`, hold-to-confirm action model, AP breakdown rows, reset bucket sections.
- **Later art not justified yet:** replacing modal family or changing AP truth structure.
- **Desktop / narrow notes:** narrow capture should focus on section stacking and footer action readability.
- **High FX / Low FX / Reduced Motion notes:** all three required; include interaction hold state.
- **Layout-shift risk:** hold progress fill should not resize button container.
- **Blue/flat/generic remnants:** some flat/generic areas remain despite strong structure.
- **Screenshot folder:** `docs/release/qa/ui-cutover/prestige-ritual/`
- **Likely next packet:** C.6

## 8) `current-chapter-exhausted`
- **Human label:** Current Chapter Exhausted
- **Screen family:** ritual modal
- **Owner files:** `src/components/modals/CurrentChapterExhaustedModal.tsx`, `src/components/modals/CurrentChapterExhaustedModal.scss`, `src/ui/shell/RitualModalFrame.tsx`, `src/ui/shell/RitualModalFrame.scss`
- **Current live reachability:** `gated by another state`
- **Already right:** truthful, concise cap-state messaging and clear action options.
- **Still weak / generic / unfinished:** visual finish remains mostly modal-family baseline.
- **Retain through cutover:** current ritual frame + cap-truth copy + three-action decision row.
- **Later art not justified yet:** copy rewrite or frame-family replacement.
- **Desktop / narrow notes:** narrow pass should verify action row wraps without unstable shifts.
- **High FX / Low FX / Reduced Motion notes:** capture all three (mostly frame-level effects).
- **Layout-shift risk:** button hover/active row stability must be checked.
- **Blue/flat/generic remnants:** some generic modal styling remains.
- **Screenshot folder:** `docs/release/qa/ui-cutover/current-chapter-exhausted/`
- **Likely next packet:** C.7

## 9) `life-summary`
- **Human label:** Life Summary (`current` mode baseline)
- **Screen family:** ritual modal
- **Owner files:** `src/components/modals/LifeSummaryModal.tsx`, `src/components/modals/LifeSummaryModal.scss`, `src/features/prestige/lifeSummarySurface.ts`, `src/ui/shell/RitualModalFrame.tsx`, `src/ui/shell/RitualModalFrame.scss`
- **Current live reachability:** `gated by another state`
- **Already right:** current-mode advisor/AP/meta and block list are live and structurally useful.
- **Still weak / generic / unfinished:** visual hierarchy and polish remain unfinished; `last_completed` remains out of this baseline family.
- **Retain through cutover:** current-mode block order, meta truth row, and `RitualModalFrame` host.
- **Later art not justified yet:** splitting into additional audit families or rewriting summary data shape.
- **Desktop / narrow notes:** narrow should verify block list readability and footer stability.
- **High FX / Low FX / Reduced Motion notes:** capture all three in `current` mode only.
- **Layout-shift risk:** variable block lengths can change perceived density; capture current truth before any visual pass.
- **Blue/flat/generic remnants:** generic modal sections remain.
- **Screenshot folder:** `docs/release/qa/ui-cutover/life-summary/`
- **Likely next packet:** C.8

---

## Known blockers discovered in baseline
1. `life-start-breath-focus` is forced-only in this audit harness because the current live visibility gate does not naturally preserve Step 3 after path + heart-law selection. Track as baseline blocker for C.1/C.4.
2. Dao Heart family (`dao-heart-law`, `dao-heart-study`, `change-heart-law`) shows mixed mature shell vs generic panel treatment; capture first, polish later.
3. Screenshot evidence is pending manual capture because this execution environment does not provide browser image artifact tooling.
