# Fresh-save manual QA worksheet (packet 7.1c/7.1d)

## Scope and purpose

This worksheet captures **human route validation** for packet 7.1 release readiness.

- Routes under review: `normal`, `cautious`, `aggressive`.
- This is packet 7.1 reporting coverage only.
- Packet 7.6 global release sign-off is **not** implemented here.

## Preflight setup (required)

1. Ensure latest branch and dependencies:
   - `npm install`
2. Run core validation:
   - `npm run typecheck`
   - `npm run test`
3. Confirm route/checkpoint docs are current:
   - `docs/release/qa/fresh_save_routes.md`
   - `docs/release/qa/fresh_save_checkpoints.md`

## Tester metadata

- Tester:
- Date (YYYY-MM-DD):
- Build ref / git SHA (optional):
- Route ID (`normal` / `cautious` / `aggressive`):
- Overall verdict (`pass` / `fail` / `blocked`):

## Route class expectations

- `normal`
  - Canonical representative route.
  - Must align with automated smoke truth.
- `cautious`
  - Safer/slower route behavior.
  - Manual-coverage-first route in packet 7.1.
- `aggressive`
  - Faster/leaner route behavior.
  - Manual-coverage-first route in packet 7.1.

## Canonical checkpoint table

Use one row per checkpoint; fill all columns.

| Checkpoint ID | Expected state | Actual state | Pass/Fail/Blocked reason | Notes |
|---|---|---|---|---|
| life_started | Fresh life begins in starter city |  |  |  |
| path_selected | Path is selected and visible |  |  |  |
| heart_law_selected | Heart Law selection state is clear |  |  |  |
| pinewind_ready | Pinewind baseline is coherent |  |  |  |
| gate_1_available | Gate 1 availability feels honest |  |  |  |
| gate_1_resolved | Gate 1 resolution is understandable |  |  |  |
| foundation_entry | Foundation entry clearly occurs |  |  |  |
| stonecrag_entered | Stonecrag arrival is coherent |  |  |  |
| gate_2_available | Gate 2 availability feels honest |  |  |  |
| gate_2_resolved | Gate 2 resolution is understandable |  |  |  |
| core_formation_entry | Core Formation entry clearly occurs |  |  |  |
| spirit_cavern_entered | Spirit Cavern arrival is coherent |  |  |  |
| gate_3_available | Gate 3 availability feels honest |  |  |  |
| gate_3_resolved | Gate 3 resolution is understandable |  |  |  |
| nascent_soul_entry | Nascent Soul entry clearly occurs |  |  |  |
| lotusford_entered | Lotusford arrival is coherent |  |  |  |
| gate_4_available | Gate 4 availability feels honest |  |  |  |
| gate_4_resolved | Gate 4 resolution is understandable |  |  |  |
| soul_formation_entry | Soul Formation entry clearly occurs |  |  |  |
| ironpeak_entered | Ironpeak arrival is coherent |  |  |  |
| gate_5_available | Gate 5 availability feels honest |  |  |  |
| gate_5_resolved | Gate 5 resolution is understandable |  |  |  |
| spirit_severing_entry | Spirit Severing entry reached |  |  |  |
| content_cap_reached | Current authored cap reached |  |  |  |
| prestige_advisor_surface_available | Prestige advisor state visible |  |  |  |
| current_chapter_exhausted_truth_available | Current-cap message visible |  |  |  |
| current_life_summary_available | Current life summary visible |  |  |  |

## Gate review checklist (each gate)

For gates 1 through 5, mark each:

- [ ] Gate availability felt honest for observed state.
- [ ] Gate readiness/state messaging was readable.
- [ ] Gate resolution path was understandable.
- [ ] Fail-safe visibility was honest (if relevant).
- [ ] No contradictory trial/gate text was shown.

## City review checklist (each city arrival)

For each newly entered city:

- [ ] City arrival made sense relative to prior progression.
- [ ] New city role and modules were readable.
- [ ] No ghost/deferred content was referenced as live.

## End-of-run truth checks

- [ ] Spirit Severing reached.
- [ ] Current Chapter Exhausted messaging seen.
- [ ] Prestige advisor state seen.
- [ ] Life summary seen.
- [ ] No fake city 6 or fake next chapter chain implied.

## Issue log

| Severity (blocker/major/minor/cosmetic) | Checkpoint ID (optional) | Summary | Notes |
|---|---|---|---|
|  |  |  |  |

## Export guidance

- Convert worksheet findings into `docs/release/qa/manual_results.example.json` shape.
- Run report merge:
  - `npm run release:fresh-run-report -- --manual-results=<path-to-json>`
- Confirm manual coverage is not shown as complete unless all required routes have submitted results.
