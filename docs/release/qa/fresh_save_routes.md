# Fresh-save routes (packet 7.1a / 7.1b)

## Route IDs

- `normal`
  - Policy: `balanced`
  - Automation mode: `automated_smoke_blocking`
  - Packet 7.1 blocking smoke route.
  - No bypass/fail-safe usage and no assisted/debug steps.
- `cautious`
  - Policy: `safety_first`
  - Automation mode: `manual_coverage`
  - Manual-coverage-first for now; not auto-run in CI smoke.
  - No bypass/fail-safe usage.
- `aggressive`
  - Policy: `speed_first`
  - Automation mode: `manual_coverage`
  - Manual-coverage-first for now; not auto-run in CI smoke.
  - No bypass/fail-safe usage.

## What the automated runner proves today

- Starts from a true fresh-life baseline (single unlocked city, realm index 0) after runtime/content bootstrap.
- Uses live runtime stores for ticking, trial lifecycle checks, trial attempts, gate resolution, and breakthroughs.
- Reaches `spirit_severing` current chapter cap on the normal route (or returns explicit blocker failures).
- Verifies final unlocked city chain is exactly the five-city live semester slice.
- Verifies cap-adjacent surfaces are available:
  - prestige advisor surface,
  - current chapter exhausted truth/modal availability,
  - current life summary surface.

## What this does **not** prove

- This is a release progression smoke, not a full gameplay bot.
- It does not replace manual/human-honest route validation planned for packet `7.1c/7.1d`.
- It does not provide alternate-route automation matrix coverage yet (cautious/aggressive are route specs only in this packet).

## Known runtime limitation surfaced by this packet

- Distinct honest automation flows for `cautious` and `aggressive` are intentionally deferred.
- Packet 7.1b only blocks on one honest automated representative route (`normal`) to avoid fake duplicated coverage.

## Packet 7.1c/7.1d reporting integration

- Manual QA worksheet: `docs/release/qa/fresh_save_worksheet.md`.
- Severity rubric: `docs/release/qa/issue_severity_rubric.md`.
- Manual result example payload: `docs/release/qa/manual_results.example.json`.
- Acceptance report CLI:
  - `npm run release:fresh-run-report`
  - `npm run release:fresh-run-report:json`
- This report layer is packet 7.1-only and does **not** implement packet 7.6 global sign-off.
