# Section A.3 — Asset Request Rules

## Purpose

This file governs future UI asset requests. New art is not the default answer. A request is valid only when a missing role is proven after additive work with current assets.

This file must be used with:

- `docs/ui/section-a-global-doctrine.md`
- `docs/ui/section-a-destructive-freeze.md`
- `docs/ui/section-a-asset-constitution.md`

## Preconditions for any new asset request (all mandatory)

A new asset request is valid only if **all** checks pass:

- [ ] The target screen already has an additive composition using current assets.
- [ ] That additive version exists as concrete screenshot proof or approved visual equivalent.
- [ ] The missing role is named explicitly in one sentence.
- [ ] The role belongs to the create-later bucket, not preserve as core or preserve but enhance.
- [ ] The request is for reusable support parts, not screenshot recreation.
- [ ] The request does not violate first-wave prohibitions.
- [ ] The request is not justified by “looks old” language alone.

If any check fails, the request must be rejected or rewritten as preserve/enhance work.

## Allowed request categories and triggers

| Request category | Allowed trigger | Typical output type | Must not become |
| --- | --- | --- | --- |
| Frame atlas variants | Shared chrome proves one frame family too narrow across real screens | Reusable frame atlas parts | Whole-screen repaint |
| Plaque / ribbon family | Multiple screens need consistent labels/titles/headers/breadcrumbs current assets cannot cover elegantly | Reusable plaque/ribbon kit | Bespoke per-screen decorative replacements |
| FX sprite atlas | Atmosphere layer is mounted and repeatable support FX is needed across 2+ screens | Atlas-ready soft alpha FX sprites | Visual bandage for broken composition |
| Cultivation hero overlays | Additive Cultivation is approved and current cultivator/dantian area is still underpowered | Layered hero support overlays | Replacement of cultivator/dantian center |
| Heart Law altar / seal kit | Existing composition still lacks a convincing sacred preview anchor | Reusable altar/seal support kit | One-shot scene painting |
| World building plaques | Temporary/reused plaques prove weak or inconsistent | Reusable world label plaque set | Per-screenshot text painting |
| Overlay / mask pack | Multiple screens need reusable compositing support beyond existing shells | Reusable overlay/mask pack | Ad-hoc one-off edits |
| Recommendation swashes | Recommendation states need stronger shared grounding than current chip/plaque language provides | Reusable recommendation support parts | Primary status indicator replacement |
| Optional medallions / icon seals | Shared ornament remains missing after layout/chrome stabilization | Optional reusable medallion/seal kit | First-wave icon family replacement |

## Forbidden request shapes

The following request shapes are forbidden and must be rejected:

- whole-screen repaints;
- screenshot facsimiles;
- replacement of current icons in this wave;
- replacement of path portraits;
- replacement of cultivator/dantian hero center;
- replacement of forgewide rooms;
- one-off bespoke art when the missing need is clearly a reusable shared support part;
- art requests used to solve layout/readability problems that code/chrome should solve first;
- art requests justified only by “looks outdated” without a missing-role argument.

## Required output standards

Approved later-art requests must specify these output standards:

- reusable parts over screenshot recreation;
- PNG/SVG format preference where appropriate;
- tintable grayscale/sepia-friendly support parts preferred;
- separate hero support layers where relevant: `base`, `ring`, `core`, `glow mask`, `aura wisps`, `seal`, `pedestal`;
- nine-slice candidates must include slice margins;
- FX sprites must be soft, alpha-based, and atlas-friendly.

If the request cannot define these standards, the request is incomplete.

## Required request template

Use this template verbatim or equivalent structure:

```md
### Asset Request (Section A.3)
- Target role:
- Screen(s) affected:
- Why current assets are insufficient:
- Proof artifact / screenshot reference:
- Bucket classification (create later only if still needed):
- Requested deliverable type (reusable support parts only):
- Format constraints (PNG/SVG, transparency, atlas notes):
- Tinting / slicing / layering constraints:
- Current base asset that remains in place:
- Explicit non-goals (what this request must not do):
```

Requests that omit any field must be sent back before review.

## Review / rejection rules

Reviewers must reject a request if any of the following is true:

- additive proof is missing;
- replacement is requested where enhance should suffice;
- screenshot recreation is requested instead of reusable parts;
- first-wave prohibitions are violated;
- missing role is not explicitly named;
- request would transfer ownership from a preserved core family without explicit doctrine reopening.

Reviewers must also reject requests that hide cleanup intent or smuggle destructive changes under infrastructure scope.

## Packet-author usage rules

Packet authors must declare asset intent before asking for output:

1. state bucket classification;
2. include missing-role argument;
3. include proof artifact;
4. lock non-goals against replacement drift;
5. state which current base asset remains in place.

If these fields are absent, reviewers must treat the packet as non-compliant.

## Closing usage rule

Future packets must cite this file before asking for new UI art.

Wave 0 bridge handoff references for later requests:
- `docs/ui/phase-1-asset-spec-sheet.md`
- `docs/ui/phase-1-wave0-screenshot-matrix.md`
