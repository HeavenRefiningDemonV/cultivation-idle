# Linear Issue Drafts

Connection status: Linear plugin/tooling was unavailable in this session. These are draft payloads only. No Linear issues were created or mutated.

## Blocker

### CI-AUDIT-001 - Release gate is NO_GO on the current checkout

Severity: Blocker

Category: tooling

Existing Linear match: unable to query

Why this matters:
The release gate explicitly says the checkout is not ready. Story/tutorial work would build on an unstable acceptance baseline.

Evidence:
- `npm run release:gate:json`
- Result: `overallPass=false`, `releaseReady=false`, 5 unresolved blockers, 1 pending manual, 6 unaccepted waiver candidates.

Acceptance criteria:
- Release gate is GO, or every remaining NO_GO item is explicitly accepted as non-blocking with evidence.

Suggested labels: `audit`, `blocker`, `release-gate`

Suggested owner type: Codex implementation packet

### CI-AUDIT-002 - Fresh-run acceptance stops at Soul Formation instead of Spirit Severing

Severity: Blocker

Category: progression

Existing Linear match: unable to query

Why this matters:
The automated current-run proof does not reach the expected content cap. Tutorial writing would risk teaching a route that is not accepted by release tooling.

Evidence:
- `npm run release:fresh-run-report:json`
- Result: `releaseReady=false`, final realm `soul_formation`, expected `spirit_severing`.

Acceptance criteria:
- Current content cap decision is documented.
- Fresh-run report reaches the intended cap or the expected cap is corrected with design approval.

Suggested labels: `audit`, `blocker`, `progression`

Suggested dependencies: CI-AUDIT-001

Suggested owner type: Codex implementation packet plus design decision

### CI-AUDIT-003 - Timing probes fail before Foundation entry

Severity: Blocker

Category: balance

Existing Linear match: unable to query

Why this matters:
The audit cannot measure first-gate, first-prestige, or second-life pacing while timing probes fail before Foundation entry.

Evidence:
- `npm run balance:report:json`
- `npm run release:route-report:json`
- `npm run release:reclaim-route-report`
- All failed with `Timing probe ended without milestone: foundation_entry`.

Acceptance criteria:
- Balance, route, and reclaim reports run to completion.
- Generated measurements include at least Foundation entry, first gate clear, first prestige, and second-life reclaim timing.

Suggested labels: `audit`, `blocker`, `balance`

Suggested dependencies: CI-AUDIT-001

Suggested owner type: Codex implementation packet

## High

### CI-AUDIT-004 - Life-start wizard does not pause live cultivation truth

Severity: High

Category: player guidance / UI truth

Existing Linear match: unable to query

Why this matters:
The player can see live Qi gain and Breakthrough Ready while no path is selected. Story tutorial content would have to explain a contradictory first-life state.

Evidence:
- `screenshots/SS-016-life-start-path-selection.png`
- Raw text shows `Path No Path selected`, Qi above cap, and `Breakthrough Ready`.

Acceptance criteria:
- Fresh save cannot show active breakthrough truth before life-start completion, or the pre-life state is intentionally named and explained.
- Completing life-start sets Path, Heart Law, and Breath and clears the wizard.

Suggested labels: `audit`, `high`, `life-start`, `ui-truth`

Suggested owner type: Codex implementation packet

### CI-AUDIT-005 - Windows contract fixture emission blocks full contract suite

Severity: High

Category: tests

Existing Linear match: unable to query

Why this matters:
Full contract coverage cannot be trusted when `npm run test:contracts` fails before the suite can run cleanly.

Evidence:
- `npm run test:contracts`
- TS5033 could not write multiple `tmp-progression-fixtures/src/...` JS files.

Acceptance criteria:
- `npm run test:contracts` completes deterministically on Windows.
- Fixture output cleanup/write path is robust.

Suggested labels: `audit`, `high`, `tests`, `windows`

Suggested owner type: Codex implementation packet

### CI-AUDIT-006 - Trial lifecycle tests fail from pavilion manifest fixture setup

Severity: High

Category: tests / gate trial

Existing Linear match: unable to query

Why this matters:
The narrow P0 gate parity tests pass, but the lifecycle suite itself cannot validate available, fail-safe, cleared, and bypassed states independently.

Evidence:
- Direct compiled test command in `COMMAND_LOG.md`
- `trialLifecycle.test.js` failures: `[PavilionContent] manifest root must be an object`.

Acceptance criteria:
- Trial lifecycle tests pass.
- Fixture content bootstrap matches runtime content shape.

Suggested labels: `audit`, `high`, `tests`, `gate-trial`

Suggested dependencies: CI-AUDIT-005

Suggested owner type: Codex implementation packet

## Medium

### CI-AUDIT-008 - Address npm audit vulnerabilities

Severity: Medium

Category: security

Existing Linear match: unable to query

Why this matters:
The current dependency graph has high and moderate advisories, including a Vite dev server advisory.

Evidence:
- `npm audit --audit-level=moderate --json`
- High: `@xmldom/xmldom`, `vite`
- Moderate: `brace-expansion`, `postcss`

Acceptance criteria:
- Vulnerable dependencies are updated or documented with a temporary waiver.
- `npm audit --audit-level=moderate`, `npm run typecheck`, and `npm run build` pass.

Suggested labels: `audit`, `security`, `medium`

Suggested owner type: security/dependency cleanup

### CI-AUDIT-009 - Clean up build warnings before final polish

Severity: Medium

Category: performance / build

Existing Linear match: unable to query

Why this matters:
Build is successful, but warnings indicate asset resolution and bundle-size debt before final packaging.

Evidence:
- `npm run build`
- Warnings: stale Browserslist data, unresolved `InsideDungeon.png`, chunks over 500 kB.

Acceptance criteria:
- Build warnings are cleared or intentionally documented.

Suggested labels: `audit`, `medium`, `build`

Suggested owner type: Codex implementation packet
