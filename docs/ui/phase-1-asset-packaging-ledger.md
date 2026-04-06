# P1-06 — Phase 1 Asset Packaging Ledger

## Purpose

Track truthful packaging state for every Phase 1 support-art family.

This ledger distinguishes docs/spec readiness from actual binary packaging.

## Legend

- **packaged** = canonical root contains real family binaries.
- **scaffold-only** = canonical root contains docs/readme scaffold only.
- **blocked** = intentionally blocked by design/trigger law.
- **mixed** = partial packaging where some but not all family binaries exist.

## Family ledger

| Family | Packet | Canonical root | Current state | Required members (expected) | Found now | Missing now | Action for Phase 2+ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Shared frame atlas variants | P1-02 | `src/assets/ui/chrome/frame_atlas/` | scaffold-only | light/standard/heavy frame sets + shell variants | README only | all family binaries missing | Generate/package from approved briefs when trigger criteria are met. |
| Plaque/ribbon/titleplate | P1-02A | `src/assets/ui/chrome/plaques/` | scaffold-only | screen header plaques, ribbons, titleplates, breadcrumb plates | README only | all family binaries missing | Generate/package from approved briefs when trigger criteria are met. |
| World/building labels | P1-02B | `src/assets/ui/chrome/world_labels/` | scaffold-only | building labels, selected plates, district labels, city plates/banners | README only | all family binaries missing | Generate/package from approved briefs when trigger criteria are met. |
| Overlay/mask pack | P1-03 | `src/assets/ui/overlays/` | scaffold-only | vignette overlays, blend masks, inspector darken masks, underlays | README + `.gitkeep` | all family binaries missing | Generate/package from approved briefs when trigger criteria are met. |
| State ornament family | P1-03A | `src/assets/ui/overlays/state_ornaments/` | scaffold-only (subroot reserved by spec) | tracked/claim-ready/recommended/caution/completion/selected/header-companion set | no binaries present in overlays root | all family binaries missing | Generate/package only after state-family proof and no-layout-shift checks. |
| Shared FX sprite atlas | P1-04 | `src/assets/ui/fx/` | scaffold-only | mist/dust/glint/ember/halo/seal/aura/firefly/brush families | README + `.gitkeep` | all family binaries missing | Generate/package from approved FX brief when trigger criteria are met. |
| Cultivation hero enhancement kit | P1-05 | `src/assets/ui/heroes/cultivation/` | blocked | altar/ring/glow/aura/underplate (+ optional verse support) | none | all family binaries missing | Remains blocked until P1-05 trigger matrix passes. |
| Heart Law altar/seal support kit | P1-05 | `src/assets/ui/heroes/heart_law/` | blocked | altar/pedestal/seal companions/circular overlays/preview/resonance supports | none | all family binaries missing | Remains blocked until P1-05 trigger matrix passes. |

## Packaging integrity notes

- No synthetic binaries were created in P1-06.
- No unrelated files were copied into support roots to fake packaged readiness.
- Existing scenic-owner binaries outside support roots remain untouched.
