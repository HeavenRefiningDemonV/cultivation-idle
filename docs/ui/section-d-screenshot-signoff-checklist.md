# Section D — Phase 1 Wave 0 Screenshot Signoff Checklist

## Purpose

Fast reviewer checklist for deciding whether a screen's Wave 0 screenshot proof is complete enough to justify later support-art discussion.

Wave 0 signoff outcome is proof readiness only; it does not grant cleanup authority.

## Decision outcomes (choose one)

- `EVIDENCE READY FOR SUPPORT-ART REVIEW`
- `HOLD — PROOF INCOMPLETE`
- `HOLD — NOT A REAL MISSING ROLE`

## Required checklist categories

1. **Exact screen id and family confirmed**
   - Screen id matches `docs/ui/phase-1-wave0-screenshot-matrix.md`.
   - Family label matches `docs/ui/section-a-screen-family-matrix.md`.

2. **Owner files matched against touchpoint registry**
   - Owner files and/or references match `docs/ui/section-a-touchpoint-registry.md`.
   - No guessed file paths or guessed stylesheet pairs.

3. **Preserved scenic/thematic owner remains visible in frame**
   - Owner remains present in `01-base.png`.
   - Owner remains legible through interaction/FX captures.

4. **Slot set complete or explicit N/A documented**
   - `01-base.png` present.
   - `02-interaction.png` present when required by matrix row.
   - `03-truth-states.png` present when required, or explicit N/A reason recorded.
   - `04-high-fx.png`, `05-low-fx.png`, `06-reduced-motion.png` present.
   - Optional `07-narrow.png` aligns with matrix recommendation if supplied.

5. **High FX / Low FX / Reduced Motion coherence shown**
   - All three mode captures present.
   - Readability and hierarchy remain coherent across all three modes.

6. **Interaction/truth states shown where required**
   - Interaction state is captured for actionable controls.
   - Truth states are captured for readiness/warning/recommended/lock-state semantics when required.

7. **Missing-role phrasing is support-role language, not style complaint language**
   - Candidate statement describes a missing reusable role.
   - Statement avoids taste terms and repaint language.

8. **Proposed family classification is correct**
   - Tagged as `shared support`, `screen-cluster support`, or `later-only hero support` per matrix mapping.
   - Evidence spans required number of screens/slots for shared families.

9. **No destructive cleanup requested through this proof packet**
   - Submission does not ask to remove scenic owners, shells, or existing assets.
   - Submission states that Wave 0 proof is not cleanup approval.

10. **Local completion / global completion note present**
    - Local note: this screen's slot set completeness.
    - Global note: whether packet-level support-family evidence is complete.

## Reviewer anti-pattern filter

Reject evidence when rationale uses style-complaint language such as:

- "screen looks old"
- "needs prettier art"
- "generic vibes"
- "replace background"

Accept rationale only when it states a missing support role, for example:

- "no shared title-plate family currently supports hierarchy X"
- "no reusable overlay/mask part bridges scenic owner to inspector plane"
- "no localized FX vocabulary currently supports effect Y without screen-local one-off work"

## Reviewer note template

- Screen id:
- Family:
- Matrix row checked:
- Screenshot folder checked:
- Required slots pass/fail:
- Missing-role statement quality: pass/fail
- Proposed support family classification: pass/fail
- Cleanup language violation: yes/no
- Final decision:
- Blockers / follow-up:
