# MP1 Plugin and Tool Status

Generated: 2026-05-28

| Plugin/tool | Status | Evidence | Notes |
|---|---|---|---|
| Browser | used | In-app Browser namespace was not exposed, so repo Playwright was used: `npx playwright test tests/e2e/mp1-route-proof.spec.ts` | Screenshots, DOM summaries, and console log are under `artifacts/mp1/browser/`. Browser proof is partial and covers early route states plus first-gate locked. |
| Linear | unavailable | `tool_search` for Linear issue search exposed Figma/GitHub tools, not Linear tools | No issue creation/update will be attempted unless a Linear tool becomes available later. |
| Game Studio | deferred | Plugin listed in session, but no callable Game Studio MCP tool was exposed in the active toolset | Route proof was prioritized; game-feel review remains a later pass. |
| Superpowers | used | Loaded `using-superpowers`, `test-driven-development`, `systematic-debugging`, and `verification-before-completion` from plugin cache | TDD/root-cause/verification discipline is active for MP1 source changes. |
| GitHub | deferred | `tool_search` exposed GitHub repository/search tools; local `gh` CLI is not installed | Local repo preflight and artifact evidence were sufficient; no PR/issue work was requested. |
| Sentry | unavailable | No Sentry MCP namespace exposed during initial tool discovery | Sentry absence will not be treated as correctness proof. |
| CodeRabbit | unavailable | No CodeRabbit MCP namespace exposed during initial tool discovery | A focused local review checklist will be used if no tool becomes available. |
| HyperFrames | not applicable | MP1 evidence needs screenshots/reports, not a video storyboard | No cinematic evidence artifact was produced. |
| Codex Security | deferred | No dependency changes were made for MP1; MP5 owns security remediation | `npm audit` was not rerun. |
| Figma | not applicable | Figma tools are exposed, but MP1 is not a Figma/design-generation packet | No Figma work planned. |
| Node REPL | available | `node_repl` tools exposed by `tool_search` | May be used for lightweight JS inspection; repo scripts remain primary. |
