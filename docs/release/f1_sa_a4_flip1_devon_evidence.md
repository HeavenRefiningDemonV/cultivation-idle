# F1 / SA-A4 — The engine cutover (flip #1, dev-on, preserve-first) (evidence)

**Packet:** F1 sub-packet #5 — `SA-A4` · class `infra-only` (flag flip + migration) · risk III · **the linchpin's terminal packet**
**Landed:** 2026-06-21 · **Cutover statement:** the flip changes the *default source in dev*, NOT the *availability*. Both engines remain in the tree; the legacy engine is RETAINED behind `forceLegacy` for the whole feature build (its removal is `F-CLEAN-STAT`). The shipped const stays `false` (flip #2 is `F-BAL`). No destructive cleanup.

SA-A4 makes the derived layer combat's source **dev-on** (runtime override), lands the `v2_3_0`
save migration, confirms `forceLegacy` restores the legacy path, and passes the eight-point gate.

## 1 · The flip (dev-on, NOT the shipped const — DR-16a / INV-5)

Flip #1 is achieved via the **runtime override** that has existed since SA-A1
(`?statEngine=1` / `localStorage.statEngine='1'`), so reviewers get the derived engine while
players still get legacy. The shipped `STAT_ENGINE_DERIVED_AUTHORITATIVE_DEFAULT` **stays
`false`** (confirmed in `statEngineFlag.ts` — F1 makes NO code change to the flag). Flip #2
(the shipped const → `true`, default-on for players) is a separate, later, separately-gated
change owned by `F-BAL` after the balance pass. SA-A4 is dev-on only and fully reversible.

## 2 · The `v2_3_0` save migration (shape-only, additive, idempotent)

- `src/save/migrations/saveVersion.ts` — `CURRENT_SAVE_VERSION` bumped `'2.2.0' → '2.3.0'`.
- `src/save/migrations/steps/v2_3_0/seedThreeTreasuresFromLegacy.ts` (new) + `index.ts` (new) — the additive step; registered in `steps/index.ts`.
- Modeled on `v2_1_0/backfillTrainingState.ts`; uses `v2_0_0/shared.ts` helpers.

The derived engine reads sources that **already persist** (foundation/axes from the training
store, realm index, Tier-2 ratings from the Court store), so the migration is **shape-only**: it
ensures the `meridianCourtState` slice (the **body-side** of the D13 reincarnation partition) is
present. It **never lowers earned state** (a valid slice is preserved), **never touches soul-side
state** (Form-Memory / prestige live on other save fields), and replaces a malformed slice with a
safe empty one + a warning (never a crash/wipe — the legacy engine stays reachable via
`forceLegacy`). Idempotent: a save already at 2.3.0 with a valid slice runs no step.

**Dry-run proof** (`npm run migration:dry-run -- --fixture=legacy-unversioned-save`): source
`0.0.0 (legacy-unversioned)` → final `2.3.0`, with `v2_3_0_seed_three_treasures_from_legacy`
touching `meridianCourtState`.

## 3 · The eight-point cutover gate (Part 3.8) — all eight hold

| # | Point | Proof |
|---|---|---|
| 1 | **Visible** | combat numbers render from the derived layer with the flag on (harness seam + parity tests, flag-on captures) |
| 2 | **Wired** | the seam (`calculatePlayerStats` base source) reads derived; `getBasePlayerCombatStats` reads the same `state.stats` it writes (SA-A1 seam test) |
| 3 | **Stable** | the SA-A2 per-realm parity gate re-runs green with the flag on (harness test 3) |
| 4 | **Accepted** | the parity table is exact (+0.0%) at all six realms (SA-A2, committed at `qa/f1-stat-engine/compare/`) |
| 5 | **Preserved** | `forceLegacy` restores the exact legacy stats with the flag on (harness test 4: derived ≠ legacy for the basic seed; forceLegacy ⇒ legacy) |
| 6 | **Migration proven** | `migration:dry-run` (legacy → 2.3.0, slice seeded) + the idempotency/never-regress/soul-side contract (`statEngineMigrationContract.test.ts`) |
| 7 | **Contracts green** | `test:contracts` **534/534**; both paths exercised by the harness (derived under flag, legacy under `forceLegacy`) |
| 8 | **Recorded** | this evidence + the parity table + the migration contract, committed under `docs/release/` |

## 4 · Verification

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run check:icons` | ✅ (via build) |
| `npm run validate:content` | ✅ pass |
| `npm run test:contracts` | ✅ **534/534** (was 533; +1 = the migration idempotency contract) |
| `npm run build` | ✅ built ~6s |
| `npm run migration:dry-run` | ✅ legacy → 2.3.0, `v2_3_0` seeds `meridianCourtState` |
| Parity harness | ✅ **9/9** — incl. the forceLegacy proof and the parity-holds check |

## 5 · Migration-test ripple + a pre-existing failure (honest accounting)

Bumping `CURRENT_SAVE_VERSION` rippled into version-asserting tests. Most **import**
`CURRENT_SAVE_VERSION` (they auto-updated); the in-battery `p0ProgressionTruth` (asserts
`finalVersion === CURRENT_SAVE_VERSION`) passes. The two hardcoded spots were revised
in-packet: `tests/migrations/fixtures/current-save.json` (`version → 2.3.0`) and
`releaseMigrationMatrix.test.ts` (`source: 2.2.0 (current)` → `2.3.0 (current)`). All migration
suite tests that were **green at HEAD** remain green with SA-A4: `releaseMigrationMatrix` (5/5),
`migrationFramework` (2/2), `v2_0_0PathMigration` (2/2), `onboardingExistingSave` (1/1).

**Pre-existing failure (NOT caused by F1):** `tests/migrations/migrationRunner.test.ts` has 2
failing tests ('reportOnly…' and 'load-path…no-ops current save'). These were verified **red on
clean HEAD** (via `git stash`, with zero F1 changes) — their expected step lists are stale
relative to the `v2_1_0`/`v2_2_0` backfill steps that legitimately run on a slice-less save. SA-A4
neither causes nor fixes them (fixing that migration-framework test debt is out of F1 scope). They
are not part of the five-gate battery (which is green at 534/534).

## 6 · Diff scope / continuity

SA-A4's product diff is **migration-only**: `saveVersion.ts` (bump), `steps/index.ts`
(registration), `steps/v2_3_0/**` (the new step). The flag, the seam, the curve, and the
calibration are unchanged. The shipped const stays `false`; both engines remain in the tree; the
flip is the runtime override (reversible by un-setting it); the legacy path is reachable via
`forceLegacy`. **The linchpin is paid — in its safe, reversible, dev-on, const-false state.**
