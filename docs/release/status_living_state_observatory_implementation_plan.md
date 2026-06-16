# Status Living State Observatory Implementation Plan

## S0 Target Lock

S0 is the forensic guardrail and target-lock packet for the Status Living State Observatory. It adds repository evidence before any production Status renderer, CSS, surface-extension, asset, store, or gameplay work begins. S0 must leave the game visually unchanged and must make no visible UI changes.

This plan treats the generated Status mockups and the v8 Living State Observatory draft as the visual target, while the current repository remains source gameplay truth. The plan is binding for later packets but does not implement later packets.

Status is the screen where the cultivator is examined. Identity is a decree, condition is a meridian vessel, Spirit Root and Heart Law are a coupled diagnostic instrument, all 28 stats are a path-adaptive constellation, bottlenecks are causal talismans, preparation is measured with scales and jars, current work is a time wheel, and evidence lives in folded ledgers.

The required symbolic instruments are:

- Living State Observatory
- Life Decree
- Vitals Ribbon
- Root/Law Coupled Instrument
- Meridian Vessel
- Stat Meridian Constellation
- Bottleneck Talisman Canopy
- Build Scales
- Work Wheel
- Folded Ledgers

## Source Truth And Ownership

Status is a surface-driven truth screen. Gameplay stores and systems own truth; Status renders truth and routes the player to owner systems. Later visual code must consume a derived typed surface and must not recompute gameplay state in JSX.

The current Status spine must be preserved:

- `StatusScreen` owns the Status tab.
- `useStatusDashboardSurface` gathers store slices and memoizes derived Status truth.
- `buildStatusDashboardSurface` produces dashboard truth from source systems.
- `StatusLedgerSurfaceV1` preserves the current Status source truth.
- `StatusLedgerPage` is the public renderer entry until a later accepted cutover.
- `performStatusLedgerAction` owns Status route action execution.
- `SpiritRootObservationDrawer` remains Status-owned and remains reachable through Status.

Source-truth boundaries:

- `ActivityStore gate` enforces one foreground activity.
- `CombatStore owns combat`; Status UI must not start hidden resolution logic, resolve fights, or write combat outcomes.
- `RewardService owns rewards`; Status UI must not grant currencies, items, manuals, fragments, comprehension, or gate proof.
- `PrestigeResetService owns reset truth`; Status UI must not invent reset previews or mutate prestige state.
- `content packs are source truth`; Status UI must not satisfy missing data with placeholder content.
- Status visual components must not mutate gameplay, stores, rewards, combat, trial, prestige, progression, offline progress, city state, cultivation state, or counters.

## No-Loss Data Contract

The Observatory may change geometry later, but it must preserve all current Status facts, actions, route targets, details, Spirit Root Observation content, calculation evidence, Recent Changes, How Calculated rows, current work facts, build/prep facts, and existing public test anchors.

Every source family must remain represented in the future Observatory:

| Source family | Must preserve | Future Observatory home |
| --- | --- | --- |
| Hero identity | Realm, stage, city, path, Heart Law, Spirit Root, focus, breath, next goal, main bottleneck, primary action | Life Decree plus Root/Law pair |
| Metrics | Qi, Qi/s, stability, HP, combat strength, attack, defense, crit, foreground, optional mind alignment | Vitals Ribbon |
| Current State | Cultivation Body, Dao Heart, Spirit Root, Training Foundation, Build/Prep, Active Work, shared causes, buff/debuff rows, next bottleneck | Meridian Vessel with focus lens |
| Milestone | Milestone nodes, readiness, next goal, gaps, gate lifecycle, city handoff | Life Decree edge thread and Bottleneck Talisman Canopy |
| Cultivation Base | Qi cap, rate, breakthrough state, stability, focus, breath, Heart Law chapter, current activity | Dantian organ lens |
| Mission Requirements | Requirement rows, kind, gap, priority, source module, action, disabled reason | Requirement talismans |
| Best Improvements | Primary action plus up to three secondary improvements | Route charms and improvement seals |
| Safety Net | Fail-safe, healing, pouch, reserve, risk, protection state | Safety seal and reserve jars |
| Identity & Doctrine | Path, Heart Law, focus, breath, city, Spirit Root element/grade/resonance | Root/Law Coupled Instrument |
| Build & Preparation | Loadout, weapon, armor, technique fit, medicine, forge, reserve, route readiness | Build Scales |
| Current Work | Foreground activity, queues, combat, tracked bounty, expeditions, craft/study work | Work Wheel |
| Details | How Calculated rows, sources, evidence, disabled reasons, exact row evidence | Folded Ledgers |
| Recent Changes | Deltas, return evidence, current changes, past action evidence | Folded Ledgers |

All 28 stats must be represented in the later Stat Meridian Constellation. Off-path, dormant, weak, or unavailable stats must remain visible as grey, lifeless, locked, or socket states rather than being hidden.

## Public Anchors

Later packets must preserve current public anchors or provide compatibility wrappers while tests migrate. Required anchors include:

- `status-ledger-root`
- `status-ledger-hero`
- `status-ledger-metrics`
- `status-ledger-grid`
- `status-current-state`
- `status-ledger-details`
- `status-ledger-recent-changes`
- `status-ledger-card-mission-requirements`
- `status-ledger-card-cultivation-base`
- `status-ledger-card-current-work`
- `status-ledger-card-build-preparation`

## Forbidden Regressions

Future work must not relapse into:

- card-grid relapse
- stats as rows/columns
- bottleneck as a vertical list
- six organ cards
- hidden off-path stats
- visual art without data
- store reads in visual components
- gameplay mutation from Status UI
- color-only state language
- hover-only truth
- motion-only meaning
- no-loss evidence replaced by mood art
- broad public doctrine or omen label relapse
- no destructive art/UI cutover
- destructive art/UI cutover
- public anchor loss

The Observatory must not turn the default Status screen into a table, row list, compact grid, equal stat rail, ordinary dashboard, scenic poster without current facts, or a second owner of gameplay calculations.

## Non-Destructive Rollout Doctrine

Use preserve-first, enhance-first, new-art-last, current-build-is-truth, four-layer model, no cutover without completion, no layout shift, no future-art excuse, and code-first sequencing.

No old art layer, useful chrome, public anchor, or diagnostic source may be removed until the new integrated replacement is visible, wired, stable, screenshot-accepted, and test-protected. Any later cutover must keep exact facts one deterministic click away from the default Status page.

## Accessibility, Responsive, And Performance Guardrails

Every route action, drawer toggle, organ seal, stat bead, talisman, and ledger fold must be keyboard reachable. Instruments require accessible labels. Reduced motion must collapse glows and pulses to static state. Color cannot be the only state indicator.

Desktop target is 2048x1152 and 16:9. Smaller widths must stack semantically without fact disappearance. Focus lenses and inspectors must occupy reserved zones or overlays and must not move core instruments. Hover, selection, loading, and dynamic labels must not resize the core layout.

## S0 Scope

S0 may touch only:

- `docs/release/status_living_state_observatory_implementation_plan.md`
- `tests/contracts/statusObservatoryTargetContract.test.ts`

S0 must not change production UI files, CSS/SCSS, stores, content JSON, image assets, route behavior, Status renderers, Status surface extensions, screenshots, generated art, gameplay systems, gate/trial logic, combat, rewards, prestige, offline progress, city progression, cultivation behavior, or test expectations outside this S0 target contract.

## Future Packet Roadmap

| Packet | Name | Goal |
| --- | --- | --- |
| S0 | Forensic audit and guardrail packet | No visible change. Add docs/tests that lock mockup interpretation, file ownership, no-loss, and no destructive cutover. |
| S1 | Surface extension and no-loss adapter | Add named stats source data, `StatusObservatorySurfaceV1` types/builder, no-loss mapping, and route references. No visible change. |
| S2 | Renderer shell behind safe cutover | Add observatory components and root layout behind safe cutover while preserving anchors. |
| S3 | Life Decree and Vitals Ribbon | Implement the top decree and vitals while preserving `status-ledger-hero` and `status-ledger-metrics`. |
| S4 | Root/Law Coupled Instrument | Implement astrolabe, Heart Law seal, fit bridge, doctrine shelf, and observation route. |
| S5 | Meridian Vessel and Focus Lens | Replace Current State card geometry with body vessel, six organ seals, focus lens, and shared cause stamps. |
| S6 | Stat Meridian Constellation | Render all 28 stats as SVG nodes, branch geometry, selected bead lens, and weak-link thread. |
| S7 | Bottleneck Talisman Canopy and Inspector | Render edict, talismans, route charms, safety seal, causal threads, and inspector. |
| S8 | Build Scales, Work Wheel, and Folded Ledgers | Render support instruments and exact drawers. |
| S9 | State variants | Cover healthy, blocked, post-failure, prestige pressure, content cap, fixture, and live states. |
| S10 | Responsive, accessibility, reduced motion, screenshots | Complete QA hardening, Playwright captures, visual evidence, no-layout-shift checks, and no-emoji checks. |
| S11 | Final cutover and cleanup | Remove obsolete card-grid rendering only after evidence passes; preserve compatibility anchors as needed. |

## Later Final Acceptance

The final Observatory is not delivered by S0. Later final acceptance requires:

- Public Status tab renders the Living State Observatory.
- Life Decree replaces old hero geometry while preserving `status-ledger-hero`.
- Vitals Ribbon replaces old metrics geometry while preserving `status-ledger-metrics`.
- Spirit Root and Heart Law become the Root/Law Coupled Instrument with explicit fit bridge.
- Current State becomes Meridian Vessel with six organ seals and one focus lens while preserving `status-current-state`.
- All 28 stats render as the Stat Meridian Constellation rather than rows or columns.
- Bottlenecks render as the Bottleneck Talisman Canopy with central edict, orbiting slips, route charms, safety seal, and causal threads.
- Build/prep renders as Build Scales and reserve jars.
- Current work renders as the Work Wheel.
- Recent Changes and How Calculated render as Folded Ledgers and exact drawers.
- `SpiritRootObservationDrawer` remains Status-owned.
- Dao Heart Sanctuary route still opens through the Status route adapter.
- Existing Status facts, rows, actions, details, recent changes, and source evidence remain represented.
- No gameplay mutation lives in Status visual components.
- Typecheck, icon check, contract tests, build, screenshot evidence, and release evidence pass by final cutover.

## Failure Modes And Prevention

| Failure mode | How it appears | Prevention |
| --- | --- | --- |
| Card geometry returns | Six organ cards, right-side task list, stat rows, or ordinary panels return | Contract tests, future screenshot QA, and instrument geometry |
| Table disguised as constellation | The 28 stats appear but sit in rows, columns, or equal rails | Future SVG node coordinates, branch anchors, and path state attributes |
| Bottleneck list relapse | Mission requirements become equal rows in a side card | Requirement talismans with source-family metadata |
| Art-only poster | Scenery is rich but data disappears | No-loss mapping to default symbols plus exact lens/drawer access |
| Component clutter | Meridian Vessel becomes six full cards plus paragraphs | One value, one state, one route glyph per organ; exact rows in focus lens |
| State color-only meaning | Stable, warning, and danger differ only by hue | Shape language: crack, knot, stamp, lock, fill, and line quality |
| Destructive cutover | Useful old surfaces are removed before replacement acceptance | Preserve-first rule and no cutover without completion |
| Adjacent bug chase | S0 tries to fix gate, reset, progression, or economy issues | S0 remains docs/tests only |

## S0 Acceptance Checklist

- Plan exists at `docs/release/status_living_state_observatory_implementation_plan.md`.
- Contract test exists at `tests/contracts/statusObservatoryTargetContract.test.ts`.
- Contract test reads this plan.
- Instrument names are locked.
- Forbidden regressions are locked.
- No-loss and all 28 stats are locked.
- Ownership and route boundaries are locked.
- Public anchors are locked.
- Valid Dao Heart content is not banned.
- Legacy public omen labels are not reintroduced.
- No visible UI changes occurred.
- S1 or later work was not started.
