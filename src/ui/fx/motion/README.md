# FX Motion Safety Wrappers (Packet A.5)

DOM interaction motion in FX-adjacent UI should stay in Framer Motion and run through these wrappers.

## Why
- Centralize reduced-motion behavior.
- Keep no-layout-shift defaults consistent.
- Avoid hand-rolled hover/selection animation policies per screen.

## Guidance
- Prefer `MotionSafeSelectionSurface` over raw `motion.div` for selectable DOM surfaces.
- Prefer `MotionSafePresence` over direct `AnimatePresence` for enter/exit wrappers.
- Motion wrappers must remain DOM-only and must not depend on Pixi.
