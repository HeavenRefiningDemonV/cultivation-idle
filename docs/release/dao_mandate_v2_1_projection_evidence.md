# Dao Mandate V2-1 Projection Evidence

## Packet
V2-1 - Omen Projection type contract and fixtures

## V2-0 preflight result
- AGENTS.md present: PASS
- V2 test inventory present: PASS
- Guardrails include no raw route list / no points-elsewhere / no gameplay mutation: PASS
- Inventory includes stale route-led Status, Guidance Oath density, local quiet, and Prestige route-ribbon file evidence: PASS
- V2-0 changed only `AGENTS.md` and `docs/release/dao_mandate_v2_test_inventory.md` in `HEAD~1..HEAD`: PASS
- Any V2-0 repair performed: no

## Scope completed
- New files:
  - `src/systems/ui/daoMandate/daoOmenProjectionTypes.ts`
  - `src/systems/ui/daoMandate/buildDaoOmenProjectionV1.ts`
  - `src/systems/ui/daoMandate/daoOmenProjectionFixtures.ts`
  - `tests/contracts/daoOmenProjectionContract.test.ts`
  - `docs/release/dao_mandate_v2_1_projection_evidence.md`
- Modified files:
  - `src/systems/ui/daoMandate/index.ts`
- Tests added:
  - `tests/contracts/daoOmenProjectionContract.test.ts`

## Projection contract summary
- Current omen fields: one `currentOmen` with stable id, kind, symptom-first title/detail, severity, tone, icon id, evidence ids, and optional direct route.
- Proof seal cap: `proofSeals.length <= 4`.
- Pressure badge cap: `pressureBadges.length <= 4`.
- Source thread behavior: source threads are projection data only and default to drawer/local-owner visibility, not hard routes for ordinary drought/prep pressure.
- Direct route skeleton: routes are exposed for setup, hard proof, repeated failure, safety net, breakthrough, reincarnation, content cap, and Gate Trial inspect attempt states only.

## Fixture states
| State | Expected omen | Direct route | Notes |
|---|---|---:|---|
| `life_setup_missing_path` | `life_setup` | yes | Path and Heart Law setup seals. |
| `qi_short_before_realm_edge` | `threshold_unreached` | no | Realm/Qi seals, no cultivation command in projection route. |
| `gate_proof_missing_attemptable` | `proof_missing` | yes | Gate proof unsealed and Gate Trial inspect route allowed. |
| `medicine_floor_short` | `reserve_thin` | no | Survival badge; Apothecary raw route suppressed. |
| `forge_floor_shortfall` | `gear_floor_strained` | no | Forge badge; Forge raw route suppressed. |
| `doctrine_gap` | `doctrine_uncertain` | no | Doctrine badge; Techniques raw route suppressed. |
| `merit_reserve_low` | `support_reserve_low` | no | Support badge; no Bounties hard route. |
| `source_drought_herbs` | `source_drought` | no | Source badge/thread; source route is drawer visibility. |
| `attemptable_gate_viable` | `attemptable` | yes | Gate Trial inspect route allowed. |
| `attemptable_gate_risky` | `risky_attempt` | yes | Gate Trial inspect route allowed; prep pressure stays subordinate. |
| `repeated_underprepared_failure` | `reflection` | yes | One reflection and one correction route. |
| `safety_net_ready` | `safety_net_ready` | yes | Mercy seal ready and Gate Trial route allowed. |
| `breakthrough_ready` | `breakthrough_ready` | yes | Realm/Qi/proof sealed; no prep badge nag. |
| `prestige_viable_not_recommended` | `reincarnation_viable` | yes | Prestige route allowed because raw counsel is meaningful. |
| `content_cap_reached` | `content_cap` | yes | Cap/reincarnation handoff, no fake future grind. |

## Commands run
- `Get-Location`: PASS - confirmed `C:\Users\abdul\Desktop\cultivation-idle`.
- `git status --short`: PASS - clean before edits.
- V2-0 guardrail scans with `rg`: PASS - guardrails and inventory present.
- `git diff --name-only HEAD~1..HEAD`: PASS - only `AGENTS.md` and V2 inventory doc.
- `npm exec tsc -- --project tsconfig.tests.json` after writing the test first: FAIL as expected - missing projection exports before implementation.
- `npm run typecheck`: PASS.
- `npm exec tsc -- --project tsconfig.tests.json; node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenProjectionContract.test.js --test-name-pattern DaoOmenProjection`: PASS - 11/11 projection tests passed.
- `npm run test:contracts -- --test-name-pattern "DaoOmenProjection"`: FAIL - repo script still executed broad contract files and hit unrelated existing failures, including `statusFxSceneAtmosphereContract`, `statusToneUtils`, and `trialLifecycle` content manifest failures.
- Initial chained direct test attempt including `npm run build:progression-fixtures`: FAIL inside `build:progression-fixtures` with TS5033 write errors under `tmp-progression-fixtures`; generated churn was cleaned before final status. The projection test itself passed in that run.
- `npm run check:icons`: PASS.
- `rg -n "buildDaoOmenProjectionV1|DaoOmenProjectionV1" src\components src\features src\ui`: PASS - no production screen/UI cutover.
- Builder/type forbidden import scan: PASS - no store/service/screen/component imports in builder or type contract.
- `git diff --check`: PASS - exit 0; Git emitted an LF/CRLF warning for `index.ts`.

## Plugin/tool usage
### Browser
Used: no
Reason: V2-1 is model/test-only; no screen cutover or local visual preview required.

### Linear
Used: no
Result: no callable Linear tool was exposed and `linear` CLI was not installed.

### Game Studio
Used: no
Result: no prototype, UI, art, or mechanic design was needed; fixture matrix came from the packet.

### Superpowers
Used: yes
Result: used workflow guidance for skill check, TDD, verification-before-completion, and systematic debugging. No plan file was created because V2-1 restricts changed files.

### GitHub
Used: yes
Result: GitHub connector PR search for V2-1 / Omen Projection found no matching PRs in `HeavenRefiningDemonV/cultivation-idle`. `gh` CLI was not installed.

### Sentry
Used: no
Result: no callable Sentry tool was exposed and `sentry-cli` was not installed.

### CodeRabbit
Used: no
Result: no callable CodeRabbit tool was exposed and `coderabbit` CLI was not installed.

### HyperFrames
Used: no
Reason: HTML/video render is out of scope for a non-visual type/test packet.

### Codex Security
Used: no
Result: no focused diff-scan tool was exposed. Manual safety scan found no store/service/screen imports and no network/filesystem/dynamic execution in production projection code.

## Known blockers
- Broad `npm run test:contracts -- --test-name-pattern "DaoOmenProjection"` is not a clean targeted signal in this repo; it executed broad contract files and failed on unrelated stale/status/content tests.
- `npm run build:progression-fixtures` reported TS5033 write errors during an initial chained verification attempt. Final projection verification used `tsconfig.tests.json` plus the direct compiled contract test and passed.
- No V2-1 production UI, CSS, gameplay store/service, save migration, or content files were changed.

## GO / NO_GO for V2-2
GO for V2-2.

Reason: V2-0 guardrails were verified, projection types/builder/fixtures compile, targeted projection contract tests pass, non-hard pressure routes are suppressed, hard-route cases are represented, no production screen imports the projection, and no gameplay mutation path was added. The broad-suite failures are documented as unrelated repo debt rather than V2-1 projection failures.
