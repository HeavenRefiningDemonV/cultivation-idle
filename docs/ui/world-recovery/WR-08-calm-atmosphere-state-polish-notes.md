# WR-08 — World calm atmosphere and state-polish notes

## Atmosphere/state problems found
1. World atmosphere layer was no longer mounted in `WorldScreen`, leaving the map visually static in all quality tiers.
2. `CityMapHub` no longer exposed atmosphere quality/reduced-motion data attributes or hotspot glint markers expected by World contracts.
3. Selected/recommended atmospheric emphasis was under-articulated and not explicitly separated in the scene layer.
4. Reduced-motion fallback needed hard guarantees that motion cues are removable without losing semantic state cues.

## What WR-08 changed
- Re-mounted `WorldFxScene` in `WorldScreen` behind map content (`worldScreenHubAtmosphere`) with current quality/reduced-motion inputs.
- Added calm one-fog + sparse-mote scene behavior with explicit selected/recommended state halos and support-alert-aware fog tuning.
- Added `CityMapHub` atmosphere data hooks and subtle selected/recommended glint overlays that remain subordinate to labels/map owner.
- Hardened low/reduced-motion CSS paths so motes and glint animations collapse to static/near-static treatments.

## Evidence expectations (manual QA)
Capture post-change screenshots for:
- default World state
- selected-building state
- recommended-building state
- tracked bounty / idle support state
- High / Medium / Low / Reduced Motion
- narrow layout

These captures remain required for WR-09 signoff.
