# Ruins approved mockup binding (P0)

## Primary visual authority
- Approved Ruins exact mockup (2048 x 1152):
  - `/mnt/data/45e00e51-3cf7-4b34-a872-e30930c490b5.png`

## Repository binding status
- Expected in-repo binary path when committed:
  - `docs/release/qa/ui-cutover/ruins-exact/approved-mockup/ruins-hollow-log-den-approved-exact.png`
- Current status in this environment: **external-only**.
  - The source binary was not present in this runtime, so no substitute image was fabricated.

## Scene crop contract (reference-only)
- Planned crop target path:
  - `docs/release/qa/ui-cutover/ruins-exact/approved-mockup/ruins-hollow-log-den-scene-plate-crop.png`
- Crop coordinates from approved authority:
  - `x=362, y=270, width=1315, height=595`
- Policy:
  - This crop is reference-only in Packet 0.
  - Packet 0 does not import this crop in code.

## Legacy and support-art policy
- Legacy concept path `/mnt/data/Ruins.png`: context-only, not exact authority.
- `src/assets/background/citystates/city_ruins.png`: world-map/city-state support art only, never the exact central scene plate.
- `src/assets/ui/chrome/ruins_support/*`: may support plaques/haze/glow in later packets, but cannot replace the central hand-painted scene plate.

## Guardrail
- Current phase-6 Ruins preflight is the live baseline authority.
- Approved mockup fixture is the exact future target authority.
- These authorities must not be conflated.
- The central scene must use real scene-plate art/crop and cannot be recreated as CSS gradients.
