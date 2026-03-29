# Packet A.9 — Asset Scaffold, Manifests, and Placeholder Policy

## 1) Packet purpose
Packet A.9 establishes a metadata-first UI asset scaffold so future scenic packets can reuse existing art, request missing families consistently, and avoid placeholder-file drift.

## 2) Canonical asset root and family folders
Canonical root: `src/assets/ui/`

Families:
- `chrome/`
- `fx/`
- `overlays/`
- `heroes/`
- `reuse/` (metadata map for existing reusable assets)

## 3) Current reusable asset policy
- Current repo assets may be reused if they fit the target visual language.
- Reuse decisions must be documented in `src/assets/ui/reuse/existingUiAssetReuseMap.ts`.
- Current assets should **not** be silently duplicated into `src/assets/ui/` during this packet.

## 4) Planned-missing asset policy
- Missing assets should exist only as manifest entries (`planned-missing` / `planned-optional`).
- No fake image files should be created just to satisfy expected paths.
- Manifest metadata is the source of truth for future art requests.

## 5) Naming convention
Use stable, reusable names that describe function rather than one screen:
- `frame_card_thin_9slice`
- `plaque_header_small`
- `mist_wisp_soft_01`
- `paper_grain_soft`
- `cultivation_orb_core`

## 6) Production rules
- No baked readable text in art.
- Prefer reusable transparent parts over screenshot-like composites.
- Make assets tintable where possible.
- Use nine-slice for suitable frame families.
- Hero assets must be layered kits, not flattened posters.
- Produce high-resolution source for hero assets.
- Document nine-slice margins when real frame art is produced.

## 7) Placeholder policy
Forbidden:
- dummy placeholder PNGs
- blank transparent files
- screenshot mock placeholders
- `temp_final_v2`-style junk naming
- screen-specific one-off art when a reusable family solves the need

Rule: missing art is represented in manifests, not fake files.

## 8) Handoff to later packets
- First asset-consuming packet should source metadata from `src/assets/ui/registry.ts`.
- Promote reused entries first when they satisfy readability/style constraints.
- Request truly missing assets from manifest IDs before introducing new ad hoc names.
