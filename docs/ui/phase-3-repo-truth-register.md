# Phase 3 Repo-Truth Register (P3-00)

## Purpose
This register is the **current authority** for Phase 3 ritual-selection / ritual-modal repo truth. It exists to stop prompt drift by freezing canonical surfaces, owners, evidence folders, and reachability semantics before later P3 packets.

This file is preserve-first and additive-only. It does **not** grant cleanup authority.

## Repo basis / verification basis
- Verification date: 2026-04-08 (UTC).
- Repository branch: `work`.
- Repository commit at verification time: `b724a6e`.
- Verification method: direct filesystem inspection of owner files, Section C harness/manifest files, and canonical evidence folders.

## Rules for interpreting this register
1. Canonical surface IDs come from `src/dev/sectionCAudit/sectionCSurfaceIds.ts`; later packets must not rename IDs casually.
2. Evidence folder truth comes from `src/dev/sectionCAudit/sectionCEvidenceManifest.ts` and on-disk folder existence; PNG completion remains separate evidence debt.
3. Reachability labels below describe current repo truth, not desired future polish.
4. Historical labels like `C.x` packet names are legacy shorthand only; owner targeting must use the canonical IDs + file owners in this register.
5. This register does **not** authorize destructive cleanup, owner replacement, or signoff inference.

## Canonical Phase 3 surface register

| Surface ID | Human label | Screen family | Reachability truth now | Owner files (repo-truth) | Current strengths / already right | Current weaknesses / unfinished | Exact evidence folder | Likely next Phase 3 packet | Capture requirements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `life-start-path` | Life Start Path (Step 1) | life-start ritual sequence | live | `src/components/modals/LifeStartWizardModal.tsx`<br>`src/components/modals/LifeStartWizardModal.scss` | Portrait-led triptych is already live and owns Step 1. | Owner protection/hardening and later atmosphere polish still pending. | `docs/release/qa/ui-cutover/life-start-path` | C.1-family | truth-states: no; interaction: yes; narrow: no |
| `life-start-heart-law` | Life Start Heart Law (Step 2) | life-start ritual sequence | live | `src/components/modals/LifeStartWizardModal.tsx`<br>`src/components/modals/LifeStartWizardModal.scss` | Unlock truth is live inside same integrated wizard owner. | Grid treatment is still comparatively generic. | `docs/release/qa/ui-cutover/life-start-heart-law` | C.1-family | truth-states: yes; interaction: yes; narrow: no |
| `life-start-breath-focus` | Life Start Breath Focus (Step 3) | life-start ritual sequence | forced-only in audit / state-fragile | `src/components/modals/LifeStartWizardModal.tsx`<br>`src/components/modals/LifeStartWizardModal.scss` | Structurally present as Step 3 in the integrated wizard flow. | Still needs stabilization as a naturally reachable P3 surface. | `docs/release/qa/ui-cutover/life-start-breath-focus` | C.4-family | truth-states: no; interaction: yes; narrow: no |
| `dao-heart-law` | Dao Heart — Heart Law tab | dao-heart ritual modal | live but awkward | `src/components/modals/DaoHeartModal.tsx`<br>`src/components/modals/DaoHeartModal.scss`<br>`src/ui/cultivation/heartLaw/HeartLawPanel.tsx`<br>`src/ui/cultivation/heartLaw/HeartLawPanel.scss`<br>`src/ui/cultivation/heartLaw/HeartLawMindView.tsx`<br>`src/ui/cultivation/heartLaw/HeartLawMindView.scss` | Shell + mind-view + radial verse ring and doctrinal truth already exist. | Generic-looking inner regions still break presentation convergence. | `docs/release/qa/ui-cutover/dao-heart-law` | C.2-family | truth-states: yes; interaction: yes; narrow: no |
| `dao-heart-study` | Dao Heart — Study tab | dao-heart ritual modal | live | `src/components/modals/DaoHeartModal.tsx`<br>`src/components/modals/DaoHeartModal.scss`<br>`src/ui/cultivation/StudyModeWidget.tsx`<br>`src/ui/cultivation/StudyModeWidget.scss` | Existing tab and study truth are live within current modal family. | Needs stronger visual parity with heart-law tab. | `docs/release/qa/ui-cutover/dao-heart-study` | C.3-family | truth-states: no (N/A/optional); interaction: yes; narrow: no |
| `change-heart-law` | Change Heart Law modal | heart-law change ritual modal | state-gated | `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx`<br>`src/ui/cultivation/heartLaw/ChangeHeartLawModal.scss` | Mechanically clear consequence and confirmation flow already exists. | Ritual consequence treatment still reads generic. | `docs/release/qa/ui-cutover/change-heart-law` | C.5-family | truth-states: yes; interaction: yes; narrow: no |
| `prestige-ritual` | Prestige Reincarnation Ritual | prestige ritual modal | live | `src/components/modals/PrestigeRitualModal.tsx`<br>`src/components/modals/PrestigeRitualModal.scss` | Truth structure is already strong. | Family inheritance/polish remains; no truth rewrite needed. | `docs/release/qa/ui-cutover/prestige-ritual` | C.6-family | truth-states: yes; interaction: yes; narrow: no |
| `current-chapter-exhausted` | Current Chapter Exhausted | chapter-cap ritual modal | state-gated / harnessable | `src/components/modals/CurrentChapterExhaustedModal.tsx`<br>`src/components/modals/CurrentChapterExhaustedModal.scss` | Clear cap-state truth already present. | Needs broader family adoption polish later. | `docs/release/qa/ui-cutover/current-chapter-exhausted` | C.7-family | truth-states: no; interaction: yes; narrow: no |
| `life-summary` | Life Summary (`current`) | prestige summary ritual modal | state-gated / harnessable | `src/components/modals/LifeSummaryModal.tsx`<br>`src/components/modals/LifeSummaryModal.scss` | Current-mode summary truth is already functional and readable. | Needs family adoption and stricter evidence discipline. | `docs/release/qa/ui-cutover/life-summary` | C.8-family | truth-states: yes; interaction: yes; narrow: no |

## Resolved drift / stale-reference ledger
- **Resolved:** Life-start ownership is integrated in `LifeStartWizardModal` for Step 1 path, Step 2 initial heart-law, and Step 3 breath focus; P3 is convergence/hardening, not greenfield implementation.
- **Resolved:** There is **no** standalone `PathSelectionModal.tsx` in current repo truth; any mention is legacy/stale reference only.
- **Resolved:** `src/ui/fx/scenes/SelectionFxScene.tsx` exists and is intentionally a stub/null scene (present, not missing).
- **Resolved:** `DaoHeartModal` + `HeartLawPanel` + `HeartLawMindView` + radial verse ring are already real doctrinal surfaces; later packets should converge shell language, not invent core logic.
- **Resolved:** Section C audit harness and deterministic routes already exist and are valid (`src/dev/sectionCAudit/SectionCAuditHarness.tsx`).
- **Still true evidence debt:** Section C PNG evidence remains capture-pending/manual in many folders; this register does not claim completion.

## Phase 3 inherited contracts from Phase 2
Phase 3 remains bound by `docs/ui/phase-2-phase3-handoff.md`, including:
- preserve-first/additive rollout,
- exact-screen cutover gate before destructive cleanup,
- DOM-readable gameplay truth,
- shell primitives as connective tissue (not owner replacement),
- no implicit cleanup authority from documentation alone.

## May not assume
- May not assume `PathSelectionModal` is a live target.
- May not assume Phase 3 starts from blank path/heart-law implementations.
- May not assume `SelectionFxScene` is missing.
- May not assume Section C evidence is complete while capture remains pending.
- May not assume legacy `C.x` names are sufficient for owner targeting without canonical ID crosswalk.
- May not assume this register grants cleanup, redesign, or art signoff.

## Explicit authority boundary
This register is for repo-truth targeting and drift prevention. It **does not unlock cleanup authority**, destructive removal, or implied visual signoff.
