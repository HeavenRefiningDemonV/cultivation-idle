# Shared FX Emitter Vocabulary (Packet A.6)

This folder defines reusable emitter descriptors and resolver utilities only.

## Rules
- No scene should invent family behavior from zero if a shared family already fits.
- Later scene packets may compose, tint, position, and scale these families per context.
- Later scene packets should not mutate shared baseline descriptor constants inline.
- If a screen needs a new family, justify why mist/dust/sparks/glints/fireflies are insufficient.

| family | default role | continuous | reduced-motion behavior | typical usage |
|---|---|---|---|---|
| mist | underlay | yes | disabled | soft scenic haze |
| dust | underlay | yes | allowed | subtle ambient motes |
| sparks | hero | no | disabled | localized craft/ritual burst |
| glints | hero | no | allowed | sparse readiness/selection shimmer |
| fireflies | underlay | yes | disabled | organic world ambience |
