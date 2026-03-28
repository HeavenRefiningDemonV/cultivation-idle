# Packet A.10 — FX Foundation Compliance Checklist

## 1) Packet purpose
This checklist defines non-negotiable foundation rules for all scenic packets after A.10.

## 2) Checklist grouped by category

### Readability
- `dom-readable-ui`
- `no-pixi-text`
- `content-overlay-readable`

### Ownership
- `provider-store-boundary`
- `screen-no-store-coupling-inside-fx`

### Integration
- `single-app-provider`
- `use-primitives-first`
- `diagnostics-attrs-present`

### Layering
- `local-before-global`
- `no-new-global-z`

### Quality
- `quality-floor-respected`
- `reduced-motion-respected`

### Fallback
- `static-fallback-defined`
- `fallback-warnings-reviewed`

## 3) Before you merge a scenic packet
Use this short merge gate:
1. Confirm checklist IDs are satisfied with evidence from tests/docs.
2. Confirm diagnostics warnings are reviewed and intentional.
3. Confirm no extra provider/store coupling was introduced.
4. Confirm readable content stayed in DOM overlay layers.

## 4) Common violations
- Mounting raw Pixi stages directly in screen files instead of primitives.
- Ignoring static/off fallback behavior in low or reduced-motion paths.
- Introducing ad hoc global z-index bands.
- Mixing readable text into Pixi scene rendering.

## 5) Citation requirement for later packets
Later scenic packets should cite this checklist in their acceptance logic and PR verification notes.
