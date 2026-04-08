# Phase 2 Packet Register (Authoritative Start)

## Purpose

Define the Phase 2 packet sequence and guardrails using **current repo truth** so later prompts stop drifting between doctrine, stale shorthand, and partial substrate implementation.

## Current git basis (verified from repo)

- Branch: `work`
- Short commit: `cbcf65a`
- Detached HEAD: `no` (HEAD is attached)

## Why P2-00 exists

P2-00 establishes a verified, docs-first baseline for Phase 2 (shared infrastructure / shell / chrome) before more packet work continues. It freezes naming, packet sequencing, and proof-surface scope without granting any cleanup or broad cutover authority.

## Inherited constraints from Phase 1 handoff (must remain in force)

Phase 2 inherits the following from `docs/ui/phase-1-phase2-handoff.md`, `docs/ui/phase-1-exit-audit.md`, and `docs/ui/phase-1-asset-packaging-ledger.md`:

1. Support-art roots are often scaffold-only; root existence is **not** proof of packaged binaries.
2. Hero enhancement families remain blocked unless a later packet proves need and passes trigger doctrine.
3. No cleanup authority is inherited from Phase 1 docs.

## P2-00 non-goals

- No runtime behavior changes.
- No visual cutover requests.
- No shell refactor implementation.
- No support-art or hero-art requests.
- No cleanup authorization.

## Phase 2 packet table (P2-00..P2-14, P2-S1, P2-S2)

| Packet ID | Title | Workstream | Type | Depends on | Direct Codex candidate | Intended output | Current status at HEAD | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P2-00 | Phase 2 start register / touchpoint / proof-surface audit | Governance | docs/audit/setup | Phase 1 handoff docs | Yes | Authoritative Phase 2 starting docs | in progress via this packet | This packet is docs-only and establishes repo-truth baseline. |
| P2-01 | FX substrate alignment pass | Shared runtime substrate | infra/docs | P2-00 | Yes | Substrate alignment plan + acceptance checks for `src/ui/fx/*` | partially present in repo | Runtime substrate exists; packet should align and normalize, not reinvent. |
| P2-02 | Shell primitive convergence rules | Shared shell | infra/docs | P2-00 | Yes | Convergence plan for `src/ui/shell/*` usage boundaries | partially present in repo | Shell primitives already live on key surfaces; packet should constrain expansion path. |
| P2-03 | Shared motion token normalization | Motion system | docs/audit | P2-00 | Yes | Canonical shared motion-token doctrine across shell/ritual/no-shift utilities | landed | Packet doc now exists; keep additive normalization only. |
| P2-04 | Token source and alias hygiene | Tokens / styles | infra/docs | P2-00 | Yes | Token-source doctrine around `src/styles/paperInkTokens.scss` and aliases | partially present in repo | Shared token source already exists and is in active use. |
| P2-05 | World shell proof-surface hardening | Proof surfaces | additive screen infra | P2-00, P2-02 | Yes | Bounded shell/chrome hardening for World proof surface | partially present in repo | World already uses TopRibbon + Inspector stack; preserve map ownership. |
| P2-06 | Shared shell API freeze (FrameCard / PlaqueHeader) | Shared shell | docs/contract | P2-00, P2-02 | Yes | Canonical API freeze for shell primitives and aliases | landed | Canonical file is `shell-api-freeze`; alias name tracked as drift. |
| P2-07 | Status FX proof-surface hardening | Proof surfaces | additive screen infra | P2-00, P2-01 | Yes | Bounded FX-stage hardening for Status proof surface | partially present in repo | ScreenFxStage + scene already live; preserve diagnostic center owner. |
| P2-08 | Dock and routed shell relationship lock | Shared shell routing | infra/docs | P2-00, P2-02 | Yes | Relationship rules for `BottomTabBar` ↔ `BottomNavDock` and routed shell scope | partially present in repo | Dock exists and is wired; packet should formalize scope and no-takeover rules. |
| P2-09 | Ritual modal shell consistency pass | Modal shell | additive infra | P2-00, P2-02 | Yes | Consistency rules and bounded normalization across `RitualModalFrame` consumers | partially present in repo | Multiple modals already consume RitualModalFrame. |
| P2-10 | Secondary consumer classification and containment | Scope governance | docs/audit | P2-00, P2-03 | Yes | Formal secondary-consumer list with no-mass-cutover constraints | landed | Canonical file retained; scenic-label naming treated as legacy alias drift. |
| P2-11 | Screenshot evidence inheritance for P2 packets | QA governance | docs/setup | P2-00 | Yes | Phase-2-specific screenshot usage guidance reusing existing workflow | already scaffolded in existing doctrine | Reuse `docs/release/qa/ui-cutover/<screen-id>/`; no parallel roots. |
| P2-12 | Art-readiness guardrail reaffirmation | Art readiness governance | docs/audit | P2-00, Phase 1 handoff docs | Yes | Explicit phase gate preventing support-art assumptions | already scaffolded in existing doctrine | Must remain compatible with Phase 1 scaffold-only truth. |
| P2-13 | No-cleanup-authority enforcement for infra packets | Cutover safety | docs/governance | P2-00, Section A cutover docs | Yes | Enforcement reminders and packet template clauses | already scaffolded in existing doctrine | Reinforces additive-first legal posture. |
| P2-14 | Phase 2 midpoint audit / continuity checkpoint | Governance checkpoint | docs/audit | P2-01..P2-13 | Yes | Mid-phase audit of truth, scope, and drift | planned | Should verify packet claims against actual repo state at that time. |
| P2-S1 | Support-art-dependent enhancement slot (conditional) | Optional support-art dependent | deferred/setup | P2-12 + proof of packaged assets | Yes | Placeholder slot for support-art-dependent work if later justified | blocked by Phase 1 art state | Cannot assume binaries exist; requires explicit later proof. |
| P2-S2 | Hero-family-dependent enhancement slot (conditional) | Optional hero-dependent | deferred/setup | P2-12 + hero trigger pass | Yes | Placeholder slot for hero-family-dependent support work | blocked by Phase 1 art state | Hero families remain blocked unless trigger doctrine passes. |

## Dependency model (serial vs parallel)

- **Serial anchors:** `P2-00` must precede all other Phase 2 packets. `P2-14` should run after core packet wave.
- **Parallel-capable after P2-00:** `P2-01`, `P2-02`, `P2-03`, `P2-04`, `P2-11`, `P2-12`, `P2-13` can run in parallel if each packet maintains additive/no-cleanup constraints.
- **Proof-surface packets:** `P2-05`, `P2-06`, `P2-07`, `P2-08`, `P2-09`, `P2-10` should consume outputs from substrate/shell/material governance packets first.
- **Conditionally blocked slots:** `P2-S1`, `P2-S2` remain blocked unless later packets prove art readiness and trigger legality.

## Naming conventions freeze for Phase 2

To stop ad-hoc path creation, Phase 2 naming is frozen as:

- Phase-wide docs: `docs/ui/phase-2-*.md`
- Packet-specific docs (when needed): `docs/ui/phase-2-p2-XX-<slug>.md`
- Screenshot evidence: `docs/release/qa/ui-cutover/<screen-id>/` (reuse existing workflow)
- Machine-readable companion (if needed): same stem with `.json`

Explicitly disallowed naming trees:

- `docs/ui/phase2/`
- `docs/ui/p2/`
- `src/ui/shared2/`
- other ad-hoc parallel naming trees

## P2-00 acceptance gate

P2-00 is complete only when:

1. `docs/ui/phase-2-packet-register.md` exists with verified git basis, packet table, dependency model, naming freeze, and non-goals.
2. `docs/ui/phase-2-touchpoint-registry.md` exists with verified repo-truth mapping for fx/shell/ink/paper/token source and consumer tables.
3. `docs/ui/phase-2-proof-surface-register.md` exists with primary vs secondary proof-surface scoping and explicit out-of-scope families.
4. All claims are tied to current HEAD truth and do not grant cleanup authority.

## Citation requirement for later packets

Later Phase 2 packets must cite at least:

- `docs/ui/phase-2-packet-register.md`
- `docs/ui/phase-2-touchpoint-registry.md`
- `docs/ui/phase-2-proof-surface-register.md`

And must continue inheriting Phase 0/Phase 1/Section A governance docs rather than inventing replacement doctrine.

## Canonical packet filename aliases (history reconciliation)

- P2-03 canonical file: `docs/ui/phase-2-p2-03-shared-motion-token-normalization.md`.
- P2-06 canonical file: `docs/ui/phase-2-p2-06-shell-api-freeze.md` (legacy alias: `phase-2-p2-06-framecard-plaqueheader.md`).
- P2-10 canonical file: `docs/ui/phase-2-p2-10-secondary-consumer-containment.md` (legacy alias: `phase-2-p2-10-scenic-label-contract.md`).
