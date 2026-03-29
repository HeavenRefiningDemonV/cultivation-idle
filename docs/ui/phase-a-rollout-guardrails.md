# Phase A Recovery Rollout Guardrails

## 1) What this file is for
This file is the operational checklist companion to `phase-a-recovery-constitution.md`. It is used during packet/PR review to enforce additive recovery behavior and block destructive migration.

## 2) Destructive Migration Freeze
During recovery, the following are forbidden:
- no removing old scenic/background assets from live screens
- no deleting old header/ribbon visuals before shared replacements are complete
- no stripping old icons/buttons without a working replacement
- no replacing a whole screen look just because a new shared component exists

## 3) PR / Packet Review Checklist
- [ ] Is old base art still present where it carries fantasy/structure/readability?
- [ ] Is the change additive?
- [ ] Does the screen still read clearly without future art dependencies?
- [ ] Are there duplicate old/new header systems?
- [ ] Are there missing state markers, icons, or buttons?
- [ ] Does any state cause layout shift?
- [ ] Is a cutover being attempted? If yes, is the cutover gate satisfied?

## 4) Screen Cutover Approval Checklist
A cutover is blocked until all are true:
- [ ] no missing icons/buttons
- [ ] no duplicate old/new headers
- [ ] no broken composition
- [ ] no floating cutout state
- [ ] new chrome and old art visually belong together
- [ ] screenshot approved

## 5) Allowed Recovery Moves
- restore old scenic/base layers
- keep current room/map/portrait backdrops
- restore old framing temporarily when needed for readability
- use thin local compatibility hooks where they preserve readability
- wrap old art with new plaques/frames later, once coherent

## 6) Prohibited Recovery Moves
- remove old base art because “new system exists”
- leave a screen visually incomplete while waiting for future art
- let placeholder/shared cards flatten a scenic screen
- accept a broken screen because architecture is “more correct”

## 7) Phase Handoff
- A.1 = doctrine
- A.2 = asset continuity matrix
- later A packets = actual screen recovery
- no packet after A.1 may claim ignorance of these guardrails

## 8) Fast Approval Rule
A visually stable, coherent, additive screen is preferred over a technically purer but half-finished migration.
