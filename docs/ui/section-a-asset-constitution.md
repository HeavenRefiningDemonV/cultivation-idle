# Section A.3 — Asset Constitution: Preserve, Enhance, Create Later

## Purpose

This file turns the v3 asset policy into production doctrine so later packets and art requests cannot reinterpret current assets as replaceable by default. It inherits `docs/ui/section-a-global-doctrine.md` and `docs/ui/section-a-destructive-freeze.md`. It governs asset classification and request policy, not implementation.

## Scope note

This file governs asset-family classification, first-wave art boundaries, later-art triggers, request quality bar, reusable-part standards, and compact repo-family verification basis.

This file does **not** govern renderer/package choices, screen implementation, asset generation execution, cleanup execution, numeric tuning, gameplay balance, or full touchpoint path registry work.

## Core thesis

**Current assets first** is mandatory. Current assets are the practical base. Strong scenic ownership is preserved. Useful support families are wrapped and strengthened before replacement is considered. New art is for missing support roles, not default replacement. Future prompts must never start with “generate new art” before preserve/enhance analysis is complete.

This is not a replacement art pass.

## Bucket system

All asset interaction must be classified into exactly one doctrine bucket before work starts: Preserve as core, Preserve but enhance, or Create later only if the role is still missing.

Any packet that requests new art without this classification is non-compliant.

---

## A. Preserve as core

**Operational definition:** The family remains the visual owner by default. First-wave work may tune integration, spacing, framing support, and readability around it, but must not replace ownership.

| Asset family | Current policy | Why | First-wave rule | Later note |
| --- | --- | --- | --- | --- |
| Path portraits | Preserve as core | Life-path identity anchor | Must not replace portraits in first wave | Support layers only; no portrait swap |
| Book spines (`src/assets/ui/book_spines/*`) | Preserve as core | Existing library identity owner | Must not replace spine identity in first wave | Add support framing only |
| `city.png` and city-state overlays (`src/assets/background/citystates/*`) | Preserve as core | Core city hub ownership | Must keep city base/overlays as scenic owner | Add overlays/labels only after missing-role proof |
| `forgewide_*` (`forgewide_empty/unshaped/shaped/shaping`) | Preserve as core | Forge room state-aware owner | Must not replace forgewide family in first wave | Add masks/FX/plaque support only after additive proof |
| `manualpavilion.png` | Preserve as core | Manual Pavilion scenic continuity | Must not replace with new scenic repaint | Strengthen shell/chrome only |
| `tech.png` | Preserve as core | Techniques baseline owner | Must not replace in first wave | Overlays/FX only after approved additive gap |
| `bountyboard.png` | Preserve as core | Bounties/Expeditions anchor | Must not replace board in first wave | Reusable plaques/ribbons only after trigger |
| Hourglass icon family (`hourglass_empty/progress`) | Preserve as core | Recognized time/progress semantic | Must not run first-wave icon replacement | Optional ornament only if role still missing |
| `qi_lotus` family (`qi_lotus_closed/open/full`) | Preserve as core | Cultivation progression anchor | Must not replace lotus family in first wave | Hero overlays may wrap, not replace |
| Current cultivator / dantian base (`cultivator_backshots.png` + current center stack) | Preserve as core | Hero mechanic-semantic anchor | Must not replace cultivator/dantian base in first wave | Enhancement overlays only after approved additive gap |

## B. Preserve but enhance

**Operational definition:** The family remains present and authoritative for function, but should be strengthened through variants/wrappers/spacing/masks/overlays for higher coherence.

| Asset family | Current policy | Why | First-wave rule | Later note |
| --- | --- | --- | --- | --- |
| `buttoncorners.png` | Preserve but enhance | Existing interaction shell primitive | Keep base and add wrappers/variants first | Replace only after explicit insufficiency proof |
| `scroll.png` | Preserve but enhance | Reusable parchment support language | Enhance usage/composition before replacement requests | Extend with compatible support parts if needed |
| `bar_long.png` | Preserve but enhance | Practical support strip | Keep and strengthen in first wave | New variants only after cross-screen insufficiency proof |
| `bar_short.png` | Preserve but enhance | Compact variant of same support strip | Keep and strengthen in first wave | Same trigger as `bar_long.png` |
| `block_fancy.png` | Preserve but enhance | Existing ornate framing shell | Wrap/align before replacement discussion | Complement with later variants only after proven gap |
| Existing paper/ink card shells | Preserve but enhance | Legible, theme-aligned card language | Preserve shell family while improving hierarchy | Overlays/masks only after reusable gap proof |
| Current Outskirts / Gate Trial shell alignment | Preserve but enhance | Existing practical ownership | Keep alignment ownership and tune additively | Replacement requests require missing-role proof |
| Current apothecary room foundations | Preserve but enhance | Existing room base ownership | Preserve base and layer additively | Later support parts may enrich labels/frames |
| Current forge room foundations | Preserve but enhance | Existing forge foundation ownership | Preserve foundations and strengthen additively | Base replacement prohibited in first wave |

## C. Create later only if the role is still missing

**Operational definition:** These are not first-wave art requests. They are conditional support-part requests allowed only when additive screenshots prove unresolved role gaps.

| Asset family | Current policy | Why | First-wave rule | Trigger for later request |
| --- | --- | --- | --- | --- |
| Frame atlas variants | Create later only if still needed | Existing frame family should be exhausted first | Must not request in Wave 0 | Request only after shared chrome proves one frame family too narrow |
| Plaque / ribbon family | Create later only if still needed | Label/header consistency should be proven missing before new family is commissioned | Must not request in first-wave additive stabilization | Request when multiple screens need consistent labels/titles/headers/breadcrumbs current assets cannot cover elegantly |
| FX sprite atlas | Create later only if still needed | FX must support stable composition, not hide incompleteness | Must not request before additive atmosphere layer exists | Request only after atmosphere layer is mounted and repeatable support FX is needed across 2+ screens |
| Cultivation enhancement overlays | Create later only if still needed | Cultivation hero center must remain current owner first | Must not replace current cultivator/dantian center | Request only after additive Cultivation is approved and still underpowered around current base |
| Heart Law altar / seal kit | Create later only if still needed | Sacred preview anchor should be proven missing, not assumed | Must not request before composing with existing assets | Request only after Heart Law selection is composed and still lacks convincing sacred preview anchor |
| World label plaques | Create later only if still needed | Temporary/reused labels may suffice initially | Must not request as default polish | Request only after temporary/reused plaques prove weak or inconsistent |
| Overlay / mask pack | Create later only if still needed | Existing shells/frames should be leveraged first | Must not request without multi-screen evidence | Request only after multiple screens clearly need reusable compositing support beyond existing shells |
| Recommendation swashes | Create later only if still needed | Current chip/plaque language should be evaluated first | Must not request for taste-only ornament | Request only after recommendation states need stronger shared grounding than current chip/plaque language provides |
| Medallions and optional icon seals | Create later only if still needed | Shared ornament is optional and should not displace function | Must not request in first-wave stabilization | Request only if shared ornament remains missing after layout/chrome stabilization |

## First-wave prohibitions (hard bans)

In this wave, packets **must not request** and teams **must not perform**:

- replacement of current icon families because they look older;
- replacement of current cultivator/dantian hero center;
- replacement of path portraits;
- replacement of bookshelf/spine identity;
- replacement of forgewide room family;
- whole new scenic screen painting before current screens are compositionally stable.

## Bucket enforcement rules

- Preserve as core families must remain visual owners unless doctrine is explicitly reopened.
- Preserve but enhance families must be strengthened before replacement discussion.
- Create-later requests require additive proof, missing-role evidence, and reusable support-part output.
- Screenshot facsimiles and whole-screen repaint requests are always invalid.

## Wave sequencing

| Wave | Allows | Forbids | Why it exists |
| --- | --- | --- | --- |
| Wave 0 — Code with current assets only | Implementation and composition with current asset base | New art requests except doctrine-approved emergency restoration support | Establishes truthful baseline and prevents art-first drift |
| Wave 1 — Shared support chrome | Additive reusable chrome around existing owners | Destructive replacement of preserved families | Builds consistency without ownership transfer |
| Wave 2 — Shared FX vocabulary | Reusable support FX once atmosphere layer is stable | FX used to mask broken composition or missing controls | Ensures FX reinforces, not compensates |
| Wave 3 — Hero enhancement overlays | Approved hero support overlays around preserved centers | Hero center replacement in this doctrine scope | Deepens focal quality while preserving semantic anchor |
| Wave 4 — Optional polish requests | Optional create-later support parts with explicit triggers | Untriggered aesthetic backlog expansion | Keeps polish disciplined and role-driven |

## Asset continuity and cutover law

Even preserve-but-enhance families remain subject to additive continuity. Old scenic/base ownership must remain until approved additive replacement exists on the exact screen. New support layers are additive support parts, not automatic authority transfers.

Support-part arrival never permits automatic old-layer deletion; cleanup still requires cutover gate, screenshot approval, and explicit packet scope.

## Repo verification basis (family-level)

This constitution was verified against the latest repo asset tree at family level. Filename drift is resolved by family naming and concrete repo examples instead of guessed exact names.

Verification roots used:

- `src/assets/background/` and `src/assets/background/citystates/`
- `src/assets/menus/`
- `src/assets/onscreen/`
- `src/assets/ui/book_spines/`
- `src/assets/items/ui/`
- `src/assets/icons/`

Examples confirming presence include `manualpavilion.png`, `tech.png`, `bountyboard.png`, `forgewide_*`, city-state overlays, `qi_lotus_*`, hourglass icons, and book spines. This is not a full touchpoint registry.

## Future packet usage rule

Future UI packets must classify every asset interaction as preserve as core, preserve but enhance, or create later only if still needed before requesting work. If a packet asks for new art where preserve or enhance should apply, the packet is wrong. Create-later requests must cite a concrete missing role and additive proof, not weak taste language.

## Non-goals

This file does not generate art, edit asset files, style components, change technical stack, expand path registry scope, or authorize full icon replacement passes.
