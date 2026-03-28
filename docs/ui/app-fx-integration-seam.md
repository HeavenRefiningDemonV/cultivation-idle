# Packet A.7 — App FX Integration Seam

## Purpose
A.7 mounts the existing FX foundation into the live app shell with zero visual FX rollout so later screen packets only need local screen code.

## Boot path summary
`main.tsx -> App.tsx -> AppFxProviderBridge -> ContentInitGate -> GameLayout -> GameLayoutFxSeam`

## Why provider bridge is mounted in App
- Ensures one global FX quality context for loading, error, and initialized game surfaces.
- Avoids provider duplication across screens/modals.
- Keeps App-level integration explicit and low-risk.

## Why provider remains store-agnostic
- `FxQualityProvider` still accepts plain props.
- Zustand coupling remains isolated to `useUiFxSettings()` and `AppFxProviderBridge`.

## Why GameLayout gets a seam wrapper
- Establishes a stable shell host (`data-ui-fx-seam="screen-host"`) for future screen packet mounts.
- Keeps GameLayout readable and avoids embedding FX seam logic directly into core rendering blocks.

## Global portal policy choice
- **Chosen:** Option 1, lazy portal root policy.
- `FxStagePortal` root remains lazily created only when a future screen first requests a global stage.
- A.7 intentionally does not mount an inert portal root.

## Handoff
- Later screen packets can now consume `useFxQuality`, boundary primitives, and shared emitters.
- A.7 intentionally stops before mounting any actual scene content.
