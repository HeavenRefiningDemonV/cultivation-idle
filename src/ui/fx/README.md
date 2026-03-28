# UI FX Foundation (Packets A.2 → A.5)

This directory contains the shared FX shell, quality contract surfaces, and A.5 boundary primitives.

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

## Guardrails
- No readable UI belongs in Pixi.
- No full-canvas UI conversion.
- No store imports in `src/ui/fx/**`.
- Do not mount raw `PixiUiStage` in screen code unless a boundary primitive truly cannot express the use case.

## Handoff
- **A.6:** shared emitter vocabulary.
- **A.7:** provider mounting/app-shell integration.
