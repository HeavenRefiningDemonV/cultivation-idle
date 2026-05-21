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

## Dao Mandate V2 implementation guardrails
Cultivation Idle is implementing Dao Mandate V2. The current raw Dao Mandate / Run Compass engine may remain internally rich, but default player-facing UI must become sparse, omen/proof/reflection based, and non-prescriptive.

### Core direction
- Keep `DaoMandateSurfaceV1` / Run Compass style resolvers as internal truth where useful.
- Do not render the raw resolver directly as default player UI.
- Future public guidance should consume a sparse Omen Projection: one current omen, 2-4 proof seals, a few pressure badges, meaningful recent omens/reflections, and closed source threads.
- Status must recover the old readable layout language: identity hero, metric strip, six-card diagnostic grid. Do not replace Status with a large Mandate Chamber dashboard.
- Gate Trial owns full readiness, fail-safe details, failure diagnosis, and route-rich correction.
- Local modules are quiet when irrelevant. Quiet relation renders no Mandate banner.
- Prestige owns reincarnation/AP/reset/carry truth and should not show unrelated live-run route ribbons.

### Forbidden reachable default UI
Do not add or preserve these as default reachable UI in future Dao Mandate V2 packets:

- `MandateChamberHero` in default Status.
- full `RequirementLedger`, `ReadinessLedger`, or `SourceRouteSlip` in default Status.
- public strategy profiles named Guidance Oath / Sealed / Elder / Jade.
- public Status labels such as `Primary Route`, `Best Next Action`, `Biggest Shortfall`, or peer `Run Compass` guide labels.
- local copy such as `Mandate points elsewhere`.
- default Status route commands for ordinary pressure states, including `Open Apothecary`, `Open Forge`, `Tune Techniques`, `Raise Forge Floor`, or `Cultivate Qi`.

### Direct-route policy
Direct routes are allowed only when one of these is true:

- setup repair: missing path, Heart Law, or other life anchor;
- hard proof lock: the player needs to inspect legal gate/proof state;
- repeated failure reflection: repeated evidence shows a correction route is needed;
- safety net / mercy proof available or progressing;
- breakthrough ready;
- reincarnation/cap handoff;
- the player explicitly opened an inspect/source/detail drawer.

For ordinary medicine reserve, gear floor, doctrine/loadout, material drought, or support reserve pressure, default Status should describe the symptom and proof, not command a room route.

### Architecture and ownership rules
- UI components are pure renderers unless explicitly documented otherwise.
- Do not let render components grant rewards, spend currency, resolve combat, record failures, perform breakthrough, reset prestige, or mutate progression.
- Gameplay owners remain `ActivityStore`, `CombatStore`, `RewardService`, `TrialStore`, progression runtime, prestige/reset services, and content contracts.
- Preserve existing scenic/base art and working layout foundations. Additive enhancement beats destructive replacement.
- Every behavior change needs tests. Every visual cutover needs screenshot evidence.
- If broad tests are already red, document exact failures and separate pre-existing failures from packet-specific regressions.

### Copy tone
Use cultivation-world evidence language: omen, proof, seal, reserve, reflection, gate pressure, mercy proof, decree, elixir, ruins, manual, doctrine.

Default copy should answer: what wall is appearing, what proof confirms it, and what changed. It should not solve the player's build on the first layer.

## Review guidelines for Dao Mandate V2 PRs
When reviewing Dao Mandate V2 changes, treat these as high-priority issues:

- Default Status renders raw route-led components or full ledgers.
- UI components mutate gameplay, rewards, combat, trial, prestige, or progression state.
- Public UI exposes Guidance Oath / Sealed / Elder / Jade as strategy levels.
- Default Status gives direct room commands for ordinary prep pressure.
- Local quiet screens display "Mandate points elsewhere" style copy.
- Prestige displays unrelated live-run route context while too early for reincarnation.
- V2 changes remove existing scenic/base art or useful layout foundations without a complete replacement.
- States rely on color only, hover-only truth, or motion-only meaning.
- A behavior change lands without tests or a visual cutover lands without screenshot evidence.
