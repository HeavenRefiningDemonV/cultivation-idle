# Section A.3 — Asset Constitution: Preserve, Enhance, Create Later

## Purpose

This file turns Section A asset policy into operational doctrine so later packets and art requests cannot reinterpret current assets as replaceable by default. It inherits:

- `docs/ui/section-a-global-doctrine.md`
- `docs/ui/section-a-destructive-freeze.md`

It governs asset classification and request posture, not implementation.

## Scope note

This file governs:
- asset-family classification;
- first-wave boundaries;
- later-art triggers;
- request quality bar;
- reusable support-part standards.

This file does **not** govern implementation, asset generation execution, cleanup execution, gameplay logic, or full touchpoint inventory.

## Core thesis

**Current assets first** is mandatory. Existing scenic and semantic owners stay in place. New art is for missing support roles only, never as default repaint logic.

This is not a replacement art pass.

## Bucket system

Every asset interaction must be classified into exactly one bucket before work starts:
- Preserve as core
- Preserve but enhance
- Create later only if role is missing

Any packet that requests new art without this classification is non-compliant.

---

## A. Preserve as core

**Operational definition:** Family remains visual/semantic owner by default. First-wave work may tune integration and readability around it, but must not replace ownership.

| Asset family | Current policy | Why | First-wave rule | Later note |
| --- | --- | --- | --- | --- |
| Path portraits (`path_heaven 1.png`, `path_earth 1.png`, `path_martial 1.png`) | Preserve as core | Life Start identity anchor | Must not replace portraits in first wave | Support overlays only, never portrait swap |
| Book spines (`src/assets/ui/book_spines/*`) | Preserve as core | Manual/library identity owner | Must not replace spine ownership in first wave | Add support framing only |
| `city.png` + city-state overlays (`src/assets/background/citystates/*`) | Preserve as core | World scenic ownership | Must keep city base/overlays as scenic owner | Add label support only after missing-role proof |
| `forgewide_*` (`forgewide_empty/unshaped/shaping/shaped`) | Preserve as core | Forge room state-aware owner | Must not replace forgewide family in first wave | Add masks/FX/plaque support only after additive proof |
| `manualpavilion.png`, `tech.png`, `bountyboard.png` | Preserve as core | Room/backdrop ownership across module families | Must not replace scenic owners in first wave | Strengthen shell/chrome only |
| Hourglass icons (`hourglass_empty/progress`) | Preserve as core | Expedition semantic owner | Must not run first-wave icon replacement | Optional support underlays only when role is proven missing |
| `qi_lotus_*` (`closed/open/full`) | Preserve as core | Cultivation progression semantic owner | Must not replace lotus family in first wave | Hero overlays may wrap, not replace |
| Cultivator / dantian base (`cultivator_backshots.png` + current dantian center stack) | Preserve as core | Cultivation hero center anchor | Must not replace center owner in first wave | Additive enhancement overlays only after proof |

## B. Preserve but enhance

**Operational definition:** Family remains present and authoritative for function, but should be strengthened additively through wrappers, variants, spacing, masks, and composition discipline.

| Asset family | Current policy | Why | First-wave rule | Later note |
| --- | --- | --- | --- | --- |
| `buttoncorners.png` | Preserve but enhance | Existing interaction shell primitive | Keep base and add wrappers/variants first | Replace only after explicit insufficiency proof |
| `scroll.png` | Preserve but enhance | Reusable parchment support language | Enhance usage/composition before replacement requests | Extend with compatible support parts if needed |
| `bar_long.png` / `bar_short.png` | Preserve but enhance | Practical support strip family | Keep and strengthen in first wave | New variants only after cross-screen insufficiency proof |
| `block_fancy.png` | Preserve but enhance | Existing ornate support shell | Wrap/align before replacement discussion | Complement with later variants only after proven gap |
| Existing paper/ink shell (`src/ui/ink/*`, `src/styles/paperInkTokens.scss`) | Preserve but enhance | Live legible shell language | Preserve shell family while improving hierarchy | Overlays/masks only after reusable gap proof |
| Dantian/orb/lotus UI truth surfaces (`DantianOrb`, `VerseMiniBar`, `QiLotusIcon`) | Preserve but enhance | Live cultivation presentation stack | Keep current ownership and tune additively | Overlay requests need role-gap proof |
| Current Outskirts / Gate Trial shell alignment | Preserve but enhance | Existing module shell ownership | Keep alignment ownership and tune additively | Replacement requests require missing-role proof |
| Workshop/apothecary scene foundations (`alchemylab_idle.png`, forgewide family context) | Preserve but enhance | Existing room bases are valid owners | Preserve base and layer support additively | Later support parts may enrich labels/frames/FX |

## C. Create later only if role is still missing

**Operational definition:** Not first-wave production. Allowed only when additive screenshots prove unresolved support-role gaps.

| Asset family | Current policy | Why | First-wave rule | Trigger for later request |
| --- | --- | --- | --- | --- |
| Shared frame atlas variants | Create later only if still needed | Existing frame/support family must be exhausted first | Must not request in Wave 0 | Request when 2+ screens still lack reusable frame-role coverage |
| Plaque / ribbon / title-plate family | Create later only if still needed | Shared label/header carrier role may remain missing | Must not request in Wave 0 | Request when current bars/blocks cannot carry cross-screen label states |
| World / building label plaques | Create later only if still needed | Diegetic labels may need reusable support parts | Must not request in Wave 0 | Request when world/building captures show unresolved label grounding role |
| Overlay / mask pack | Create later only if still needed | Reusable compositing support may be missing | Must not request in Wave 0 | Request when multiple screens show unresolved compositing role |
| State underlays / recommendation swashes / tracked stamps | Create later only if still needed | Shared state substrate may be missing | Must not request in Wave 0 | Request when state readability remains unresolved after preserve-enhance pass |
| Shared FX sprite atlas | Create later only if still needed | Cross-mode support FX vocabulary may be missing | Must not request before additive atmosphere proof exists | Request after static support pass still leaves unresolved FX support role |
| Cultivation hero enhancement overlays | Create later only if still needed | Cultivation center must remain current owner first | Must not replace current cultivator/dantian center | Request only when approved additive cultivation still lacks hero-emphasis support role |
| Heart Law altar / seal support kit | Create later only if still needed | Heart Law sacred-focus support role may remain missing | Must not request before additive composition with current owners | Request only when Heart Law evidence still lacks sacred-focus support role |
| Optional medallions / icon seals | Create later only if still needed | Non-critical ornament role is optional | Must not request in first-wave stabilization | Request only after all core support roles are closed |

## First-wave prohibitions (hard bans)

In this wave, packets **must not request** and teams **must not perform**:

- replacement of path portraits;
- replacement of bookshelf/spine identity;
- replacement of forgewide room family;
- replacement of world/city scenic ownership;
- replacement of cultivator/dantian hero center;
- full icon-overhaul as a prerequisite for support-art packets.

## Bucket enforcement rules

- Preserve-core families remain owners unless doctrine is explicitly reopened.
- Preserve-enhance families must be strengthened before any replacement discussion.
- Create-later requests require additive proof, explicit missing-role language, and reusable outputs.
- Screenshot facsimiles and whole-screen repaint requests are always invalid.

## Wave sequencing

| Wave | Allows | Forbids | Why it exists |
| --- | --- | --- | --- |
| Wave 0 — Code/docs with current assets only | Composition and governance using current base | New support-art production without proof | Establishes truthful baseline and blocks repaint drift |
| Wave 1 — Shared support chrome | Additive reusable chrome around existing owners | Destructive replacement of preserved families | Builds consistency without ownership transfer |
| Wave 2 — Shared overlays/FX support | Reusable overlay/mask and restrained FX support after evidence | FX/masks used to hide unresolved structure | Ensures support layers reinforce completed composition |
| Wave 3 — Hero enhancement overlays | Approved additive hero support around preserved centers | Hero center replacement | Deepens focal quality without semantic owner transfer |

## Asset continuity and cutover law

Support-part arrival never grants automatic old-layer deletion. Cleanup still requires cutover gate, screenshot approval, and explicit packet scope.

## Repo verification basis (current snapshot)

Verified against branch `work`, short commit `683f3e0`, with direct checks under:

- `src/assets/background/` + `src/assets/background/citystates/`
- `src/assets/menus/`
- `src/assets/onscreen/`
- `src/assets/ui/book_spines/`
- `src/assets/items/ui/`
- `src/assets/icons/`

## Future packet usage rule

Future packets must classify every asset interaction into one bucket before requesting work. If a packet asks for new art where preserve/enhance applies, it is non-compliant.

Wave 0 lock reference: `docs/ui/phase-1-p1-01-wave0-asset-audit.md`.
Machine-readable companion: `docs/ui/phase-1-support-art-backlog.json`.

## Non-goals

This file does not generate art, edit asset files, implement UI code, authorize cleanup, or broaden touchpoint scope.
