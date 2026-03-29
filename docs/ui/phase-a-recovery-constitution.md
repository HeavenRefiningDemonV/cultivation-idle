# Phase A.1 — Recovery Constitution Overlay and Rollout Guardrails Doctrine

## 1) Purpose of Packet A.1
Packet A.1 exists to prevent destructive UI migration while realigning implementation behavior with the additive intent already established by the existing UI constitution. This packet locks recovery doctrine so future packets cannot treat UI overhaul as replacement-first.

## 2) Relationship to Existing Authorities
- The UI redesign master document still owns layout hierarchy, screen jobs, and interaction intent.
- The UI implementation constitution still owns the broad implementation direction.
- This Phase A recovery constitution is a corrective overlay for rollout behavior and sequencing.
- This overlay does not replace prior authorities; it corrects how they are executed during recovery and enhancement rollout.

## 3) Problem Statement
What failed was rollout sequencing, not overall direction:
- Shared structure moved first.
- Old visual ownership was removed or weakened too early.
- New art, FX, and finishing passes were not yet present.
- Screens entered half-old/half-new states with degraded readability and identity.
- The original direction (evolve foundation, reuse assets, keep readable DOM-first UI) remains valid; sequencing behavior caused the breakage.

## 4) Recovery Doctrine Summary
The recovery doctrine is now explicitly locked as follows:
- **Preservation-and-enhancement pass, not replacement pass.**
- **Preserve-first doctrine:** keep working scenic/base assets when they already carry fantasy, clarity, or identity.
- **Enhance-first doctrine:** upgrade existing assets with framing, hierarchy, overlays, and composition before considering replacement.
- **New-art-only-for-missing-roles doctrine:** create net-new art only when old UI has no component-role coverage.
- **Screen truth doctrine:** each screen must remain complete and readable at every step, not only after future packets.
- **Low-clutter doctrine:** dense screens remain structurally sober; enhancement must increase clarity rather than visual noise.

**Canonical decision (locked):**

> The UI overhaul is a preservation-and-enhancement pass, not a replacement pass. Existing painted/scenic art remains the base where it already supports fantasy, clarity, or identity. New work adds framing, composition, material hierarchy, custom icons, and restrained effects around that base. New art is generated primarily for missing support roles, not to discard working old art.

## 5) Asset Continuity Rule (Hard Gate)
**Non-negotiable rule:** no old art, scenic plate, frame, header, icon, or background may be removed or visually demoted on a given screen until the enhanced replacement on that exact screen is:
1. fully visible,
2. wired,
3. visually coherent, and
4. QA-approved.

This is a gate, not guidance. If any item is false, cutover is blocked.

## 6) Preserve / Enhance / Create-New Policy
This production policy is mandatory and exhaustive for recovery decisions.

### A) Preserve (as-is or with light cleanup)
Preserve these families as active base-plane assets:
- path portraits
- book spines
- city / citystate overlays
- forgewide backgrounds
- manual pavilion / techniques backdrops
- bountyboard scene element
- hourglass icons
- qi_lotus family

### B) Enhance (preserve but strengthen)
Preserve these assets/surfaces while upgrading presentation quality:
- `buttoncorners.png`
- `scroll.png`
- `bar_long.png`
- `bar_short.png`
- `block_fancy.png`
- Dantian / altar / orb presentation
- current paper/ink cards and ribbons
- current Gate Trial / Outskirts shell alignment
- current workshop / apothecary scene foundations

### C) Create New (only for missing roles)
Create net-new art primarily where no old role exists:
- frame atlas variants
- plaque/ribbon/breadcrumb/title-plate family
- FX sprite atlas
- cultivation enhancement kit
- Heart Law altar / seal kit
- world labels / building plaques
- overlay / mask pack
- brush swashes / recommendation underlays
- icon seals / medallions / custom system icons

**Interpretation lock:** create-new does not authorize wholesale replacement of preserved/enhanced base art.

## 7) Four-Layer Screen Model
Every screen must be implemented as an additive four-layer composition:

### Layer 1 — Existing scenic/base art
Examples:
- path portraits
- bookshelf spines
- city overlays
- forge background
- bounty board
- current cultivation backdrop

### Layer 2 — New chrome/material layer
Examples:
- frames
- plaques
- ribbons
- scroll shells
- inspector shells
- chips
- stamps

### Layer 3 — New readability/layout layer
Examples:
- hierarchy
- disclosure
- placement
- spacing
- inspector/drawer behavior
- command surfaces

### Layer 4 — New atmosphere/FX layer
Examples:
- mist
- halos
- glints
- embers
- selection swashes
- calm sacred motion

Implementation rules:
- Old art is the base plane.
- New UI work organizes and enhances that base plane.
- The four layers are additive, not mutually exclusive.

## 8) Corrected Rollout Interpretation (B-Packets)
The B-packet execution model is now corrected and locked:
- **B.1–B.3:** infrastructure only, zero destructive visual change.
- **B.4–B.10:** additive screen enhancement only.
- **B.11:** motion/no-layout-shift cleanup only.
- **B.12:** direct cleanup only after a screen is visually complete.

This corrected interpretation is the required execution rule for all future B-packet work.

## 9) Screen Cutover Gate
A screen may not cut away old visual layers until every condition below is true:
- no missing icons/buttons
- no duplicate old/new headers
- no broken composition
- no floating cutout state
- new chrome and old art visually belong together
- screenshot approved

If any line fails, cutover is prohibited.

## 10) Allowed vs Prohibited Change Types

### Allowed during recovery
- restoring old scenic/base layers
- wrapping old art with new chrome
- adding inspector/plaque/frame/chip systems
- adding non-destructive overlays and FX hooks
- fixing layout shift and missing-state markers

### Prohibited during recovery
- removing base scenic art before replacement is complete
- swapping a whole screen to generic shared cards because a shared component exists
- deleting old headers before the new header is fully live
- depending on future art generation to make current screens readable

## 11) Production Responsibility Boundary
### Codex-owned recovery work
- restore old scenic layers
- clean duplicate header systems
- wrap old surfaces with shared chrome where additive
- stabilize layout/no-shift behavior
- wire hooks/shells/guardrails that preserve readability and continuity

### Human / art-generation-owned net-new work
- missing frame atlases
- plaque/ribbon families
- FX sprite packs
- hero overlay kits
- world label plaques
- new custom icon families

This boundary exists to prevent blurred ownership and replacement-first drift.

## 12) Phase A Scope Boundary
- **A.1** is docs and guardrails only.
- **A.2** handles the asset continuity matrix.
- Later A packets handle actual screen recovery execution.

## 13) How Future Packets Must Use This Document
Each future UI recovery/enhancement packet must explicitly declare:
- whether it is **Preserve**, **Enhance**, or **Create New** work,
- which layers it touches (**Layer 1**, **Layer 2**, **Layer 3**, **Layer 4**),
- whether any cutover is proposed,
- why the screen cutover gate is satisfied.

## 14) Explicit Non-Goals
This document is:
- not a new art brief for replacing old art wholesale,
- not a runtime screen refactor,
- not a component migration packet,
- not an asset generation packet,
- not a redesign of layout authority.

## 15) Acceptance Criteria for Packet A.1
Packet A.1 is complete only when all are true:
- repo-local recovery constitution exists,
- repo-local rollout guardrails exists,
- additive preservation-and-enhancement doctrine is explicit,
- Asset continuity rule is present as a hard gate,
- Preserve / Enhance / Create-New policy is explicit,
- Four-layer screen model is explicit,
- corrected B-packet execution model is explicit,
- screen cutover gate is explicit,
- contract test passes,
- no runtime or asset files are modified by this packet.
