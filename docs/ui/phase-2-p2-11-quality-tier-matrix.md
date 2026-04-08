# P2-11 — Quality-tier, reduced-motion, and screen-budget enforcement

## Objective

Make the existing FX quality model enforceable and auditable across current proof surfaces without adding art dependencies, scene-family rollout, or screen redesign.

## Why now

- The repo already contains `FX_SCENE_BUDGETS` with four tiers, but some consumers still branch only on raw quality strings.
- Audit harnesses previously treated reduced mode as mostly a body-class shim.
- Reduced-motion authority needed a bounded provider-level override path for truthful QA and contract testing.

## Dependency chain

- `docs/ui/phase-2-p2-01-runtime-split.md`
- `docs/ui/phase-2-p2-02-screen-fx-contract.md`
- `docs/ui/phase-2-p2-04-token-sheet.md`
- `docs/ui/phase-2-proof-surface-register.md`
- `docs/ui/phase-2-touchpoint-registry.md`
- fallback doctrine where needed: `docs/ui/renderer-stack-foundation.md`, `docs/ui/section-a-global-doctrine.md`

## Current repo truth (P2-11 basis)

- `FX_SCENE_BUDGETS` is the single mechanical budget authority (`high`, `medium`, `low`, `reducedMotion`).
- Live stage-backed proof surfaces are still `cultivation` and `status`.
- `world`, `forge`, and `selection` scene files remain intentional null outputs.
- Audit harnesses are dev-only and drive query-param capture flows.

## Canonical quality-tier matrix (authoritative)

| Tier | sceneMode | continuousAtmosphere | allowBurstAtmosphere | allowHeroPulse | allowGlints | allowFilters | maxDpr | particleDensity | tickScale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| high | full | full | true | true | true | true | 2 | 1 | 1 |
| medium | minimal | sparse | true | true | true | false | 1.5 | 0.6 | 0.88 |
| low | minimal | off | true | false | true | false | 1 | 0.25 | 0.7 |
| reducedMotion | static | off | false | false | false | false | 1 | 0 | 0 |

Policy lock: this table is sourced from `FX_SCENE_BUDGETS`; docs and tests must treat it as the one canonical matrix.

## Screen-family budget matrix

- **Scene-backed proof surfaces**
  - `cultivation` → budget-enforced DOM scene (`CultivationFxScene`) with budget-gated mist/glints/pulse and dormant-safe static fallback.
  - `status` → budget-enforced DOM scene (`StatusFxScene`) with calmer envelope and budget-gated mist/glints/pulse.
- **Static-safe/null-scene proof surfaces**
  - `world` → static-safe shell proof surface with intentional null scene.
  - `forge` → static-safe shell proof surface with intentional null scene.
  - `selection` → legal stage/scene kind but currently intentional null stub.

## Proof-surface classification (code-level lock)

`FX_PROOF_SURFACE_POLICIES` is introduced as explicit classification truth:

- `cultivation`: `scene-backed`
- `status`: `scene-backed`
- `world`: `static-safe-null-scene`
- `forge`: `static-safe-null-scene`
- `selection`: `legal-null-scene-stub`

## Reduced-motion authority and override rule

- Reduced-motion truth now resolves through a tri-state override contract:
  - `null` → follow system media query
  - `true` → force reduced motion
  - `false` → force non-reduced (audit/testing)
- `effectiveQuality` resolves from requested quality plus this reduced-motion authority path.
- This override is dev/test-facing and exposed through:
  - `FxQualityProvider` context API
  - `window.__ciFxDebug` helper hooks
  - audit harness mode mapping

## Dormant / document-hidden policy

- Dormant state is authoritative for:
  - `document.hidden`
  - host disconnected/unready/undersized conditions
- Scene contracts must treat dormant as static-safe:
  - no continuous atmosphere
  - no meaningful long-running ambient animation
- Pixi/null-scene surfaces remain legal and unchanged.

## Harness query/mode rules

Query shape remains `?uiAudit=<family>&surface=<id>&fx=<mode>[&slot=<slot>]`.

`fx` modes are now:

- `high` → requested `high`, reduced override `false`
- `medium` → requested `medium`, reduced override `false`
- `low` → requested `low`, reduced override `false`
- `reduced` → requested `medium`, reduced override `true`

Compatibility note: `uiAuditReducedMotion` body class may remain as a last-mile CSS clamp for non-provider animation edges, but it is not the source of reduced-motion truth.

## Preserve / enhance / defer summary

- **Preserve:** cultivation richer-than-status ordering; world/forge readability without atmosphere dependency; no atlas requirement.
- **Enhance now:** quality-tier enforcement, reduced-motion authority, harness truthfulness, budget-aware DOM scene gating, dormant semantics.
- **Defer:** world/forge ambient art rollout, cross-screen motion normalization, no-layout-shift packet expansion, new scene family rollout.

## Non-goals

- No new art requests or atlas dependencies.
- No world/forge full scene rollout.
- No user-facing quality settings UI.
- No broad screen redesign.

## Manual QA script

1. Visit Phase-0 harness routes for each surface with `fx=high|medium|low|reduced`.
2. Confirm reduced mode yields provider-level `effectiveQuality = reducedMotion`.
3. Confirm high/medium/low can force non-reduced behavior regardless of OS reduced-motion setting.
4. Verify cultivation remains richest, status remains calmer, and low/reduced stay readable.
5. Verify world/forge remain explicit static-safe/null-scene outputs.
6. Background tab and return; confirm dormant semantics stop continuous atmosphere and recover cleanly.

## Acceptance gate

P2-11 is complete when:

1. Four-tier quality contract is explicit in constants, runtime, docs, and tests.
2. Provider-level reduced-motion override path exists and is auditable.
3. Both audit harnesses expose `high|medium|low|reduced` with truthful mappings.
4. Cultivation/Status scenes honor budget + dormant contract fields (`budget`, `isStatic`, `canAnimateContinuously`, `dormant`).
5. World/Forge/Selection remain intentional null/static-safe outputs.
6. Contract suite and core validation commands pass (`typecheck`, `build`, `test:contracts`).
