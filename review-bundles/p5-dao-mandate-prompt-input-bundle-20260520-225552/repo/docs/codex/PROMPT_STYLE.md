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

## UI additive rollout guardrails
- UI prompts must declare one packet type: docs-only, infra-only, additive screen enhancement, or approved cleanup.
- Default UI packet mode is additive-only.
- Infrastructure packets must not remove scenic backgrounds, ribbons, headers, frames, icons, or stable affordances.
- Any screen packet must name which existing art/base layers remain in place until cutover.
- Cleanup may be requested only when the exact target screen has screenshot-approved additive completion with no missing icons/buttons/labels, no duplicate framing, and no layout-shift regressions.
- Cleanup must never be bundled silently into unrelated work.
- Future art or future FX must never be used to justify a broken present intermediate state.
- If cleanup preconditions are not met, prompts must keep old layers in place and explicitly defer cleanup.

## UI packet contract
- UI Section B–I packets must follow `docs/codex/UI_PACKET_SCHEMA.md`.
- Prompt authors should start from `docs/codex/UI_SECTION_A_PACKET_TEMPLATE.md` instead of improvising packet structure.
- Every UI packet must declare: packet class, current phase, target visible surface(s) or `N/A`, dominant screen family or `N/A`, touched layers or `N/A`, retained old art/layer(s), exact file touchpoints, art request status, cutover statement, and fallback behavior.
- Silent cleanup is forbidden.
- Guessed touchpoints are forbidden.
- If a packet is not a UI packet, this section does not apply.
