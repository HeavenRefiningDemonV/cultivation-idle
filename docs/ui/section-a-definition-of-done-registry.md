# Section A.10 — Definition-of-Done Registry

## Purpose

This file records reusable local definition-of-done clauses for major UI work so packets and reviewers can inherit explicit completion criteria instead of improvising them.

This registry complements `docs/ui/section-a-acceptance-matrix.md`; it does not replace global acceptance axes. It inherits Section A terminology from A.1/A.4/A.5/A.6/A.8/A.9 and formalizes v3 Section 10 done-when material into a reusable doctrine layer.

## Scope note

This file governs:

- packet-level completion distinctions;
- surface-level local done clauses;
- additive done versus cleanup-eligible distinction;
- overhaul-level done summary;
- required packet usage of local done clauses.

This file does **not** govern:

- implementation code;
- cutover workflow details;
- release-wide signoff process;
- renderer/package choices;
- screen redesign instructions.

## Definitions

- **Packet complete** — The packet’s bounded objective is complete and its claimed acceptance axes pass.
- **Surface locally done** — The target visible surface satisfies its local done clause plus all relevant global acceptance axes.
- **Cleanup-eligible** — The target visible surface is locally done and separately passes A.6 cutover approval for exact cleanup scope.
- **Overhaul done** — The current overhaul slice satisfies the acceptance matrix across all in-scope surfaces.
- **Deferred but non-blocking** — Explicit unfinished work that does not falsify any claimed acceptance axis.

## Registry rules

1. Local done clauses are additive to the global acceptance matrix.
2. Local done clauses must not bypass global acceptance axes.
3. A packet may be packet complete without making an entire screen surface locally done.
4. A surface may be locally done without becoming cleanup-eligible.
5. Deferred work must be explicit and genuinely non-blocking.
6. Deferred work that contradicts a claimed axis is a blocking failure.

## Completion status decision ladder

Use this order when judging completion:

1. **Packet complete?**
   - objective bounded and delivered;
   - axis claims explicit and evidence-backed;
   - no contradiction in deferred list.
2. **Surface locally done?**
   - relevant local done clause satisfied;
   - all relevant global axes passed.
3. **Cleanup-eligible?**
   - surface locally done;
   - exact-screen A.6 signoff completed;
   - cleanup scope explicitly unlocked.
4. **Overhaul done?**
   - all in-scope surfaces satisfy matrix and local clauses for current slice.

No step may be skipped.

## Packet-class definition-of-done mini-registry

### A. `docs-only`

**Must be true**

- packet remains documentation-only;
- named doctrine gap is closed with stable, reusable wording;
- codex readiness is improved and ambiguity reduced.

**Must remain forbidden**

- implementation instructions hidden as doctrine;
- permission drift into cleanup or runtime behavior changes;
- template/process rewrites outside packet scope.

**Common false-done trap**

- document looks polished but leaves axis claims unverifiable or contradicts existing doctrine vocabulary.

### B. `infra-only`

**Must be true**

- support infrastructure objective is complete;
- no destructive visual consequence is introduced;
- additive/continuity posture remains explicit.

**Must remain forbidden**

- cleanup by implication;
- scenic-owner stripping;
- semantic changes that imply mechanic drift.

**Common false-done trap**

- infra packet claims harmless scope while silently altering visible behavior that requires surface-level acceptance review.

### C. `additive screen enhancement`

**Must be true**

- declared target visible surface and dominant screen family are correct;
- local done clause is cited and satisfied for touched objective scope;
- retained old layer(s) remain explicit;
- relevant axes pass with concrete evidence.

**Must remain forbidden**

- implicit cleanup;
- undeclared ownership transfer;
- done claims without axis accounting.

**Common false-done trap**

- additive visuals are improved, but truth/stability/accessibility failures remain unresolved.

### D. `cleanup request after cutover review`

**Must be true**

- exact target visible surface is named;
- exact A.6 signoff reference is cited;
- exact unlocked cleanup scope is listed;
- local done clause and global axes still pass after cleanup.

**Must remain forbidden**

- sibling-screen cleanup;
- broad cleanup licenses;
- cleanup without approved exact-screen evidence.

**Common false-done trap**

- packet claims cleanup-eligible based on additive quality without legal cutover evidence.

## Surface definition-of-done registry

Each entry is a reusable local done clause. These clauses apply in addition to global acceptance axes.

### Hero / ritual selections

| Visible surface | Dominant family | Local definition of done | Common false-done trap | Key acceptance emphasis |
| --- | --- | --- | --- | --- |
| Path / Life Start | Hero ritual | Choice intent is immediately understandable; portraits remain emotional center; ceremony reads in High FX and remains coherent in Reduced Motion; no current ownership stripped pre-cutover. | Decorative pass weakens clarity of choices or hides stakes behind hover/tooltip. | Truth, Identity, Accessibility, Continuity. |
| Heart Law Selection | Hero ritual | Law options, role differences, and immediate consequence direction are baseline-visible; centerpiece remains ceremonial; selection states are layout-stable. | Laws look distinct visually but comparative meaning requires discovery outside screen. | Truth, Stability, Identity. |

### Hero screens

| Visible surface | Dominant family | Local definition of done | Common false-done trap | Key acceptance emphasis |
| --- | --- | --- | --- | --- |
| Cultivation | Hero ritual | Core cultivation loop reads instantly; center feels sacred; Verse/lotus integration strengthens existing hero identity; readiness/next milestone/shortfall are explicit without hover-only dependence. | Scenic quality improves while practical progression truth becomes ambiguous. | Identity, Truth, Stability, Accessibility. |
| Status | Hero ritual | Character state and build-impact truth are scannable; stat blocks remain stable under focus/hover; hierarchy supports quick decision checks. | Dense stat content restyled with ornate framing that reduces scan speed or hides critical differentials. | Truth, Stability, Identity. |

### Scenic world

| Visible surface | Dominant family | Local definition of done | Common false-done trap | Key acceptance emphasis |
| --- | --- | --- | --- | --- |
| World Hub | Scenic world | World atmosphere remains primary; route/module destinations are explanatory and legible; commitment and readiness implications are visible without tooltip-only dependency; command rails are stable. | Map looks richer but route consequences and action eligibility become unclear. | Identity, Truth, Stability, Accessibility. |

### Module activity surfaces

| Visible surface | Dominant family | Local definition of done | Common false-done trap | Key acceptance emphasis |
| --- | --- | --- | --- | --- |
| Outskirts | Module activity | Encounter/access loop is role-clear; readiness and expected outcome direction are visible; action controls remain stable across recommended/warning states. | Mood pass hides readiness blockers or causes action control shifts. | Truth, Stability, Identity. |
| Ruins | Module activity | Risk/reward context is explicit; player can read readiness and shortfall quickly; navigation and engagement controls remain stable and coherent in Low FX. | Atmospheric detail dominates while practical route clarity degrades. | Truth, Accessibility, Stability. |
| Gate Trial | Module activity | Player can answer “am I ready, what is missing, what is safety net, what next” without leaving screen; all state signals are baseline-visible and stable. | Trial surface looks authoritative but one or more critical answers require hidden/secondary discovery. | Truth, Accessibility, Stability. |
| Manual Pavilion | Module activity | Library-first identity remains; selection, readability, and state stability are clean; recommendation and readiness semantics are explicit. | Library style improves while selection state becomes color-only or hover-dependent. | Identity, Truth, Stability. |
| Apothecary | Module activity | Crafting intent, requirements, and shortfalls are explicit; actions and resource states remain stable across interaction states; low-tier rendering remains readable. | Ornate treatment obscures ingredient deficits or action viability. | Truth, Stability, Accessibility. |
| Forge | Module activity | Upgrade/build outcomes and requirements are clear; recommendation/warning states are explicit and stable; module retains place-like identity. | Upgrade chrome looks premium but outcome truth or requirement clarity regresses. | Truth, Stability, Identity. |
| Bounties | Module activity | Available/locked/ready bounty states are immediately visible; reward/risk signal is truthful; list rows and action controls are stable. | List feels polished yet gating logic or outcome implications are unclear. | Truth, Stability, Accessibility. |
| Expeditions | Module activity | Route selection, readiness, and expected consequences are baseline-visible; long-duration/offline implications remain explicit; controls remain layout-stable. | Expedition visuals improve while route commitment implications become hidden or vague. | Truth, Accessibility, Stability. |

### Dense management surfaces

| Visible surface | Dominant family | Local definition of done | Common false-done trap | Key acceptance emphasis |
| --- | --- | --- | --- | --- |
| Inventory | Dense management | Fast scan/read operation is preserved; sort/filter/select interactions remain geometry-stable; item-state truth does not rely on color alone. | Visual polish introduces row/card jitter or tooltip-only item state meaning. | Stability, Truth, Accessibility. |
| Techniques | Dense management | Technique readiness, shortfall, and recommendation are visible at scan speed; row/card states remain stable under rapid interaction. | Selection effects look appealing but decisive unlock/shortfall truth becomes hidden or noisy. | Truth, Stability. |
| Prestige main screen | Dense management | Reset/keep/rebuild blocks are explicit and legible; chapter-state implications are truthful; decision zones remain stable and non-ambiguous. | Screen appears ceremonial but reset consequences or chapter constraints are unclear. | Truth, Accessibility, Stability, Identity. |

### Ritual modals / chapter-end surfaces

| Visible surface | Dominant family | Local definition of done | Common false-done trap | Key acceptance emphasis |
| --- | --- | --- | --- | --- |
| Prestige ritual | Ritual modal | Ritual framing is ceremonial and readable; reset consequence summary is visible before confirmation; action bands remain stable. | Modal tone improves while consequence text is compressed, hidden, or delayed. | Truth, Identity, Stability, Accessibility. |
| Current Chapter Exhausted | Ritual modal | Terminal chapter state is explicit; available next actions are clear; no implication of unavailable future content; low-tier modes preserve clarity. | Dramatic copy/presentation implies progression paths not supported by current build. | Truth, Accessibility. |
| Life Summary | Ritual modal | Run outcomes, major causes, and next-step orientation are readable without hover-only dependence; summary hierarchy remains coherent in Low FX/Reduced Motion. | High-fidelity summary looks strong but key outcome semantics disappear in constrained modes. | Truth, Accessibility, Stability. |
| Breakthrough / ritual chapter-end surfaces | Ritual modal | Breakthrough gating, readiness, and consequence direction are explicit; ceremonial framing supports but does not replace decision clarity; action controls stay stable. | Ritual spectacle masks gating truth or creates implied mechanics beyond supported flow. | Truth, Identity, Stability. |

## Deferred-work doctrine inside done claims

Deferred items are allowed only as **deferred but non-blocking** when all conditions hold:

1. deferred item is explicitly named in packet output;
2. deferred item is mapped to a future packet or scope bucket;
3. deferred item does not falsify any claimed axis;
4. deferred item does not introduce contradictions on touched surfaces.

Automatic blocking failures:

- deferred item hides unresolved truth failure;
- deferred item hides continuity violation;
- deferred item hides known layout instability;
- deferred item hides accessibility breakage in Low FX or Reduced Motion.

## Overhaul-level done summary (current slice)

The overhaul slice is done only when all in-scope surfaces satisfy both:

1. the global acceptance matrix; and
2. their relevant local done clauses in this registry.

This requires all of the following:

- no surface implies unsupported mechanics;
- hero/dense identity split is preserved by family;
- continuity is preserved under additive-first law;
- major interaction states remain layout-stable;
- critical states survive Low FX and Reduced Motion;
- new art requests remain missing-role justified only;
- work remains packetizable, reviewable, and evidence-backed.

## Relationship to release docs

- Release docs may cite this registry for UI done judgments.
- This registry is doctrine source for UI done semantics and completion distinctions.
- This registry does not replace release-wide go/no-go process or release signoff ledgers.

## Future packet usage rule

Later UI packets must:

1. cite the relevant local done clause(s) for each target visible surface;
2. state whether they claim packet complete, surface locally done, or cleanup-eligible;
3. list all deferred but non-blocking work explicitly.

Packets that omit these declarations are incomplete by doctrine.

## Non-goals

- not a signoff ledger;
- not a screen redesign document;
- not a packet template;
- not implementation code;
- not an issue backlog.

## P1 closeout clause (P1-06)

Phase 1 closeout for support-art governance is complete only when all are explicit:

1. exit audit verdict is published (`docs/ui/phase-1-exit-audit.md`);
2. packaging ledger truth is published (`docs/ui/phase-1-asset-packaging-ledger.md`);
3. phase-2 handoff scope is published (`docs/ui/phase-1-phase2-handoff.md`);
4. every Phase 1 packet is statused (green/partial/blocked/deferred) with one-sentence reason;
5. no packet claims packaged readiness when family roots are scaffold-only.

A Phase 1 packet set may be governance-complete yet packaging-partial; both states must be reported truthfully.
