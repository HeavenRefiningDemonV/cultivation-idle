# UI FX Foundation (Packet A.2)

This directory contains the **A.2 architecture shell only** for the UI FX runtime.

## Scope of this packet
- Introduces typed FX contracts (layering + quality).
- Adds inert stage wrappers for local and portal-hosted FX surfaces.
- Adds a thin Pixi bridge and generic hooks for future scene state inputs.
- Adds folder structure for future shared Pixi scenes and emitter definitions.

## Explicitly deferred
- **A.3:** settings wiring into `FxQualityProvider`.
- **A.4:** final app-wide layering policy and z-band finalization.
- **A.7:** app-shell integration/mounting in live runtime surfaces.

## Guardrails
- No readable UI belongs in Pixi.
- No full-canvas UI conversion.
- No direct screen/store coupling inside `src/ui/fx/**`.
