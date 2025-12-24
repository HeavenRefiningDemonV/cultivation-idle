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
