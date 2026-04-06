# P1-03A — State Ornament Family Brief

## 1) Packet purpose

P1-03A defines the standalone Phase 1 shared state-ornament family.

This family provides compact reusable support assets for tracked, claim-ready, recommended-now, caution/risk, completion, selected/current, and header chip-companion states.

These assets are support-role ornaments only and never replace chips, labels, or other DOM truth carriers.

## 2) Why now

The redesign and Phase 1 packet map require a dedicated state-underlay/stamp/recommendation-swash family separate from overlays/masks and separate from later hero kits.

Without a shared packet, screens would improvise unrelated state styling and drift away from one semantic vocabulary before Phase 2 consumption.

This packet is docs/scaffold only, so semantics can be locked before any runtime integration.

## 3) Family boundary

### In scope

- tracked stamps
- claim-ready stamps
- recommended-now swashes
- caution underplates
- completion seals
- selected/current underlays
- reserved chip-companion plates for stateful headers

### Out of scope

- overlay/mask compositing roles (P1-03 sibling family)
- full plaque/title/header ownership (P1-02A chrome family)
- hero enhancement kits (later wave)
- scenic replacements, screen-local paintings, runtime integration, cleanup authorization

## 4) Required state set and behavior doctrine

### A) tracked stamp

- Behavior target: **calm, attached, official**.
- Role: indicates persistent player intent without urgency noise.
- Visual posture: low-contrast stamp edge, compact footprint, fixed reserved slot.

### B) claim-ready stamp

- Behavior target: **available, tactile, affirmative but not celebratory**.
- Role: signals immediate claimability while staying operational.
- Visual posture: compact affirmative stamp; no burst/confetti language.

### C) recommended-now swash

- Behavior target: **urgent but still compact and elegant**.
- Role: nudge action priority without hijacking surface hierarchy.
- Visual posture: controlled directional swash under/behind chips or labels, never giant banner.

### D) caution underplate

- Behavior target: **serious without alarm-strip behavior**.
- Role: marks risk, shortfall, or warning context as a stable substrate.
- Visual posture: grounded underplate with restrained value contrast.

### E) completion seal

- Behavior target: **resolved, stamped, final**.
- Role: indicates completion/finalized status in a compact official style.
- Visual posture: seal-like mark with quiet authority, not trophy spectacle.

### F) selected/current underlay

- Behavior target: **grounded ownership, not loud active-tab behavior**.
- Role: stabilize “current/selected” context around existing chips/cards.
- Visual posture: subtle underlay support, fixed geometry, subdued value delta.

### G) header chip companion plate

- Behavior target: **tiny structural support, not a mini plaque**.
- Role: small companion substrate near stateful header chips where spacing is reserved.
- Visual posture: minimal support plate that keeps chip semantics primary.

## 5) Semantic precedence support

State semantics must preserve this precedence model when multiple statuses can coexist:

1. completion/final state
2. claim-ready
3. caution/risk
4. recommended-now
5. tracked
6. selected/current context

Rules:

- chips/text remain the primary semantic truth;
- ornament layers are secondary confirmers;
- mutually exclusive stamps share one reserved slot;
- stacked ornaments must not produce semantic conflict.

## 6) No-layout-shift compatibility requirements

P1-03A must comply with Section A.9 layout stability doctrine:

- no border/padding/box-size mutation between state transitions;
- reserved max-width state slots required for mutually exclusive markers;
- state toggles cannot push sibling controls, row baselines, or card heights;
- decorative emphasis must remain tint/alpha/outline/shadow based;
- any implementation without reserved state space is rejected.

## 7) Allowed screen families

| Screen family | Allowed usage |
| --- | --- |
| Hero ritual screens | Moderate, compact ornaments near decision chips and readiness markers. |
| Scenic world screen | Moderate for route/module state cues; compact and diegetic-adjacent. |
| Module activity screens | High reuse target for tracked/claim-ready/recommended/caution/completion. |
| Dense management screens | Allowed but minimal; clarity and scan speed override ornament complexity. |
| Ritual modals | Moderate for completion/caution/selected context where semantics are explicit. |

## 8) Forbidden usages

- replacing chips as primary semantic carrier;
- giant recommendation banners for ordinary state nudges;
- scenic painting or room-ownership art;
- screen-local one-off ornaments that break shared vocabulary;
- moving readable truth into ornament layers;
- treating state ornaments as cleanup authorization.

## 9) Naming contract

Canonical examples:

- `ui_state_stamp_tracked_calm_default`
- `ui_state_stamp_claim_ready_affirm_default`
- `ui_state_swash_recommended_now_compact_default`
- `ui_state_underplate_caution_soft_default`
- `ui_state_seal_completion_resolved_default`
- `ui_state_underlay_selected_current_soft_default`
- `ui_state_chip_companion_header_tiny_default`

Forbidden patterns:

- `final_v2`, `new_badge`, `urgent_burst_big`
- frame/plaque ownership names
- scenic ownership names
- fx-style spectacle names (`*_confetti_*`, `*_neon_*`)

## 10) Tintability / grayscale friendliness expectations

- default bases should be grayscale/sepia-friendly to preserve tint control;
- tracked/selected/current/caution underplates should be tintable by design;
- claim-ready/completion may include restrained authored accent while remaining tint-compatible;
- contrast envelopes must keep semantics legible in low-saturation modes.

## 11) Packaging root guidance

This packet stays inside existing Phase 1 support roots and does not introduce a new top-level root.

Canonical root: `src/assets/ui/overlays/state_ornaments/`.

Reasoning:

- overlays root already owns support underlays/swash-style assets;
- this keeps P1-03 and P1-03A as sibling packets sharing one support-art root without merging responsibilities;
- chrome root keeps structural frame/plaque ownership and must not absorb semantic state ornament ownership.

## 12) Proof these are support-role assets, not scenic replacements

- all members are compact semantic supporters anchored to existing cards/chips/headers;
- no member defines a screen background, room identity, or map identity;
- all members require pre-existing DOM truth labels/chips to carry primary meaning;
- all members are additive-only and packet-scoped with no cleanup permission.

## 13) Screenshot trigger logic and conditional members

Base family status for P1-03A docs packet:

- tracked stamp: ready
- claim-ready stamp: ready
- recommended-now swash: conditional (requires screenshot proof on dense screens to confirm urgency remains compact)
- caution underplate: ready
- completion seal: ready
- selected/current underlay: ready
- header chip companion plate: conditional (requires screenshot proof that header density stays uncluttered)

Conditional trigger rule:

- if recommended-now swash or header chip companion causes badge clutter, layout shift risk, or readability regression in Wave 0 proof captures, member remains blocked until revised compact variant is approved.

## 14) Acceptance criteria

- [ ] Standalone P1-03A packet exists with full state family definition.
- [ ] Family is explicitly separated from P1-03 overlays/masks and from chrome ownership.
- [ ] All seven members have explicit behavior doctrine and semantic intent.
- [ ] No-layout-shift and reserved-slot requirements are explicit.
- [ ] Packaging root is explicit and aligned with existing roots.
- [ ] Conditional trigger logic is documented for members that may need proof gating.
- [ ] No live integration, no art generation, and no destructive cleanup are implied.
