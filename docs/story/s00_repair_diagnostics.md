# S00 Repair Diagnostics

## Root Causes Found

- Story slides were auto-advancing after 5.2-5.8 seconds, which made the sequence feel rushed.
- Story data still carried ambience and SFX cues, and `StoryAudioController` created `HTMLAudioElement` instances.
- The base painting used camera drift transforms and an animated full-screen grain layer. This made a still slide look like it was shifting and shimmering.
- The cutscene vignette breathed over the whole screen, adding more perceived image instability.
- Path Selection washed out portraits after the story handoff with `opacity: 0.72` and `mix-blend-mode: screen` on `.lifePathPanel__art`.
- Path Selection preview states added animated texture sweeps over the card art.

## S00 Plate Inventory

| Slide | Active Source | Public Review Copy | Size | Render Path |
|---|---|---|---|---|
| 1 | `src/assets/cutscenes/S00/S00 Slide 1.png` | `public/assets/story/s00/s00_01_pinewind_dusk.webp` | 1672x941 | `<img>` |
| 2 | `src/assets/cutscenes/S00/S00 Slide 2.png` | `public/assets/story/s00/s00_02_gate_census_refusal.webp` | 1672x941 | `<img>` |
| 3 | `src/assets/cutscenes/S00/S00 Slide 3.png` | `public/assets/story/s00/s00_03_ash_erasure.webp` | 1672x941 | `<img>` |
| 4 | `src/assets/cutscenes/S00/S00 Slide 4.png` | `public/assets/story/s00/s00_04_keeper_yan_returning_page.webp` | 1672x941 | `<img>` |
| 5 | `src/assets/cutscenes/S00/S00 Slide 5.png` | `public/assets/story/s00/s00_05_returning_page_paths.webp` | 1672x941 | `<img>` |

## Repair Decisions

- Use the full PNG plates for active runtime rendering to avoid low-quality WebP compression artifacts.
- Keep the base image static: no pan, zoom, animated filter, animated opacity during hold, or animated background-position.
- Move atmosphere into `StoryVfxLayer` so ash, mist, and glows are decorative layers above stable art.
- Replace hard slide swaps with incoming/outgoing crossfades and ink/ash/page veil overlays.
- Remove all active story audio code and delete the story audio files from `public/assets/story/s00/audio`.
- Restore Path Selection portrait strength by keeping the `<img>` at `opacity: 1` and `filter: none`, with static halos and lighter local veils above it.
