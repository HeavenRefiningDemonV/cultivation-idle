# FX Boundary Primitives (Packet A.5)

This folder owns reusable DOM/Pixi composition boundaries for future screen packets.

## Why these wrappers exist
- Keep readable UI in DOM overlay slots.
- Keep Pixi ownership inside tiny FX-only mounts.
- Keep local composition semantics consistent with A.4 layer tokens.

## Usage guidance
- Prefer these primitives instead of hand-composing `PixiUiStage` + `ScreenFxStage` + raw layer classes.
- Do not mount raw `PixiUiStage` in screen code unless a boundary primitive truly cannot express the use case.
- Keep store coupling outside this folder.
