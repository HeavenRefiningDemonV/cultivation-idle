# P2-03 — Shared motion token normalization

## Purpose

Document the canonical Phase 2 motion-token contract from current repo truth. This packet is documentation and contract normalization only; it does not grant cleanup authority or retiming authority for unrelated screens.

## Canonical basis (repo truth)

- Motion tokens and presets are defined under `src/ui/motion/*`.
- `ritualMotion`, `uiMotionTokens`, and `layoutStability` are the shared families used by shell/modal surfaces.
- P2-11 quality-tier behavior and P2-12 no-layout-shift constraints remain inherited and binding.

## Landed scope

1. Shared motion token families are treated as canonical for Phase 2 prompts.
2. Ritual/shell consumers inherit normalized timing/easing vocabulary through shared motion utilities.
3. Normalization remains additive; packet does not force broad visual retiming.

## Explicit non-goals

- No screen-family retheme.
- No mass retiming of scene choreography.
- No override of `prefers-reduced-motion` behavior.
- No cleanup or removal authority.

## Naming and history note

Some planning threads referenced P2-03 before this file existed. This packet records current truth without inventing retroactive implementation history.
