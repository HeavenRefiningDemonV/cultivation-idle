# Section A.7 — Recovery Order and Fallback Priorities

## Purpose

This file defines the severity order for restoring broken screens. It exists so the branch cannot normalize lower-priority visible work while higher-severity broken surfaces remain ambiguous. It complements `docs/ui/section-a-recovery-sequencing.md` by assigning recovery order to concrete surface tiers.

## Scope note

This file governs:

- severity order for broken-screen recovery;
- restored-fallback thresholds per tier;
- fallback routing when later packets break a surface;
- minimum restore expectations before re-entry into later waves.

This file does **not** govern:

- redesign content;
- screenshot approval workflow;
- implementation details;
- family doctrine redefinition;
- cleanup permission.

## Severity-order table (exact order)

| Order | Surface tier | Why this severity rank exists | Minimum restored fallback state | Earliest next legal implementation phase |
| --- | --- | --- | --- | --- |
| 1 | Path / Life Start | Re-establishes first-contact identity and onboarding truth | Path/life-start flow reads coherently, core controls present, scenic/ritual owner intact, no dominant duplicate conflict | I3 |
| 2 | Cultivation | Sacred center and long-run emotional anchor | Cultivation centerpiece/scenic owner intact, critical controls present, no duplicate conflict, no missing-truth regression | I4 |
| 3 | Status | Diagnostic truth surface for player decision confidence | Status truth surfaces readable, controls/labels complete, no layout-shift regressions, no fallback hand-waving | I4 |
| 4 | World | City command shell for cross-module navigation | World map/shell coherence restored, explanatory overlays readable, no dominant duplicate framing | I5 |
| 5 | Manual Pavilion | Identity-bearing build room and progression context | Pavilion reads as coherent additive room with core controls present and no dominant conflicts | I6 |
| 6 | Techniques | Core build-management depth surface | Techniques returns to operationally readable dense state with stable controls and no scenic-fake takeover | I7 |
| 7 | Apothecary | Live prep room with actionable crafting flow | Room owner/controls restored, no critical missing labels/icons, no dominant duplicate conflict | I6 |
| 8 | Forge | Live prep room with shaping/progression interaction | Forge room owner/controls restored, coherent additive readability, no dominant duplicate conflict | I6 |
| 9 | Bounties / Expeditions | Support infrastructure for activity routing | Boards readable, controls complete, no dominant duplicate conflict, no dependency on missing art | I6 |
| 10 | Prestige | Important but not first identity-repair tier | Prestige surfaces readable and coherent with no dominant conflict and no truth regressions | I7 |

## Minimum restored fallback state by tier

A tier is restored enough to leave R1 only when all threshold conditions below hold for that exact surface.

### Tier 1 — Path / Life Start

- Scenic/ritual owner present where relevant.
- Core progression choice controls visible.
- No dominant duplicate old/new conflict.
- No missing icon/button/label regression.
- Surface reads as coherent additive flow, not broken placeholder.

### Tier 2 — Cultivation

- Cultivation scenic/base owner retained.
- Hero center and key controls readable.
- No floating cutout or detached focal element.
- No dependency on future art to avoid breakage.
- Layout stability preserved across interaction states.

### Tier 3 — Status

- Truth/diagnostic semantics are explicit.
- Control/label parity is intact.
- No layout shift on key status toggles.
- No conflict between old/new framing systems.
- Gameplay truth is at least as clear as pre-breakage baseline.

### Tier 4 — World

- Map/shell ownership coherent.
- Explanatory overlays readable and non-conflicting.
- No dominant old/new duplicate framing conflict.
- No missing critical labels/icons.
- Surface no longer depends on future art for basic legibility.

### Tier 5 — Manual Pavilion

- Room identity owner visible.
- Core action and informational controls present.
- No dominant duplicate conflict.
- No missing critical labels/icons.
- Additive state is coherent and actionable.

### Tier 6 — Techniques

- Dense management readability restored.
- No fake scenic takeover.
- Core controls and labels complete.
- Layout stability across state variants.
- No dominant duplicate conflict.

### Tier 7 — Apothecary

- Prep-room identity and critical controls restored.
- No missing labels/icons/buttons.
- No dominant duplicate conflict.
- Additive state readable without future-art dependency.
- Interaction states remain stable.

### Tier 8 — Forge

- Forge-room identity and critical controls restored.
- No missing labels/icons/buttons.
- No dominant duplicate conflict.
- Additive state readable without future-art dependency.
- Interaction states remain stable.

### Tier 9 — Bounties / Expeditions

- Board-level clarity and controls restored.
- No missing labels/icons/buttons.
- No dominant duplicate conflict.
- Additive state coherent and actionable.
- No dependency on unmade art.

### Tier 10 — Prestige

- Prestige semantic truth remains explicit.
- Core controls and labels complete.
- No dominant duplicate conflict.
- Additive state coherent for dense/ritual mixed use.
- No fallback ambiguity.

## Fallback routing rule

If a later-phase packet breaks a surface:

1. The affected surface falls back to its own severity tier in `R1-unresolved` state.
2. Unrelated surfaces do not automatically fall back.
3. No packet may ignore a broken higher-severity surface when that same surface is the target of new proposed work.
4. If multiple surfaces break, all affected surfaces must be listed explicitly in severity order.

## Cross-tier handling rules

- Lower-severity visible work may continue only when it does not depend on currently broken higher-severity target surfaces.
- Branch-wide docs/infra work may continue if zero-destructive.
- Visible implementation work on a broken target surface must not defer breakage to vague future polish.
- A surface is not later-wave ready if its fallback state still depends on future nonexistent art to stop looking broken.

## Recovery examples

### Example A — Cultivation break during hero wave

Scenario:
- I4 Cultivation pass introduces duplicate ribbon conflict and layout shift.

Required outcome:
- Cultivation falls back to `R1-unresolved` at severity tier 2.
- No cleanup is permitted for Cultivation.
- Next Cultivation packet must be additive repair, not advancement.

### Example B — Shared-shell success with unresolved Path debt

Scenario:
- I2 shared-shell additive pass lands cleanly.
- Path / Life Start remains broken from earlier migration.

Required outcome:
- I2 existence is valid.
- Path remains `R1-unresolved` at severity tier 1.
- Branch cannot represent Path as later-wave ready until Path fallback is restored.

## Future packet usage rule

Later prompts must:

1. name affected surface recovery tier when broken;
2. declare whether packet restores fallback or advances a phase;
3. avoid “mostly fine” language that does not map to either `R1-restored` or later-wave ready state.

## Distinguishing severity order from phase order

- Phase order (`R0/R1/I1–I9`) governs class-of-work progression.
- Severity order governs which broken surfaces must be stabilized first.
- Standing R0 rule remains active through all phases.
- Active R1 status is per-surface and can coexist with later branch phase operation.

## Non-goals

- no implementation guidance;
- no screen redesign;
- no screenshot signoff;
- no packet-template schema;
- no cleanup authorization.
