# Packet A.10 — FX Foundation Diagnostics

## 1) Packet purpose
A.10 adds a small diagnostics layer so the FX foundation can be measured and smoke-tested before broader scenic rollout.

## 2) What diagnostics are available
- Runtime mount snapshot reader: `readFxFoundationRuntimeSnapshot(...)`
- Pure diagnostics builder: `buildFxFoundationDiagnostics(...)`
- Hook bridge: `useFxFoundationDiagnostics(...)`

## 3) Runtime snapshot fields
`FxFoundationRuntimeSnapshot` reports:
- `localStageCount`
- `globalStageCount`
- `ambientMountCount`
- `heroMountCount`
- `animatedMountCount`
- `staticFallbackCount`
- `offMountCount`
- `portalRootPresent`

## 4) Diagnostics summary fields
`FxFoundationDiagnostics` reports:
- `resolvedQuality`
- `renderMode`
- `reducedMotion`
- `activeSceneCount`
- `fallbackMode`
- `reducedMotionClampActive`
- `portalRootPresent`
- `warnings`
- `notes`

## 5) Fallback mode meanings
- `none`: only animated mounts are active
- `static`: only static fallback mounts are active
- `off`: no animated or static mounts are active
- `mixed`: animated and static mounts are both active

## 6) Reduced-motion clamp meaning
`reducedMotionClampActive` is true when reduced motion is enabled and foundation output is clamped via atmosphere and/or hero animation restrictions.

## 7) Warning meanings
Current warning codes:
- `orphaned-global-portal-root`
- `animated-mounts-while-off`
- `animated-mounts-under-reduced-motion`
- `mixed-fallback-state`
- `multiple-hero-mounts`
- `high-foundation-scene-count`

Warnings are factual QA signals, not runtime errors.

## 8) How later packets should use diagnostics during QA
- Capture snapshot + diagnostics during smoke tests for each new scenic mount.
- Confirm fallback mode and active scene counts match packet intent.
- Review warning codes and explain any intentional non-default states in PR notes.

## 9) Explicit non-goal
A.10 does **not** add a live on-screen debug panel.
