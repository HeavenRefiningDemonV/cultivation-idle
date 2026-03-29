# Packet A.6 — Shared FX Emitter Vocabulary

## Purpose
A.6 defines typed reusable emitter families so later scene packets can assemble screen-specific looks without inventing bespoke particle behavior from scratch.

## Why descriptors over heavy runtime dependency
- Keeps this packet package-light and runtime-agnostic.
- Lets later scenes choose implementation details (custom loops vs. dedicated runtime) while sharing one authored vocabulary.
- Centralizes quality/reduced-motion/off/static gating in a pure resolver.

## Family table

| family | id | default layer | spawn space | motion profile | continuous |
| --- | --- | --- | --- | --- | --- |
| mist | `uiFx.mist.softUnderlay` | underlay | screen | drift | yes |
| dust | `uiFx.dust.ambientMotes` | underlay | screen | float | yes |
| sparks | `uiFx.sparks.localizedForge` | hero | area | burst | no |
| glints | `uiFx.glints.selectionHalo` | hero | ring | flicker | no |
| fireflies | `uiFx.fireflies.worldDrift` | underlay | screen | drift | yes |

## Quality + reduced-motion policy
- `renderMode: off` disables every family.
- `resolvedQuality: off` disables every family.
- `renderMode: static` disables continuous families.
- `reducedMotion` disables families marked `suitableForReducedMotion: false`.
- `allowAtmosphere` gates mist/dust/fireflies.
- `allowHeroFx` gates sparks/glints.
- `countScale` applies multiplicatively after the quality count ladder and clamps to non-negative integer counts.

## Authoring rules for future families
- Keep descriptors pure, typed, and conservative.
- Reuse existing families unless there is a clear expressive gap.
- Declare intended layer/spawn/motion semantics explicitly.
- Include quality ladders and reduced-motion suitability.
- Keep notes practical and packet-safe (no screen coupling).

## Example snippets (future scene packets)
```tsx
const mist = resolveEmitterSpec({
  descriptor: mistEmitter,
  resolvedQuality,
  renderMode,
  reducedMotion,
  allowAtmosphere,
  allowHeroFx,
});
```

```tsx
const heroGlints = resolveEmitterSpec({
  descriptor: glintsEmitter,
  resolvedQuality,
  renderMode,
  reducedMotion,
  allowAtmosphere,
  allowHeroFx,
  countScale: isRecommended ? 1.5 : 1,
});
```
