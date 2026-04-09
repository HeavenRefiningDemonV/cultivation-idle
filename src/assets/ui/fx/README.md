# P1-04 shared FX sprite atlas scaffold root

## Folder purpose

`src/assets/ui/fx/` is the shared support-art root for P1-04 atmospheric FX sprite families.

This folder exists to host reusable painterly low-frequency FX vocabulary for Phase 1 support art.

## What belongs here

- mist wisps
- dust mote clusters
- sacred glints
- ember drift elements
- halo breath supports
- seal pulse supports
- aura wisps
- firefly/world motes
- brush shimmer accents

## What does not belong here

- scenic owner paintings or room replacements
- structural chrome ownership (frames/plaques/title plates)
- overlay/mask ownership families
- state underlays, recommendation swashes, tracked/claim-ready/completion stamps
- hero enhancement kit layers scheduled for later packets
- truth-carrying text assets
- neon HUD sweeps, confetti, or sci-fi burst spectacle

## Naming examples

- `ui_fx_mist_wisp_soft_default.png`
- `ui_fx_dust_mote_soft_default.png`
- `ui_fx_glint_sacred_soft_default.png`
- `ui_fx_ember_drift_soft_default.png`
- `ui_fx_halo_breath_soft_default.png`
- `ui_fx_seal_pulse_soft_default.png`
- `ui_fx_aura_wisp_soft_default.png`
- `ui_fx_firefly_mote_world_default.png`
- `ui_fx_brush_shimmer_soft_default.png`

## Relationship to scenic owners

FX assets in this root are additive atmosphere only.

Current scenic owners remain primary and must not be replaced, repainted, or obscured by this family.

## Relationship to overlay/mask family

Overlay and mask ownership is handled by the P1-03 overlays root (`src/assets/ui/overlays/`).

P1-04 FX assets must not absorb mask/state-underlay responsibilities.

## Relationship to later hero enhancement kits

Hero enhancement kits remain separate and later under `src/assets/ui/heroes/`.

P1-04 provides shared atmospheric vocabulary only and does not include hero-local replacement/ownership layers.

## Import gate and packet scope

P1-04 originally treated this root as scaffold-only. This root now also carries optional low-opacity P3-11A brushwash supports for selected-path emphasis:
- `path_selected_brushwash_soft_a.svg`
- `path_selected_brushwash_soft_b.svg`

These are additive carriers and should remain secondary to portrait ownership.

## P1-06 closeout note
Current Phase 1 closeout audit marks this root as scaffold-only until real support-art binaries are packaged.
