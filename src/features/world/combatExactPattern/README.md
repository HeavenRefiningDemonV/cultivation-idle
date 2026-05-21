# World Combat Exact Pattern

This registry documents the exact-page migration pattern now active for Outskirts, Gate Trial, and Ruins.

C10 is non-rendering.
C10 does not refactor Outskirts.

Shared grammar:
- exact page ownership after cutover
- no screen swap on activity start
- center scene transforms in place
- health bars inside center scene
- actors inside center scene
- effects/log/chips/result inside center scene
- one dominant CTA
- support rails subordinate to center
- no old active owner after module cutover

Module-specific visual identity:
- Outskirts: open-field, light density, safe hunt, gold/common materials, Expected Rewards rail
- Gate Trial: ritual-threshold, focused density, minimum/recommended readiness, fail-safe, Attempt Gate
- Ruins: sealed-ruin, medium density, chamber route, targeted materials, anchor, rare pity, Continue/Run

Do not copy Outskirts visuals into Gate Trial or Ruins.
Do not use this registry as a renderer.
Do not import React here.
Do not import stores here.
Do not use this registry as permission to rewrite the exact owners.

The shared pattern is ownership and active-state grammar, not identical visual layout.

Gate Trial and Ruins are now screen-owned exact surfaces. Legacy building panels may remain only as modal compatibility wrappers that hand off to exact owners.
