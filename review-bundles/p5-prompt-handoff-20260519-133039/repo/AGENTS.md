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
