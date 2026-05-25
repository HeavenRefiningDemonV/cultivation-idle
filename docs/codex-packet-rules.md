# Codex Packet Rules

## Packet purpose
Use a Codex packet to make one scoped, evidence-backed change without reopening unrelated gameplay, UI, or content decisions.

## Scope / non-goals
State the exact behavior or safety contract being changed. List explicit non-goals, especially UI redesign, economy rebalance, new mechanics, and content creation.

## Source-truth owners
- ActivityStore owns the one-foreground-activity gate.
- CombatStore owns combat simulation and resolution.
- RewardService owns reward grant and spend application.
- PrestigeResetService owns prestige reset orchestration.
- Progression contract, gate resolver, trial lifecycle, city progression runtime, and live realm projection own realm/gate/city truth.
- Runtime content packs under `public/cultivation_idle_content_bible_v1_config/` are content source truth.

## Expected files
List the likely files to inspect before editing. Prefer owner/controller/builder files for state and actions; keep pure visual components focused on rendering typed surfaces.

## Implementation steps
1. Inspect current source truth.
2. Add or update focused tests when behavior changes.
3. Make the smallest coherent implementation change.
4. Run targeted verification first.
5. Run broader checks when the environment supports them.
6. Record blockers and skipped checks exactly.

## Tests and commands
Name the tests to add or update and the package commands to run. If a package command is unavailable or fails before the relevant test runs, record the exact failure and use the closest direct command only as supplemental evidence.

## Acceptance criteria
Use observable conditions, not intent. Include source owner preservation, runtime behavior, test coverage, and release/reporting evidence.

## Final summary template
```md
## Summary
- Goal:
- Completed:
- Changed files:
- Commands run:
- Evidence artifacts:
- Current blockers:
- Deferred / not done:
- Risk notes:
```

## Deferred items template
```md
## Deferred
- Item:
- Why deferred:
- Owner/source truth:
- Suggested verification:
```

## Safety notes
- RewardService: keep old result fields compatible while adding richer result truth; never grant rewards directly from UI.
- CombatStore: do not resolve fights outside the combat store.
- PrestigeResetService: keep reset buckets centralized and preserve permanent prestige state.
- Content: do not create empty placeholder JSON to pass checks; missing runtime content should fail by filename.
- Exact screens: keep typed surface rendering separate from store mutation and action routing.

## Status V3 / Dao decommission packet sequence

Cultivation Idle is moving from public sparse Dao/Omen UI to Status V3 as an old-look Cultivator Ledger. Treat this as a packet sequence, not a freeform redesign.

- Packet A: guardrails, stale-test rewrites, vocabulary audit posture, and release docs. Packet A does not rebuild Status visually.
- Packet B: Status Ledger data surface, including `StatusLedgerSurfaceV1`, concrete rows, mission requirements, cultivation base, current work, build/prep, safety net, best improvements, recent changes, and details.
- Packet C: Status Ledger UI rebuild and visual proof. The public Status render path should replace sparse Omen/Proof/Source components with target IDs such as `status-ledger-root`, `status-ledger-hero`, `status-ledger-metrics`, `status-ledger-grid`, `status-ledger-mission-requirements`, `status-ledger-cultivation-base`, `status-ledger-current-work`, and `status-ledger-build-preparation`.
- Packet D: non-Status public Dao/Omen decommission and final QA across Cultivation, Gate Trial, World, World modal, exact modules, Inventory, Offline Progress, and Settings.

### Previous-packet verification
Every packet must begin by checking branch/workspace state, recent commits, prior packet markers, relevant docs, relevant source owners, and focused static scans. If a previous packet is partial, finish gaps without duplicating docs or rolling back useful work.

### Source-truth screen ownership
Status owns whole-life synthesis. Local screens own local action and local explanation. Dao Mandate / Run Compass internals may remain internally, but public default UI must translate diagnosis into concrete game language: `Cultivation Base`, `Mission Requirements`, `Gate Readiness`, `Current Bottleneck`, `Best Improvements`, `Safety Net`, `Current Work`, `Build & Preparation`, `Recent Changes`, `Details`, and `How calculated`.

### Public decommission rule
Do not preserve old public Dao/Omen/Proof UI just to satisfy stale tests. Public default labels such as `Current Omen`, `Gate Proof`, `Recent Omens`, `Source Thread`, `Proof Detail`, `Preparation Health`, `Mandate Lens`, `Module Source-Sink`, `Threshold Omen`, `Omen evidence`, and `Dao Mandate Interface` are decommission targets. Public default imports/usages of `OmenSeal`, `ProofSealRow`, `PressureBadgeRow`, `ReflectionPlaque`, `SourceThreadDrawer`, `LocalMandateLensHeader`, `ModuleSourceSinkPanel`, and `DaoMandateRouteButton` are decommission targets outside internal/debug/specimen contexts.

### Stale-test policy
Old architecture tests must be rewritten when they encode the wrong product direction. Do not implement around stale tests by keeping old Omen/Proof UI. Preserve internal Dao engine tests for adapter correctness, route safety, mutation safety, save migration, and diagnostics.

### Static scan expectations
Packets should record public component and public forbidden-copy scans when they touch this area:

```bash
rg -n "OmenSeal|ProofSealRow|SourceThreadDrawer|ReflectionPlaque|PressureBadgeRow|LocalMandateLensHeader|ModuleSourceSinkPanel|DaoMandateRouteButton" src/components src/features src/ui/status src/ui/world src/components/modals
rg -n "Current Omen|Gate Proof|Source Thread|Recent Omens|Mandate Lens|Module Source-Sink|Threshold Omen|Omen evidence|Dao Mandate Interface|Proof Detail|Preparation Health" src/components src/features src/ui/status src/components/modals src/components/screens
rg -n "Status V2 should use|compact Omen|ModuleSourceSinkPanel|LocalMandateLensHeader|Dao Mandate Interface|Gate Trial owns full readiness detail" tests/contracts tests/integration
```

Packet A may still show public offenders because Packet C/D have not landed. Record them as baseline. Packet C/D should drive the scans toward zero reachable-public offenders.

### Expected future-target failures
If a future-target contract is intentionally red until Packet B/C/D, gate it with a clear strict flag or document the expected failure. The failure message must say which packet owns the implementation.

### Plugin and final reporting
Use Browser, Linear, Game Studio, GitHub, Sentry, CodeRabbit, HyperFrames, Codex Security, and Superpowers only when available and useful for the packet. Record unavailable/not-used plugins honestly. Final summaries for decommission packets must include previous-packet/baseline verification, changed files, commands, expected future-target failures, plugin usage, risk notes, deferred Packet B/C/D work, and blockers.

# Codex Packet Template

## Goal

## Context

## Source-truth owners

## Scope

## Non-goals

## Likely files

## Implementation steps

## Tests to add/update

## Commands to run

## Acceptance criteria

## Evidence summary

## Deferred / not done
