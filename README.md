# Cultivation Idle

Idle-first cultivation and auto-combat prototype with a unified city hub. Players manage cultivation, professions, expeditions, and gear while automated encounters resolve from build decisions.

## Getting started

1. Install dependencies:
   - `npm install`
2. Start the development server:
   - `npm run dev`

## Core quality checks

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`
- Preview build: `npm run preview`

## Architecture guardrails

- Only one foreground activity runs at a time through the `ActivityStore` gate.
- Combat simulation and resolution live in `CombatStore`.
- Rewards are granted through `RewardService.grantRewards(bundle, reason)`.
- Offline progress applies to cultivation, queued actions, and expeditions, but not combat.
- Content packs are the source of truth and cross-references should be validated.
