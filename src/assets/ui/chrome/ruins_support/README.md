# Ruins support-art registry

This folder defines *optional* support-art slots for Ruins surfaces.

## Justified roles in this packet
- `ruin_location_plaque`: scenic-center identity framing.
- `ruin_anchor_reward_plate`: deterministic anchor underplate framing.

## Non-goals
- No scenic repainting or city/ruins background replacement.
- No heavy mask overlays.
- No glint dependency for comprehension.

## Runtime behavior
- Generated files may be absent.
- UI must keep deterministic text as DOM-first truth and fall back to CSS chrome without crashes.
