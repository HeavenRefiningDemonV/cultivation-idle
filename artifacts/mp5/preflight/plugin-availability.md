# MP5 Plugin Availability

Generated: 2026-05-29T18:35:56.6889595+03:00

| Plugin | Status | Evidence |
|---|---|---|
| Browser | UNAVAILABLE_DEDICATED_TOOL_USE_PLAYWRIGHT_FALLBACK | tool_search for Browser exposed node_repl/playwright route but no dedicated browser namespace. |
| GitHub | AVAILABLE_MCP_TOOLING_REMOTE_PRESENT | tool_search exposed mcp__codex_apps__github tools; origin remote is HeavenRefiningDemonV/cultivation-idle. |
| Sentry | UNAVAILABLE_NO_TOOL_OR_ENV | No SENTRY_* env vars present; tool_search did not expose Sentry namespace. |
| CodeRabbit | UNAVAILABLE_NO_CODERABBIT_TOOL | tool_search exposed GitHub review tools, not CodeRabbit review tool. |
| Linear | UNAVAILABLE_NO_LINEAR_TOOL_OR_ENV | tool_search did not expose Linear namespace; no LINEAR_API_KEY env var. |
| Codex Security | UNAVAILABLE_NO_SCAN_TOOL_SKILL_ONLY | Codex Security skills are installed, but no callable scan MCP tool surfaced through tool_search. |
| Game Studio | UNAVAILABLE_NO_GAME_STUDIO_TOOL_SKILL_ONLY | Game Studio skills are installed, but no callable game-studio MCP tool surfaced through tool_search. |
| Superpowers | AVAILABLE_SKILLS_LOADED_FROM_DISK | using-superpowers, writing-plans, and cultivation-idle-closeout guidance were loaded from disk. |
| HyperFrames | NOT_USED_OPTIONAL | Optional in MP5; no need before hardening gates. |
