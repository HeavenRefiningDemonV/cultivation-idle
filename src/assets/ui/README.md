# UI Asset Scaffold (Packet A.9)

`src/assets/ui/` is the canonical future root for reusable UI-facing art families.

## Scope of this packet
- Establishes metadata manifests and folder structure only.
- Audits reusable current assets through `reuse/existingUiAssetReuseMap.ts`.
- Represents missing art in manifests instead of fake image placeholders.

## Important policy
- Current repo assets stay in their existing folders for now; later packets may move or alias intentionally.
- Missing assets must be tracked as `planned-missing` manifest entries, not temporary PNG/SVG junk.
- Do not bake readable text into art.
- Prefer tintable, reusable parts and nine-slice-compatible frames where applicable.
- Prefer reuse over replacement when an existing real asset already fits.

## Packet handoff
Later asset-consuming packets should consult this scaffold before requesting new art generation or wiring imports.
