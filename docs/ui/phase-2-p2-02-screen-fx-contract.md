# P2-02 — Screen FX stage, portal, and Pixi scene contract

## Objective

Freeze the shell-level atmospheric FX contract so Phase 2 has one legal screen wrapper path, one DOM/CSS portal path, and one Pixi mount path without changing screen ownership or readable DOM truth.

## Why now

P2-01 hardened provider/registry quality semantics. P2-02 now hardens the shell mount contract (`ScreenFxStage`, `FxStagePortal`, `PixiUiStage`) before any broader atmosphere rollout.

## Dependency chain

- `docs/ui/phase-2-packet-register.md`
- `docs/ui/phase-2-p2-01-runtime-split.md`
- `docs/ui/renderer-stack-foundation.md`
- `docs/ui/phase-1-phase2-handoff.md`
- `docs/ui/phase-1-exit-audit.md`
- `docs/ui/section-a-cutover-gate.md`
- `docs/ui/section-a-screenshot-approval-workflow.md`
- `docs/ui/section-a-touchpoint-registry.md`

## Git basis (verified)

- Branch: `work`
- Short commit at packet start: `4205cd7`
- Detached HEAD: `no`

## Current repo truth summary

- `CultivateScreen` and `StatusScreen` already use `ScreenFxStage` + `FxStagePortal` + `buildFxSceneContract` with DOM/CSS atmosphere scenes.
- `PixiUiStage` is still the only legal `@pixi/react` `Application` wrapper.
- `WorldFxScene`, `ForgeFxScene`, `SelectionFxScene` remain valid no-asset stubs (`null` return).
- No support-art FX binaries are assumed.

## Frozen legal shell-level FX path matrix

1. **Screen-level wrapper (required):** `ScreenFxStage`
2. **DOM/CSS atmosphere mount (required path):** `FxStagePortal`
3. **Pixi atmosphere mount (required path):** `PixiUiStage`
4. **Illegal paths:**
   - direct `@pixi/react` `Application` in screen files
   - ad-hoc portal mounting from screens
   - readable gameplay truth in FX host layer
   - screen-specific re-invention of stage/layer/content shell semantics

## ScreenFxStage contract

- Always renders canonical root + stage layer + content layer.
- Custom class names are additive and do not replace base contract classes.
- Disabled mode preserves wrapper semantics but suppresses visible FX layer host output.
- Stage/content z-index order is normalized so content remains above atmospheric layer.
- Invalid caller z-order is corrected with low-noise dev-only warning (once per instance).

## FxStagePortal contract

- Mounts atmospheric DOM/CSS content only when stage host policy is mountable.
- Returns `null` gracefully for missing snapshot, missing host, disconnected host, dormant stage, or host-not-ready states.
- Dev warning remains once-only for missing-host misuse (`missingSnapshot`) and stays quiet for normal dormant/not-ready suppression.

## PixiUiStage contract

- Remains the only legal wrapper that mounts `@pixi/react` `Application`.
- Uses provider ownership (`claimActiveScene` / `releaseActiveScene`) and shell mount policy.
- Returns `null` gracefully for missing/invalid host states, dormant states, no scene, disallowed scene-kind-for-stage, and static/no-children no-op cases.
- Never owns readable truth; rendered surface is pointer-events safe and subordinate to DOM content.

## Stage/layer/content semantics

- Stage host lives in `.screenFxStage__layer` and is atmospheric-only.
- Readable truth remains in `.screenFxStage__content` and is z-ordered above stage host.
- Stage host remains non-interactive (`pointer-events: none`, `aria-hidden`).

## Dormant / not-ready / no-asset behavior

- Dormant/not-ready states are legal and expected in shell startup and toggles.
- Portal/Pixi wrappers suppress mount quietly in those states.
- No-asset/null-scene states are legal and do not imply runtime errors.

## Canonical stage IDs and allowed scene kinds

Canonical stage ids:
- `selection`, `cultivation`, `status`, `world`, `forge`

Allowed shell scene kinds are constrained by stage:
- `selection`: `selection` or `generic`
- `cultivation`: `cultivation` or `generic`
- `status`: `status` or `generic`
- `world`: `world` or `generic`
- `forge`: `forge` or `generic`

Unknown stage ids may only use `generic` at shell-level contract.

## Proof surfaces

- `src/components/screens/CultivateScreen.tsx`
- `src/components/screens/StatusScreen.tsx`

No composition redesign is part of this packet.

## Non-goals

- No screen redesign.
- No shell primitive work.
- No token or motion normalization work.
- No support-art binary assumptions.
- No world/forge/selection rollout.

## QA / verification commands

- `npm run typecheck`
- `npm run build`
- `npm run test:contracts`
- targeted packet contracts may be run directly when full suite is too heavy

## Manual QA checklist

1. Cultivation still renders with atmosphere at normal quality.
2. Status still renders with atmosphere at normal quality.
3. Existing quality toggles in audit harnesses still work.
4. Reduced-motion path remains coherent.
5. Missing/stub scenes stay quiet (no crash/spam).
6. DOM truth remains above atmosphere and clickable.
7. No screen imports `@pixi/react` directly.
8. Packet works without FX support-art binaries.

## Acceptance gate

P2-02 is complete when:

1. `ScreenFxStage` / `FxStagePortal` / `PixiUiStage` are the frozen shell-level FX path.
2. DOM-above-FX layering is contract-enforced.
3. Portal and Pixi mount suppression is graceful for missing/dormant/not-ready/no-asset states.
4. Stage-id and scene-kind legality is documented and test-guarded.
5. Proof surfaces remain composition-stable.
