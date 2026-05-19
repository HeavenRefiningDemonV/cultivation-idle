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
