# P2-01 — FX quality provider and stage-registry hardening

## Objective

Harden the Phase 2 FX substrate so quality resolution, stage lifecycle, and active-scene ownership are deterministic and reusable without changing live screen composition.

## Why now

P2-01 is the runtime-split foundation packet. Later packets (including shell and broader FX rollout packets) depend on a stable provider/registry contract before adding new consumers.

## Dependencies (carried doctrine)

- `docs/ui/renderer-stack-foundation.md`
- `docs/ui/phase-1-phase2-handoff.md`
- `docs/ui/phase-1-exit-audit.md`
- `docs/ui/phase-1-asset-packaging-ledger.md`
- `docs/ui/section-a-cutover-gate.md`
- `docs/ui/section-a-touchpoint-registry.md`
- `docs/ui/section-a-screenshot-approval-workflow.md`

## Exact file touchpoints

Primary:
- `src/ui/fx/FxQualityProvider.tsx`
- `src/ui/fx/types.ts`
- `src/ui/fx/constants.ts`
- `src/ui/fx/runtime.ts`

Added helper:
- `src/ui/fx/stageRegistry.ts`

Contract tests:
- `tests/contracts/fxQualityResolutionContract.test.ts`
- `tests/contracts/fxStageRegistryContract.test.ts`
- `tests/contracts/fxDormantStageContract.test.ts`

Packet doc:
- `docs/ui/phase-2-p2-01-runtime-split.md`

## Current repo truth preserved

- `FxQualityProvider` remains the single quality authority consumed via `useFxQuality`.
- `GameLayout` still provides the FX context.
- `CultivateScreen` and `StatusScreen` still use `ScreenFxStage` + `FxStagePortal` + scene-contract path.
- `LifeStartWizardModal` and `DaoHeartModal` still consume provider quality.
- No screen composition or shell/art work is part of this packet.

## Frozen public API surface

Provider API (unchanged in shape, hardened in behavior):
- `registerStage(input) => token`
- `updateStage(input) => void`
- `unregisterStage(input) => void`
- `getStageSnapshot(stageId) => snapshot | null`
- `claimActiveScene(input) => boolean`
- `releaseActiveScene(input) => void`
- `getActiveSceneOwner(stageId) => sceneKey | null`
- `requestedQuality`, `effectiveQuality`, `prefersReducedMotion`, `setRequestedQuality`

Type hardening:
- Canonical `FxStageId` derives from `FX_STAGE_IDS`.
- `isFxStageId(value)` provides a narrow guard.
- `FxStageKey` keeps backward compatibility while documenting canonical IDs.
- `FxSceneOwnerKey` documents owner semantics as one owner per stage.

## Dormant-stage semantics

Dormancy is explicit and centralized:

- `hostReady` requires connected host + minimum bounds.
- Stage snapshots may remain registered even when unready.
- `dormant` is true when `document.hidden` is true or `hostReady` is false.
- Scene contracts treat dormant stages as static and disable continuous atmosphere.

## Reduced-motion rule

Reduced motion is the unconditional winner:
- `resolveFxEffectiveQuality(requested, true)` always resolves to `reducedMotion`.
- Requested tier is only considered when reduced motion is not active.

## Duplicate-registration / scene-ownership rule

- Duplicate stage registration remains allowed (latest registration replaces previous), with dev-only warning once per stage id.
- Active-scene ownership is one-owner-per-stage.
- Duplicate owner claims on the same stage are blocked deterministically.
- Duplicate-owner warning remains dev-only and non-spammy (warn-once per stage id).

## Preserve / enhance / defer

### Preserve
- Existing live consumers and composition flow.
- Existing provider API shape.

### Enhance
- Deterministic internal registry behavior using pure helper module.
- Explicit stage-id and owner-key type semantics.
- Testable dormant/readiness semantics.

### Defer
- `ScreenFxStage`, `FxStagePortal`, `PixiUiStage` redesign.
- New stage rollout on world/forge/selection.
- Any shell, art, or screen-theming work.

## Explicit non-goals

- No screen redesign.
- No shell restyling.
- No art generation or packaging assumptions.
- No cutover/cleanup authority.

## QA commands

- `npm run typecheck`
- `npm run build`
- `npm run test:contracts -- fx`

## Manual QA checklist

1. App mounts with `GameLayout` wrapped in `FxQualityProvider`.
2. Cultivation screen still renders via existing `ScreenFxStage` + scene-contract path.
3. Status screen still renders via existing `ScreenFxStage` + scene-contract path.
4. `LifeStartWizardModal` still receives quality/reduced-motion values.
5. `DaoHeartModal` still receives quality values.
6. Duplicate stage registration warnings stay dev-only.
7. Reduced motion resolves effective tier to `reducedMotion`.
8. No screen composition changes were introduced.

## Acceptance gate

P2-01 is complete when:

1. Provider/registry API is unchanged in shape but deterministic in behavior.
2. Reduced-motion precedence is enforced by contract tests.
3. Dormant-stage semantics are explicit and contract-tested.
4. Stage ownership cannot resolve to multiple active owners on one stage.
5. No screen redesign, shell restyle, or art work is included.
