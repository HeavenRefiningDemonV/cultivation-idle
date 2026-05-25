# AGENTS

## Product summary
Cultivation Idle is an idle-first cultivation and auto-combat game centered on a unified city hub: players manage cultivation, professions, expeditions, and gear from one place while watching automated battles that showcase their build choices.

## Non-negotiable guardrails
- Only one foreground activity runs at a time, enforced centrally through the ActivityStore gate.
- Combat simulation and resolution live exclusively in CombatStore; other systems react to combat events instead of driving fights themselves.
- All rewards must flow through `RewardService.grantRewards(bundle, reason)`—no scattered inventory math.
- Offline progress applies to cultivation, queued actions, and expeditions, but never to combat.
- Content packs are the source of truth for data; cross-references must be validated.

## Tech stack assumptions
React + TypeScript + Vite with Zustand for state, Headless UI for primitives, and Framer Motion used only when it clarifies feedback.

## How to run
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Preview (after build): `npm run preview`

## Coding conventions
- Organize code by responsibility: `src/services/`, `src/stores/`, `src/content/`, `src/features/`, `src/ui/`, and `src/app/`.
- Keep TypeScript strict and prefer explicit types to implicit `any`.
- For Zustand, expose selectors and avoid components subscribing to entire stores to minimize re-renders.
- Favor small, cohesive modules over monoliths; share reusable UI primitives instead of duplicating patterns.

## Loop integration / Codex packet guardrails
- Treat progression contract, gate resolver, trial lifecycle, city progression runtime, RewardService, CombatStore, and PrestigeResetService as source-truth systems. Do not duplicate their logic in screens.
- Exact screens and feature screens should render typed surfaces. Store reads and action wiring belong in owners, controllers, or builders; pure visual components should not mutate stores.
- Reward application must remain centralized in RewardService. UI code must never grant currencies, items, manuals, fragments, comprehension, or gate proof directly.
- Combat simulation/resolution must remain centralized in CombatStore. UI may start or stop allowed flows through existing actions but must never resolve fights.
- Prestige reset truth must remain centralized in PrestigeResetService. UI preview code must read or classify reset behavior rather than inventing reset lists.
- Runtime content packs are source truth. Missing content should fail release/runtime preflight by filename; never satisfy a check with empty placeholder content.
- Every implementation packet should leave evidence: commands run, tests added or updated, changed files, unresolved blockers, and skipped checks with reasons.
- Avoid greenfield rewrites. Prefer adapters, typed surfaces, manifests, tests, and release checks over broad replacement.
- No destructive art/UI cutover: do not remove old scenic/base art or exact-screen visual ownership until a completed replacement is visible, wired, and accepted for that exact screen.

## Status V3 old-look recovery and public Dao/Omen decommission guardrails

The sparse Dao/Omen public UI rollout is superseded. The current implementation direction is Status V3: an old-look Cultivator Ledger plus public Dao/Omen/Proof/Source decommission outside internal diagnostics and compatibility code.

### Status target
- Status owns whole-life synthesis and should render as a concrete Cultivator Ledger.
- Status must recover the old Status page family: wide identity header, metric strip, three-column parchment grid, mission requirements rail, safety net, current work, build/prep cards, and limited improvement guidance.
- Status should answer who the cultivator is, what realm/stage/Qi state they are in, what path/Heart Law/spirit root/city/focus/breath define the life, what current work is running, what the next milestone is, what blocks it, and which primary improvement plus up to three secondary improvements matter.
- Future Status Ledger render targets are `status-ledger-root`, `status-ledger-hero`, `status-ledger-metrics`, `status-ledger-grid`, `status-ledger-mission-requirements`, `status-ledger-cultivation-base`, `status-ledger-current-work`, and `status-ledger-build-preparation`.

### Public Dao decommission
- Dao Mandate / Run Compass internals may remain for compatibility, internal diagnosis, migration, historical evidence, debug/specimen components, and negative tests.
- Public render paths must translate internal diagnosis into concrete game language rather than default Dao/Omen/Proof/Source/Mandate labels.
- Public non-Status screens must not render `OmenSeal`, `ProofSealRow`, `PressureBadgeRow`, `ReflectionPlaque`, `SourceThreadDrawer`, `LocalMandateLensHeader`, `ModuleSourceSinkPanel`, or broad Dao route UI as default reachable UI.
- Evidence/provenance/debug/calculation detail belongs behind `Details` / `How calculated` when exposed, not as default public labels.

### Forbidden default public UI
Do not add or preserve these as default reachable labels: `Current Omen`, `Gate Proof`, `Recent Omens`, `Source Thread`, `Proof Detail`, `Preparation Health`, `Mandate Lens`, `Module Source-Sink`, `Threshold Omen`, `Omen evidence`, `Proof sealed`, `Source sealed`, `Mandate after return`, `Dao Mandate Interface`, `Mandate points elsewhere`, `Current Mandate`, `proof source handoff`, `status snapshot only`, or `cultivation compact only`.

Do not render these as default reachable public UI components: `OmenSeal`, `ProofSealRow`, `PressureBadgeRow`, `ReflectionPlaque`, `SourceThreadDrawer`, `LocalMandateLensHeader`, `ModuleSourceSinkPanel`, `DaoMandateRouteButton`, `MandateChamberHero`, `RequirementLedger`, `ReadinessLedger`, or `SourceRouteSlip`.

### Required public language
Use concrete xianxia-compatible terms such as `Cultivation Base`, `Mission Requirements`, `Gate Readiness`, `Current Bottleneck`, `Main Gap`, `Best Improvements`, `Safety Net`, `Current Work`, `Build & Preparation`, `Identity & Doctrine`, `Recent Changes`, `Details`, `How calculated`, `Healing Reserve`, `Pouch Fit`, `Forge Floor`, `Doctrine Stock`, `Expedition Support`, `Bounty Board`, `Item Ledger`, and `Return Report`.

### Local screen ownership
- Cultivation explains cultivation: Qi, realm, stage, stability, Heart Law, breath/focus, and breakthrough readiness.
- Gate Trial explains gate readiness: minimum checklist, recommended prep, fail-safe, trial summary, readiness rail, attempt/result, and local failure diagnosis.
- World explains city services, availability, ordinary service cues, active/idle hints, and travel context.
- Forge explains forge floors, weapon/refine/temper/rune state, materials, next upgrade, and queue.
- Apothecary explains healing reserve, pouch fit, craft/buy next, and ingredients.
- Manual Pavilion and Techniques explain doctrine stock, path fit, study queue, fragments, and loadout fit.
- Bounties and Expeditions explain support economy, tracked targets, Merit reward, route slots, expected yield, and shortage fit.
- Inventory explains item purpose, source, sink, and reserved-by-goal state.
- Offline Progress explains return gains: time away, Qi, craft/expedition gains, and claim/continue.
- Settings explains ordinary preferences and accessibility; no broad `Dao Mandate Interface`.

### Preservation doctrine
- Preserve-first, enhance-first, new-art-last.
- Use parchment, ink, jade, gold, bronze, cinnabar, brushwork, seals, and existing hand-painted support assets.
- Avoid generic blue/gray dashboard panels.
- Do not remove old scenic/base art or useful layout foundation until the enhanced replacement is visible, wired, and accepted on that exact screen.
- No hover-only truth, no motion-only meaning, and no hover/selection layout shift.

### Packet order and reporting
- Mega Packet A updates guardrails, tests, audits, and docs. It does not rebuild Status visually.
- Mega Packet B creates `StatusLedgerSurfaceV1` and concrete Status Ledger rows.
- Mega Packet C rebuilds the public Status UI as the old-look Status Ledger.
- Mega Packet D removes public Dao UI outside Status and performs final QA.
- Every packet must verify previous-packet/baseline state first, avoid stale-test appeasement, and leave evidence: changed files, commands run, tests added or updated, expected future-target failures, unavailable tools/plugins, blockers, and deferred items.

## Review guidelines for Status V3 / Dao decommission PRs
When reviewing Status V3 and public Dao decommission changes, treat these as high-priority issues:

- Default Status renders sparse Omen/Proof/Source components instead of the Cultivator Ledger target.
- Public non-Status screens render `OmenSeal`, `ProofSealRow`, `SourceThreadDrawer`, `LocalMandateLensHeader`, `ModuleSourceSinkPanel`, or broad Dao route UI.
- Public UI exposes `Guidance Oath`, `Sealed`, `Elder`, or `Jade` as strategy levels.
- Public screens use old labels such as `Current Omen`, `Gate Proof`, `Source Thread`, `Mandate Lens`, `Module Source-Sink`, `Threshold Omen`, or `Dao Mandate Interface`.
- UI components mutate gameplay, rewards, combat, trial, prestige, or progression state.
- V3 changes remove existing scenic/base art or useful layout foundations without a complete replacement.
- States rely on color only, hover-only truth, or motion-only meaning.
- A behavior change lands without tests, or a visual cutover lands without screenshot evidence.
