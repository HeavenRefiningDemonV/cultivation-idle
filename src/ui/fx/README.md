# UI FX Foundation (Packets A.2 + A.3)

This directory contains the shared FX shell and quality contract surfaces.

## What A.2 established
- Typed FX layer contract and semantic tiers.
- Typed quality contract and store-agnostic provider.
- Stage wrappers (local + portal) and thin Pixi bridge seams.

## What A.3 adds
- A richer quality resolver result (`reasons`, deterministic DPR caps).
- Reduced-motion precedence rules (`system`, plus optional dev override support).
- Store bridge lives **outside** this folder (`src/app/fx/**`) so `src/ui/fx/**` stays store-agnostic.

## Guardrails
- No readable UI belongs in Pixi.
- No full-canvas UI conversion.
- No store imports in `src/ui/fx/**`.

## Handoff
- **A.4:** final app-wide layering policy.
- **A.7:** provider mounting/app-shell integration.
