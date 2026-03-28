# UI FX Foundation (Packets A.2 → A.6)

This directory contains the shared FX shell, quality contract surfaces, boundary primitives, and emitter vocabulary.

## What A.2 established
- Typed FX layer contract and semantic tiers.
- Typed quality contract and store-agnostic provider.
- Stage wrappers (local + portal) and thin Pixi bridge seams.

## What A.3 added
- A richer quality resolver result (`reasons`, deterministic DPR caps).
- Reduced-motion precedence rules (`system`, plus optional dev override support).
- Store bridge outside `src/ui/fx/**`.

## What A.4 added
- Semantic app/local layer contract alignment.

## What A.5 adds
- Canonical declarative `ScreenFxStage` API for local/global stage routing.
- Reusable primitives for scenic backdrops, ambient underlays, hero slots, and safe DOM overlays.
- Motion-safety wrappers and a pure motion safety contract.
- Refined lightweight `useScreenFxState` normalization seam.

## What A.6 adds
- Reusable shared emitter vocabulary descriptors (`mist`, `dust`, `sparks`, `glints`, `fireflies`).
- Pure quality/reduced-motion/off/static resolver for emitter specs.
- Later scene packets consume these families inside scene composition.
- No screen should own raw bespoke particles by default.

## What A.7 adds
- Global provider bridge mount in `App.tsx` via `AppFxProviderBridge`.
- Shell seam wrapper in `GameLayout` via `GameLayoutFxSeam`.
- Lazy global portal-root policy remains (no inert portal mount added).
- Later packets should not mount a second provider; they now only need local screen packet code.

## Guardrails
- No readable UI belongs in Pixi.
- No full-canvas UI conversion.
- No store imports in `src/ui/fx/**`.
- Do not mount raw `PixiUiStage` in screen code unless a boundary primitive truly cannot express the use case.

## Handoff
- **A.7:** provider mounting/app-shell integration.
- Later screen packets compose scenes from the shared emitter vocabulary.
