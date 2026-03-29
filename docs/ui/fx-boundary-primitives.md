# Packet A.5 — DOM / Motion / Pixi Boundary Primitives

## Purpose
A.5 installs reusable, declarative boundaries so later screen packets can mount scenic shells without re-solving layer routing, reduced-motion handling, or DOM/Pixi ownership split per screen.

## File responsibility map

| File | Responsibility |
| --- | --- |
| `src/ui/fx/types.ts` | Shared boundary literal types. |
| `src/ui/fx/ScreenFxStage.tsx` | Canonical declarative local/global stage API. |
| `src/ui/fx/primitives/ScreenCompositionRoot.tsx` | Standard local composition root wrapper. |
| `src/ui/fx/primitives/ScenicBackdropMount.tsx` | DOM-only scenic backdrop layer mount. |
| `src/ui/fx/primitives/AmbientUnderlayMount.tsx` | Declarative underlay FX mount + static fallback policy. |
| `src/ui/fx/primitives/HeroFxSlot.tsx` | Declarative focal hero FX slot mount + static fallback policy. |
| `src/ui/fx/primitives/SafeDomOverlaySlot.tsx` | Safe readable DOM overlay mount above local FX. |
| `src/ui/fx/motion/motionSafetyContract.ts` | Pure reduced-motion-safe selection/entry contract. |
| `src/ui/fx/motion/useMotionSafety.ts` | Hook bridge from Framer reduced-motion signal to pure contract. |
| `src/ui/fx/motion/MotionSafePresence.tsx` | Thin reduced-motion-safe `AnimatePresence` wrapper. |
| `src/ui/fx/motion/MotionSafeSelectionSurface.tsx` | Reduced-motion-safe selectable DOM surface wrapper. |

## Why these primitives exist
- Prevent repeated per-screen reimplementation of stage mounting and quality gates.
- Keep readable overlays in DOM, above hero/ambient FX.
- Keep motion policy centralized and consistent with reduced-motion constraints.
- Keep Pixi ownership inside tiny reusable mounts.

## Usage snippets

### Future hero screen shell
```tsx
<ScreenCompositionRoot screenKey="cultivation" archetype="hero">
  <ScenicBackdropMount screenKey="cultivation" backdropImage={...} />
  <AmbientUnderlayMount
    screenKey="cultivation"
    qualityFloor="low"
    scene={<CultivationFxScene />}
  />
  <HeroFxSlot
    screenKey="cultivation"
    qualityFloor="medium"
    align="center"
    bleed="md"
    scene={<CultivationHeroScene />}
  />
  <SafeDomOverlaySlot screenKey="cultivation">
    <RunCompass />
  </SafeDomOverlaySlot>
</ScreenCompositionRoot>
```

### Future selection surface
```tsx
<MotionSafeSelectionSurface
  selected={isSelected}
  emphasis="standard"
  onClick={onChoose}
>
  ...
</MotionSafeSelectionSurface>
```

## Non-goals
- No app integration.
- No screen rollout.
- No scene/emitter implementation.
- No settings/store changes.
- No modal/screen redesign.

## Handoff
- **A.6:** adds shared emitter vocabulary.
- Later hero/module packets consume these primitives directly.
- **A.7:** mounted app/provider and GameLayout seam integration.
- Later packets should not add a second provider and should only implement local screen usage.

## Rule reminder
Do not mount raw `PixiUiStage` in screen code unless a boundary primitive truly cannot express the use case.
