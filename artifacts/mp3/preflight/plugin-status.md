# MP3 Plugin Status

Generated: 2026-05-29T01:37:16+03:00

| Plugin/tool | Status | MP3 handling |
|---|---|---|
| Browser | not available as an exposed in-app Browser MCP tool after `tool_search`; local Playwright is available | Use repo Playwright/e2e smoke for browser evidence and document any Browser plugin limitation. |
| Linear | not available as an exposed callable tool after `tool_search` | Do not create Linear issues; record follow-ups locally in MP3 reports. |
| Game Studio | not available as an exposed callable tool after `tool_search` | Use the prompt's game-feel checklist locally and save `artifacts/mp3/final/game-feel-report.md`. |
| Superpowers | available and used | Loaded `using-superpowers`, `writing-plans`, and `test-driven-development`; using local `cultivation-idle-closeout` memory skill for evidence discipline. |
| GitHub | available via connector; local `gh` CLI not installed | Queried recent PR context for `HeavenRefiningDemonV/cultivation-idle`; no branch/PR mutation requested yet. |
| Sentry | not available as an exposed callable tool and no relevant env vars found | No production issue lookup; absence is not proof of no runtime errors. |
| CodeRabbit | not available as an exposed callable tool after `tool_search` | Use local review checklist for reward/readiness/combat/CSS ownership. |
| HyperFrames | plugin listed, no MP3 need and no callable workflow used | Deferred; not a blocker. |
| Codex Security | procedural security skills available, no dedicated callable scan exposed | Use local scoped review for changed reward/economy paths; defer full hardening to MP5. |
| Node REPL | available after tool discovery | Optional; repo scripts and tests remain primary. |
| Figma | available but not relevant | Not used for MP3 implementation. |

## Discovery Notes

- `tool_search` for Browser/localhost surfaced Figma capture tools and `node_repl`, not an in-app Browser navigation/screenshot namespace.
- `tool_search` for Linear surfaced no Linear namespace.
- `tool_search` for Game Studio surfaced no Game Studio namespace.
- `tool_search` for CodeRabbit/Sentry/Codex Security surfaced no dedicated callable namespace.
- GitHub connector did expose repository/PR tools and returned recent merged PRs.
