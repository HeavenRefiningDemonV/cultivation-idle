# FX Motion Safety Wrappers (Packet B.11)

DOM interaction motion in FX-adjacent UI stays in Framer Motion and must route through this layer.

## Why
- Centralize reduced-motion behavior.
- Enforce no-bounce / no-overshoot interaction law.
- Keep no-layout-shift defaults consistent.
- Avoid hand-rolled hover/selection timing policies per screen.

## Motion law
- No bounce and no spring overshoot.
- Hover = tint/glow/subtle lift only.
- Selection = subtle opacity emphasis + small scale only when safe.
- Press = tiny down-shift only.
- Reduced motion disables lift/scale and collapses durations.

## Guidance
- Prefer `MotionSafeSelectionSurface` over raw `motion.div` for selectable DOM surfaces.
- Prefer `MotionSafePresence` over direct `AnimatePresence` for enter/exit wrappers.
- Keep wrappers DOM-only (no Pixi coupling).
- Keep JS mirror values in `motionSafetyContract.ts` aligned with `src/styles/uiMotionTokens.scss`.
