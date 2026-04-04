# Section A Packet Queue

## Purpose

This file is the short hand-off queue for Section A packets A.1–A.11. It exists so later chats can request a packet prompt directly without rereading the full doctrine stack. It summarizes verified repo docs, not memory. Readiness statuses are based on verified Section A artifacts in this repository.

## How to use

1. Pick a packet id (`A.1` … `A.11`).
2. Check `Status`.
3. Use that entry as the prompt seed.
4. If status is `BLOCKED`, resolve missing core source docs first.
5. If status is `PARTIAL`, inspect the noted support gap before finalizing the prompt.

## Readiness legend

- **READY**: core source docs exist; packet can be prompted without guessing.
- **PARTIAL**: core docs exist, but a support/repo condition still needs quick inspection.
- **BLOCKED**: one or more core source docs are missing or packet cannot be summarized honestly.

---

### Packet entry
- **Packet**: A.1
- **Status**: READY
- **Title**: Doctrine charter and source hierarchy
- **Goal**: Lock global source hierarchy and additive-first doctrine so all later packets inherit one non-negotiable law set.
- **Core source docs**: `docs/ui/section-a-global-doctrine.md`
- **File surface**: `docs/ui/section-a-global-doctrine.md`
- **Dependencies**: None
- **Non-goals**: implementation detail design; renderer/package choices; gameplay tuning; screen-by-screen redesign specs.
- **Acceptance**: A.1 is done when later packets can cite a single enforceable source-hierarchy and additive doctrine without reinterpretation.
- **Prompt-author cues**: docs-only packet; enforce preserve-first/enhance-first/new-art-last vocabulary; no destructive cleanup permission; keep scope global-doctrine only.

### Packet entry
- **Packet**: A.2
- **Status**: READY
- **Title**: Destructive freeze and prohibited actions
- **Goal**: Define forbidden destructive migration behavior so additive improvement cannot silently become cleanup or remake.
- **Core source docs**: `docs/ui/section-a-destructive-freeze.md`
- **File surface**: `docs/ui/section-a-destructive-freeze.md`
- **Dependencies**: A.1
- **Non-goals**: cutover execution; release signoff replacement; implementation cleanup tasks.
- **Acceptance**: A.2 is done when prohibited destructive actions and freeze boundaries are explicit enough for reviewers to reject unsafe packets immediately.
- **Prompt-author cues**: docs-only packet; no code edits; pair with A.6 for cleanup legality context; reuse red-flag language from release docs if needed.

### Packet entry
- **Packet**: A.3
- **Status**: READY
- **Title**: Asset constitution and asset-request rules
- **Goal**: Codify preserve/enhance/create-later asset discipline and legal conditions for requesting new art roles.
- **Core source docs**: `docs/ui/section-a-asset-constitution.md`; `docs/ui/section-a-asset-request-rules.md`
- **File surface**: `docs/ui/section-a-asset-constitution.md`; `docs/ui/section-a-asset-request-rules.md`
- **Dependencies**: A.1, A.2
- **Non-goals**: generating assets; replacing existing families by preference; style-only art escalation.
- **Acceptance**: A.3 is done when packets can classify art request status (`none/deferred/justified`) with missing-role proof and no novelty-driven replacement.
- **Prompt-author cues**: docs-only packet; require explicit missing-role basis; keep current asset base as default substrate; no implementation asset pipeline work.

### Packet entry
- **Packet**: A.4
- **Status**: READY
- **Title**: Touchpoint registry
- **Goal**: Provide verified, exact repository touchpoints so later packets stop guessing target files.
- **Core source docs**: `docs/ui/section-a-touchpoint-registry.md`
- **File surface**: `docs/ui/section-a-touchpoint-registry.md` (optional support mirror: `docs/ui/section-a-touchpoint-registry.json`)
- **Dependencies**: A.1
- **Non-goals**: implementation changes; inferred path guessing; rewriting feature architecture.
- **Acceptance**: A.4 is done when prompt authors can map objective scope to exact file surfaces without stale shorthand or guessed paths.
- **Prompt-author cues**: verify repo snapshot before edits; keep registry synchronized with actual paths; no source code modifications in this packet.

### Packet entry
- **Packet**: A.5
- **Status**: READY
- **Title**: Four-layer model and screen-family matrix
- **Goal**: Establish operational layer ownership and family-level emphasis so packet scope can declare touched layers and dominant screen family precisely.
- **Core source docs**: `docs/ui/section-a-four-layer-model.md`; `docs/ui/section-a-screen-family-matrix.md`
- **File surface**: `docs/ui/section-a-four-layer-model.md`; `docs/ui/section-a-screen-family-matrix.md`
- **Dependencies**: A.1, A.4
- **Non-goals**: screen implementation; shell architecture coding; art generation schedules.
- **Acceptance**: A.5 is done when later packets can declare family, touched layers, retained ownership, and deferred layers without ambiguity.
- **Prompt-author cues**: docs-only packet; enforce layer declarations in packet goals; do not let Layer 2 chrome replace Layer 1 scenic ownership.

### Packet entry
- **Packet**: A.6
- **Status**: READY
- **Title**: Cutover gate and screenshot approval workflow
- **Goal**: Define legal cleanup eligibility and exact screenshot review workflow so destructive cleanup is blocked until explicit signoff passes.
- **Core source docs**: `docs/ui/section-a-cutover-gate.md`; `docs/ui/section-a-screenshot-approval-workflow.md`
- **File surface**: `docs/ui/section-a-cutover-gate.md`; `docs/ui/section-a-screenshot-approval-workflow.md`
- **Dependencies**: A.1, A.4, A.5
- **Non-goals**: actual cleanup execution; release go/no-go replacement; UI implementation work.
- **Acceptance**: A.6 is done when packets can distinguish additive completion from cleanup-eligible status using exact-screen evidence and signoff records.
- **Prompt-author cues**: docs-only packet; cite `docs/release/ui_screen_signoff_sheet.md` as supporting artifact; never grant cleanup from machine-pass alone.

### Packet entry
- **Packet**: A.7
- **Status**: READY
- **Title**: Recovery-first sequencing and fallback order
- **Goal**: Lock phase sequencing, stop conditions, and fallback priorities so packets fail safely instead of compounding UI regressions.
- **Core source docs**: `docs/ui/section-a-recovery-sequencing.md`; `docs/ui/section-a-recovery-order.md`
- **File surface**: `docs/ui/section-a-recovery-sequencing.md`; `docs/ui/section-a-recovery-order.md`
- **Dependencies**: A.1, A.2, A.6
- **Non-goals**: incident tooling implementation; runtime diagnostics rewrites; gameplay/system balancing.
- **Acceptance**: A.7 is done when packet authors can state stop conditions and fallback behavior explicitly before risky UI changes.
- **Prompt-author cues**: docs-only packet; emphasize halt-on-contradiction posture; require explicit fallback behavior in packet outputs.

### Packet entry
- **Packet**: A.8
- **Status**: READY
- **Title**: UI packet contract and template
- **Goal**: Standardize packet structure, enums, and required declarations so prompts are bounded, auditable, and additive-safe.
- **Core source docs**: `docs/codex/UI_PACKET_SCHEMA.md`; `docs/codex/UI_SECTION_A_PACKET_TEMPLATE.md`
- **File surface**: `docs/codex/UI_PACKET_SCHEMA.md`; `docs/codex/UI_SECTION_A_PACKET_TEMPLATE.md`
- **Dependencies**: A.1, A.3, A.4, A.5, A.6, A.7
- **Non-goals**: writing implementation prompts themselves; code changes; release-process rewrites.
- **Acceptance**: A.8 is done when later packets can be authored with strict fields (packet class, phase, family, layers, cutover statement, fallback behavior) and no hidden scope drift.
- **Prompt-author cues**: docs-only packet; align vocabulary exactly to schema enums; keep packet objective singular; require verification commands.

### Packet entry
- **Packet**: A.9
- **Status**: READY
- **Title**: Layout stability and truth surfacing doctrine
- **Goal**: Lock no-layout-shift and no-hover-only-critical-truth rules as explicit reviewer-facing doctrine.
- **Core source docs**: `docs/ui/section-a-layout-stability-rules.md`; `docs/ui/section-a-truth-surfacing-rules.md`
- **File surface**: `docs/ui/section-a-layout-stability-rules.md`; `docs/ui/section-a-truth-surfacing-rules.md`
- **Dependencies**: A.1, A.5, A.6, A.8
- **Non-goals**: CSS implementation; diagnostics code changes; screenshot artifacts.
- **Acceptance**: A.9 is done when future packets and reviews can apply explicit reject rules for geometry mutation, hover-only critical truth, and color-only critical semantics.
- **Prompt-author cues**: docs-only packet; preserve family-sensitive interpretation; keep tooltips support-only for critical truth; no implementation drift.

### Packet entry
- **Packet**: A.10
- **Status**: READY
- **Title**: Acceptance matrix and definition-of-done registry
- **Goal**: Convert acceptance doctrine into explicit global axes and local done clauses so completion claims are precise across packet, surface, cleanup, and overhaul levels.
- **Core source docs**: `docs/ui/section-a-acceptance-matrix.md`; `docs/ui/section-a-definition-of-done-registry.md`
- **File surface**: `docs/ui/section-a-acceptance-matrix.md`; `docs/ui/section-a-definition-of-done-registry.md`
- **Dependencies**: A.1, A.4, A.5, A.6, A.8, A.9
- **Non-goals**: release signoff replacement; implementation QA automation; gameplay/system changes.
- **Acceptance**: A.10 is done when packets must declare claimed axes, local done clauses, deferred-but-non-blocking scope, and completion level without ambiguity.
- **Prompt-author cues**: docs-only packet; enforce exact seven axes; separate additive done from cleanup-eligible; keep local clauses additive to global axes.

### Packet entry
- **Packet**: A.11
- **Status**: READY
- **Title**: Optional repo-backed enforcement hooks map
- **Goal**: Classify which Section A rules stay human-review-first and which objective rules should reuse existing repo hooks now or later.
- **Core source docs**: `docs/ui/section-a-enforcement-map.md`
- **File surface**: `docs/ui/section-a-enforcement-map.md`
- **Dependencies**: A.1, A.6, A.8, A.9, A.10
- **Non-goals**: implementing new diagnostics; test rewrites; release-doc rewrites; enforcement framework expansion.
- **Acceptance**: A.11 is done when later packets can justify `human-only` vs `reuse/extend existing hook` decisions using explicit criteria and reuse-first policy.
- **Prompt-author cues**: docs-only packet; verify canonical hooks under `docs/`, `src/`, `tests/`; ignore `tmp-tests`; machine-pass never grants cleanup authority.

## Dependency quick graph (prompt-seed shorthand)

- `A.1` is the root doctrine anchor for all later A-packets.
- `A.2` and `A.3` operationalize additive constraints (destructive freeze + asset law).
- `A.4` establishes exact file-surface truth used by implementation-facing packets.
- `A.5` and `A.6` define family/layer scope and legal cleanup gating.
- `A.7` defines fallback/stop behavior when packets encounter risk or contradiction.
- `A.8` standardizes packet-contract vocabulary used by A.9–A.11 prompt authoring.
- `A.9` provides hard surface doctrine (no layout shift + no hover-only critical truth).
- `A.10` defines completion semantics and acceptance claims for packets/surfaces/overhaul.
- `A.11` classifies human-review versus repo-backed enforcement posture for objective checks.
- When generating any later prompt, cite upstream packet ids explicitly instead of re-deriving assumptions.

## Phase 0 governance entrypoints

For Phase 0 UI branch-safety prompts, treat the existing Section A stack plus these files as the governance entrypoints:

- `docs/ui/phase-0-source-lock.md`
- `docs/ui/phase-0-packet-register.md`

These Phase 0 files are thin entrypoints; detailed doctrine remains in the relevant `docs/ui/section-a-*.md` sources.

## Current blockers and partials

All packets A.1–A.11 are currently `READY` based on verified core source doc presence.

## Queue discipline note

This queue is a hand-off aid, not a replacement for packet docs. Prompt authors should still inspect packet source docs when edge conditions arise. Keep this file concise and update statuses/file surfaces as Section A artifacts evolve.
