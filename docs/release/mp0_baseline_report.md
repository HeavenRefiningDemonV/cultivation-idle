# MP0 Baseline Report

## Summary

MP0 completed its guardrail work: the prior clean baseline was documented, the contract fixture-output failure was repaired, trial lifecycle content bootstrapping was repaired, release gate NO_GO evidence was captured twice, and durable packet guardrails were added. Release remains NO_GO because MP1-MP5 blockers remain.

## Previous packet verification

- Previous MP0 implementation packet found: no.
- Evidence checked: git status/log/diff, release docs, artifact directories, AGENTS.md, package scripts, audit bundle notes.
- Result: No previous implementation packet found; using audit bundle and current branch as MP0 baseline.

## Branch and git state

- Branch: Latest
- Commit: 969de0ab4602a37ba3edf6ed6233419328f21924
- Initial dirty state: clean.
- Generated/edited during MP0: artifacts under `artifacts/mp0/`, release docs, AGENTS guardrails, fixture/test infrastructure.

## Commands run

See `artifacts/mp0/command-log.md`.

## Contract runner repair

- Pre-fix command: `npm run test:contracts`
- Pre-fix failure: TypeScript TS5033 unknown write errors while emitting to tracked `tmp-progression-fixtures`.
- Root cause: progression fixture output pointed at a tracked legacy generated tree. Alternate `--outDir artifacts/mp0/contracts/progression-fixtures-probe` compiled cleanly, proving the emit target was the infrastructure failure.
- Fix: `tsconfig.progression-fixtures.json` now emits to ignored `.tmp/progression-fixtures`; package scripts and fixture-script tests reference the same ignored path; `.tmp/` is ignored.
- Post-fix result: fixture build passes repeatedly; full contracts run into real/stale assertions rather than TS5033. The final repeat reached the same broad failure class and then timed out in an existing contract process.

## Trial lifecycle fixture repair

- Pre-fix command: direct `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/trialLifecycle.test.js`
- Pre-fix failure: `[PavilionContent] manifest root must be an object`.
- Root cause: hand-built fixture maps omitted runtime-required `pavilion_records.json`.
- Fix: trial lifecycle and other hand-built runtime content fixtures now include `pavilion_records.json`.
- States covered: locked before final substage, locked insufficient Qi, available, fail-safe available, cleared, bypassed, and missing `requiredItemId` via null assertion.
- Post-fix result: direct trial lifecycle passes twice plus a final repeat.

## Release gate status

- Decision: NO_GO
- Repeatability: two final release gate JSON runs both reported 5 unresolved blockers, 1 pending manual check, 6 unresolved waiver candidates, and the same per-check statuses.
- Artifacts: `artifacts/mp0/release/release-gate.after-1.json`, `artifacts/mp0/release/release-gate.after-2.json`, `artifacts/mp0/release/release-gate.mp0-summary.json`.

## AGENTS.md changes

- Added active packet discipline.
- Added release/test guardrails for blockers, waivers, content cap, artifact paths, validation commands, and emoji icon prohibition.
- Preserved existing Status V3 / Dao decommission guardrails.

## Artifact paths

- Root: `artifacts/mp0/`
- Logs: `artifacts/mp0/logs/`
- Release JSON: `artifacts/mp0/release/`
- Git context: `artifacts/mp0/baseline/git-context.md`
- Manifest: `artifacts/mp0/ARTIFACT_MANIFEST.md`

## Plugin usage

- Browser: not used; no UI changes or dev-boot requirement in MP0.
- Linear: unavailable/not loaded.
- Game Studio: not used; MP0 avoided gameplay/UI prototyping.
- Superpowers: used for TDD/debug discipline.
- GitHub: repository initialization checked for `HeavenRefiningDemonV/cultivation-idle`; no PR/issue actions taken.
- Sentry: unavailable/not loaded.
- CodeRabbit: unavailable/no PR review.
- HyperFrames: not used.
- Codex Security: no plugin scan run; `npm audit --audit-level=moderate --json` recorded MP5 baseline.

## Files changed

### Test/fixture infrastructure
- `.gitignore`
- `tsconfig.progression-fixtures.json`
- `package.json`
- `tests/contracts/progressionFixtureScripts.test.ts`
- `tests/contracts/trialLifecycle.test.ts`
- hand-built content fixture maps under `tests/contracts/`, `tests/integration/`, and `tests/helpers/`

### Release scripts/gates
- `scripts/generateProgressionContractDoc.ts`
- `scripts/progressionContractReport.ts`

### Docs/guardrails
- `AGENTS.md`
- `docs/release/current_readiness.md`
- `docs/release/known_issues.md`
- `docs/release/mp0_baseline_report.md`

### Artifacts
- `artifacts/mp0/**`

## No-scope-change confirmation

- Gameplay tuning: not performed.
- UI redesign: not performed.
- Content cap lowering: not performed.
- Story/tutorial: not performed.
- Balance changes: not performed.
- Broad dependency upgrades: not performed.

## Remaining blockers

- MP1: fresh route/cap truth, `foundation_entry` timing, life-start truth, first-gate live matrix, city handoff, save/load/prestige route proof.
- MP2: broad exact-screen/UI contract debt and screenshot evidence.
- MP3: reward parity and support economy/source-sink proof.
- MP4: number tuning after route proof.
- MP5: dependency/security/build hardening and observability.

## Acceptance criteria checklist

- Previous packet verification completed.
- Branch/commit/dirty state documented.
- Command log created.
- Contract fixture-output blocker repaired.
- Trial lifecycle PavilionContent root-shape blocker repaired.
- Release gate JSON captured twice and semantically stable.
- Waiver policy explicit.
- AGENTS.md updated.
- Release docs and artifacts created.
- No gameplay/UI/balance/content-cap changes performed.

## Recommended next packet

MP1 - First-Life, Route, Gate, Save/Prestige Truth.
