# Packet A.8 — Screen Composition Layer Contract

## Purpose
A.8 standardizes screen-local composition slots so scenic packets can layer backdrop, texture, FX underlay, hero FX, readable content, and safe overlay in a predictable order.

This packet is contract-first: it defines stable class names and token-backed z-index lanes without introducing new scene visuals.

## Contract surface
- `src/styles/uiScreenComposition.scss`
- global stylesheet import via `src/styles/global.css`

## Required slot classes
- `.uiScreenCompositionRoot`
- `.uiScreenCompositionBackdrop`
- `.uiScreenCompositionTexture`
- `.uiScreenCompositionFxUnderlay`
- `.uiScreenCompositionContent`
- `.uiScreenCompositionHeroFx`
- `.uiScreenCompositionContentOverlay`

## Layer policy
A.8 slot ordering is token-based and must stay aligned with `src/styles/uiLayerTokens.css`:
- backdrop: `--ui-layer-local-backdrop`
- texture: `--ui-layer-local-texture`
- fx underlay: `--ui-layer-local-fx-underlay`
- content: `--ui-layer-local-content`
- hero fx: `--ui-layer-local-fx-hero`
- content overlay: `--ui-layer-local-content-overlay`

Direct numeric z-index literals do not belong in slot declarations.

## Interaction policy
- Decorative layers (`backdrop`, `texture`, `fx underlay`, `hero fx`, `content overlay`) are pointer-inert by default.
- Readable UI remains inside `.uiScreenCompositionContent` with pointer events enabled.

## Non-goals
- No full-canvas UI conversion.
- No direct Pixi scene mounting from this packet.
- No app-shell overlay policy changes.
