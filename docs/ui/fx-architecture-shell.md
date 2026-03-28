# Packet A.2 — Top-Level FX Architecture Shell

## Purpose
Packet A.2 establishes a shared, typed FX scaffold under `src/ui/fx/` so later packets can add screen FX without duplicating renderer lifecycle, quality resolution, or portal/layer semantics.

This packet does **not** mount FX anywhere in the active app shell.

## File responsibility map

| File | Responsibility |
| --- | --- |
| `src/ui/fx/fxLayerContract.ts` | Semantic FX layer tiers, numeric ordering helpers, and portal root id constants. |
| `src/ui/fx/fxQualityContract.ts` | Pure quality resolver contract with A.2 conservative behavior rules. |
| `src/ui/fx/FxQualityProvider.tsx` | React context provider wrapper around the pure quality contract. |
| `src/ui/fx/ScreenFxStage.tsx` + `.scss` | Local absolute-fill, pointer-inert DOM shell for screen-scoped FX. |
| `src/ui/fx/FxStagePortal.tsx` + `.scss` | Optional portal stage that lazily creates a shared root under `document.body`. |
| `src/ui/fx/pixi/PixiUiStage.tsx` | Thin Pixi bridge wrapper; no gameplay or scene coupling. |
| `src/ui/fx/pixi/hooks/useFxQuality.ts` | Thin consumer hook for quality context. |
| `src/ui/fx/pixi/hooks/useScreenFxState.ts` | Generic normalized screen FX state seam for future packets. |
| `src/ui/fx/index.ts` + `src/ui/fx/pixi/index.ts` | Barrel exports for downstream packet adoption. |
| `src/ui/fx/pixi/scenes/README.md` | Planned scene families only. |
| `src/ui/fx/pixi/emitters/README.md` | Planned shared emitter families only. |

## Semantic layer tiers (A.2)
- `backdrop`
- `ambient`
- `heroUnderlay`
- `heroOverlay`

Design intent:
- Semantic-first contract.
- Conservative numeric mapping only (not final app-wide layering policy).
- Keep FX below higher app overlay surfaces (notifications/onboarding/city-arrival/bottom-nav/modals).

## Quality contract summary
A.2 quality contract defines:
- Requested: `auto | high | medium | low`
- Resolved: `off | low | medium | high`
- Render mode: `off | static | full`

A.2 behavior:
- `enabled = false` => `renderMode: off`.
- atmosphere + hero both disabled => `renderMode: off`.
- reduced motion forces conservative behavior and suppresses continuous atmosphere.
- `auto` resolves to `medium` for now.
- `low` remains static/non-continuous.

## Portal root policy
- Portal root id is centralized in the layer contract.
- Root is created lazily only when `FxStagePortal` is rendered.
- If `FxStagePortal` created the root and it becomes empty, cleanup removes it.
- No app-shell integration is done in A.2.

## Source-boundary rules
- No imports from `src/ui/fx/**` are added in app/screen entry surfaces in A.2.
- No `src/ui/fx/**` module imports stores, screens, modals, services, or content.
- Only packet contract tests inspect this scaffold directly during A.2.

## Explicit non-goals
- No screen redesign.
- No settings bridge.
- No runtime mounting in `App`/`GameLayout`.
- No final layering-policy migration.
- No production FX scenes/emitter configs.
- No art production.

## Handoff notes
- **A.3:** Feed real settings values into `FxQualityProvider` without changing its external shape.
- **A.4:** Finalize global z-layer policy and reconcile with overlay bands.
- **A.7:** Integrate stage/provider usage into app shell and targeted screens.


## A.3 settings bridge update
- `uiFx` settings now live in UI store with bounded localStorage persistence.
- Quality resolution now includes reason flags and deterministic DPR cap policy.
- `FxQualityProvider` remains store-agnostic; app/store coupling is isolated to `src/app/fx/useUiFxSettings.ts`.
- Reduced motion remains authoritative and clamps continuous behavior.

A.3 still does **not** mount provider/runtime stages in `App` or `GameLayout`.

## A.5 boundary primitive update
- `ScreenFxStage` is now the canonical declarative stage API (`scene`, `role`, `qualityFloor`, `portalTarget`, `containToParent`).
- New primitives under `src/ui/fx/primitives/**` own scenic backdrop, ambient underlay, hero slot, and safe DOM overlay mounting.
- New motion wrappers under `src/ui/fx/motion/**` centralize reduced-motion-safe selection/presence behavior.
- `useScreenFxState` is refined to normalize lightweight scene inputs only.
- Do not mount raw `PixiUiStage` in screen code unless a boundary primitive truly cannot express the use case.

## A.6 shared emitter vocabulary update
- Emitter vocabulary now exists in `src/ui/fx/pixi/emitters/**`.
- Families (`mist`, `dust`, `sparks`, `glints`, `fireflies`) are authored as typed descriptors.
- Later scenes should depend on the shared resolver/spec layer (`resolveEmitterSpec`) instead of bespoke inline particle constants.
- This packet still does **not** mount any FX in app or screen runtime surfaces.

## A.7 app-shell integration seam update
- `AppFxProviderBridge` now mounts the global FX quality provider in `App.tsx`.
- `GameLayoutFxSeam` now wraps the active screen host region in `GameLayout.tsx`.
- Lazy portal-root policy remains in effect: `FxStagePortal` root is created on-demand by first global stage usage.
- Later screen packets should not introduce a second provider; they can now focus on local scene composition only.


## A.9 asset scaffold update
- UI asset metadata scaffolding now lives under `src/assets/ui/` with typed manifests and a reuse map.
- Missing art is represented in manifests (`planned-missing` / `planned-optional`) instead of placeholder image files.
- Runtime FX code under `src/ui/fx/**` remains behavior-only and does not import from the new asset scaffold yet.
- Later scene packets should consult `src/assets/ui/registry.ts` for consistent asset IDs and handoff planning.


## A.10 foundation QA + diagnostics update
- Added diagnostics surface for runtime mount snapshots, derived fallback mode, active scene count, and reduced-motion clamp status.
- Added machine-readable compliance checklist to standardize scenic packet acceptance across ownership/quality/layering/fallback/readability rules.
- Added smoke tests for provider and primitive mount paths (off/static safe behavior) without adding new scenes or visual rollout.
- Later scenic packets should cite the A.10 compliance checklist and diagnostics warnings in their verification notes.
