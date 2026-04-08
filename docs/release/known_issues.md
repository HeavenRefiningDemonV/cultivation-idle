# Known Issues Ledger

- Generated: 2026-04-08T08:02:47.762Z
- Release gate headline: PASS

## Open blockers
- None

## Accepted waivers
- None

## Post-semester debt
- None

## Untracked findings (must classify)
- None

## Typed ledger entries
- waiver_build_npm_env_http_proxy_warning [accepted_waiver] (accepted)
  - sourceCheckId: build_audit
  - owner: release_engineering
  - rationale: The warning is environment/tooling metadata and does not indicate product/runtime drift.
  - mitigation: Track npm config cleanup outside the semester RC critical path.
  - evidence: docs/release/build_warning_inventory.md
- waiver_build_node_experimental_loader_warning [accepted_waiver] (accepted)
  - sourceCheckId: build_audit
  - owner: release_engineering
  - rationale: Node experimental-loader warnings are emitted by strip-types test/runtime wiring in this environment and are non-blocking for product correctness.
  - mitigation: Remove loader warnings when Node/register migration is completed in follow-up tooling cleanup.
  - evidence: docs/release/build_warning_inventory.md
- waiver_build_node_trace_warning_hint [accepted_waiver] (accepted)
  - sourceCheckId: build_audit
  - owner: release_engineering
  - rationale: The trace-warnings hint line is emitted with experimental warnings and does not indicate a standalone build defect.
  - mitigation: Treat as coupled noise with experimental-loader warnings until loader migration is complete.
  - evidence: docs/release/build_warning_inventory.md
- waiver_build_css_syntax_minifier_warning [accepted_waiver] (accepted)
  - sourceCheckId: build_audit
  - owner: release_engineering
  - rationale: Current minifier warnings are stable non-fatal diagnostics from generated CSS token interpolation and do not fail build output generation.
  - mitigation: Track style-pipeline cleanup separately; keep as explicit accepted warning while build remains green.
  - evidence: docs/release/build_warning_inventory.md
- waiver_build_chunk_size_warning_limit [accepted_waiver] (accepted)
  - sourceCheckId: build_audit
  - owner: release_engineering
  - rationale: Rollup chunk-size warning is advisory and expected for current bundle composition.
  - mitigation: Track chunking optimization separately from release-blocking build correctness.
  - evidence: docs/release/build_warning_inventory.md
- waiver_build_chunk_size_guidance_line [accepted_waiver] (accepted)
  - sourceCheckId: build_audit
  - owner: release_engineering
  - rationale: Chunk-size guidance text is a non-blocking advisory line emitted by Vite after successful build output.
  - mitigation: Keep advisory tracked while bundle-splitting backlog is addressed.
  - evidence: docs/release/build_warning_inventory.md
- debt_progression_gate_namespace_split [post_semester_debt] (open)
  - sourceCheckId: progression_contract
  - owner: progression
  - rationale: Progression gate namespace wiring still has legacy split points that are known and non-blocking for this release.
  - mitigation: Consolidate gate namespace ownership under progression contract runtime mirror and remove split aliases.
  - evidence: docs/progression-contract.md, docs/progression-fixtures.md
- debt_progression_offline_pipeline_split [post_semester_debt] (open)
  - sourceCheckId: progression_contract
  - owner: progression
  - rationale: Offline progression pipeline still traverses split legacy/runtime edges that are explicitly tracked as debt.
  - mitigation: Unify offline progression pipeline with the same contract-backed progression path used in live runtime.
  - evidence: docs/progression-contract.md, docs/progression-fixtures.md
- debt_progression_hidden_prestige_runtime_consumer [post_semester_debt] (open)
  - sourceCheckId: progression_contract
  - owner: progression
  - rationale: Hidden prestige runtime consumption paths exist as known legacy behavior and are tracked until migration cleanup lands.
  - mitigation: Remove hidden prestige runtime consumer paths and enforce explicit prestige state reads through contract selectors.
  - evidence: docs/progression-contract.md, docs/progression-fixtures.md
- debt_progression_partial_prestige_reset [post_semester_debt] (open)
  - sourceCheckId: progression_contract
  - owner: progression
  - rationale: Partial prestige reset residue is still observed in legacy fixtures and tracked as post-semester migration debt.
  - mitigation: Complete prestige reset migration path and remove partial reset residue compatibility shims.
  - evidence: docs/progression-contract.md, docs/progression-fixtures.md
