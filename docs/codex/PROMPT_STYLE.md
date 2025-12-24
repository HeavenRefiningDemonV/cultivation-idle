# Codex Prompt Style

Prompts should read like focused GitHub issues so they are easy to execute without extra planning. Keep the request concise and action-oriented.

## Structure to follow
- **Scope**: What codepaths/files to touch and the feature goal.
- **Non-goals**: Call out adjacent changes that should not be attempted.
- **Deliverables**: What artifacts to produce (code, docs, screenshots, telemetry hooks, etc.).
- **Acceptance criteria**: Measurable outcomes that define “done.”
- **Verification**: Exact commands to run (typecheck/build/tests/lint) and any manual checks.

## Behavior expectations
- Do not ask for long preambles or broad plans—implement the working change directly and verify with the listed commands.
- If blocked by missing context or ambiguous requirements, stop and output the minimal blocking question instead of guessing.
- Prefer small, cohesive patches that respect guardrails and existing architecture (ActivityStore gating, CombatStore ownership, RewardService pipeline, offline rules, and content-driven data).
