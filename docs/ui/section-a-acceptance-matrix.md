# Section A.10 — Acceptance Matrix

## Purpose

This file formalizes the v3 Section 10 acceptance material into standalone Section A doctrine. It exists so later packets can claim completion using explicit acceptance axes instead of vague quality language.

This file inherits Section A doctrine and current repo truth from:

- `docs/ui/section-a-global-doctrine.md` (A.1);
- `docs/ui/section-a-touchpoint-registry.md` (A.4);
- `docs/ui/section-a-four-layer-model.md` and `docs/ui/section-a-screen-family-matrix.md` (A.5);
- `docs/ui/section-a-cutover-gate.md` (A.6);
- `docs/codex/UI_PACKET_SCHEMA.md` (A.8);
- `docs/ui/section-a-layout-stability-rules.md` and `docs/ui/section-a-truth-surfacing-rules.md` (A.9).

This file governs acceptance judgment only. It does not implement UI changes.

## Scope note

This file governs:

- overhaul-level acceptance axes;
- universal per-screen QA checks;
- supporting accessibility and performance constraints that acceptance depends on;
- packet author and reviewer usage when judging whether work is done.

This file does **not** govern:

- implementation code;
- cutover workflow details;
- release-wide signoff process;
- packet template structure;
- screen redesign content;
- gameplay tuning.

## Definitions

- **Acceptance axis** — A named rule dimension that must pass for work to count as done.
- **Relevant axis** — An axis that genuinely applies to the packet class and target visible surface being judged.
- **Blocking failure** — A failure that prevents honest done claims for packet complete or surface locally done status.
- **Supporting evidence** — Artifacts used to judge axis claims (exact target surface screenshots, QA path, visible UI behavior, signoff references, audit hooks).
- **Local done clause** — A surface-specific done statement that applies in addition to global acceptance axes.

## Overhaul-level acceptance axes (canonical)

| Acceptance axis | What must be true | Common failure mode | Typical supporting evidence |
| --- | --- | --- | --- |
| **Truth** | No screen implies a mechanic the current build does not support; critical truth remains explicit. | UI implies unavailable actions, guarantees, or hidden mechanics; critical meaning is hover-only. | Surface behavior on exact target visible surface, truth diagnostics, A.9 truth doctrine checks. |
| **Identity** | Family identity is preserved: hero ritual surfaces scenic/ceremonial, dense management surfaces sober/stable, other families aligned to A.5 matrix. | Generic restyle flattens family distinctions; dense surfaces become ornamental or hero surfaces become dashboard-flat. | Screen captures by family, A.5 family mapping, packet family declaration. |
| **Continuity** | No old art or incumbent ownership is stripped before additive replacement is complete and truthful. | Destructive cleanup hidden inside additive work; scenic ownership removed before legal cutover. | Before/after additive evidence, retained old layer declaration, A.6 references. |
| **Stability** | Major hover/selection/recommended/ready/warning states do not shift layout or decision geometry. | State badges or interaction states resize controls, rows, cards, tabs, or action bands. | A.9 layout checks, live-surface visual audit hooks, direct interaction evidence. |
| **Accessibility** | Critical states remain legible in Low FX and Reduced Motion; focus and non-color semantics remain explicit. | Critical meaning disappears when motion/FX are reduced; color-only critical encoding; weak focus visibility. | High/Low/Reduced comparisons, keyboard focus checks, A.9 truth/stability alignment. |
| **Art discipline** | New art requests occur only for genuinely missing roles with explicit missing-role basis. | New art requested to mask layout debt or replace reusable assets without necessity. | A.3 request records, packet `Art request status`, documented missing-role proof. |
| **Codex readiness** | Work can be expanded into bounded implementation prompts with exact scope, target visible surface, and explicit acceptance claims. | Prompt cannot be executed without guesswork; touchpoints or completion logic are ambiguous. | Packet schema fields (A.8), explicit axes claimed, local done clause citation. |

Rules:

1. The seven axes above are the only overhaul-level acceptance axes.
2. A packet must claim pass/fail/N/A by axis only where relevance is legitimate.
3. A packet must not claim an axis passed if known deferred work contradicts that axis.

## Universal per-screen QA checklist (when relevant)

The following checks apply to target visible surfaces when the surface contains the relevant behavior.

1. **High FX readability check**
   - Check: High FX preserves readable hierarchy and action clarity.
   - Relevant when: surface has enhanced atmosphere, glow, pulse, animated overlays, or decorative motion.
   - Failure: high-fidelity effects obscure text, actions, or decision-state comprehension.

2. **Low FX coherence check**
   - Check: Low FX mode remains coherent, readable, and visually stable.
   - Relevant when: any atmospheric treatment has high/low tier variants.
   - Failure: low tier loses structure, hierarchy, or critical labels.

3. **Reduced Motion critical-state check**
   - Check: Reduced Motion preserves all critical truths and interaction comprehension.
   - Relevant when: motion or pulse feedback is part of visible state communication.
   - Failure: critical states disappear or become ambiguous after motion reduction.

4. **Interaction-state layout stability check**
   - Check: hover, selected, recommended, ready, and warning states are geometry-stable.
   - Relevant when: surface includes interactive controls, chips, cards, rows, tabs, headers, or action bars.
   - Failure: state change causes control growth, row jumps, card expansion, or action-band displacement.

5. **Mockup mood alignment check**
   - Check: delivered surface still reflects intended atmosphere direction for its family.
   - Relevant when: packet claims atmosphere or polish improvements.
   - Failure: screen loses intended mood or violates family role while passing superficial styling checks.

6. **Gameplay truth visibility check**
   - Check: gameplay truth surfaces stay legible: next milestone, readiness, shortfall, safety-net, and current chapter exhausted when relevant.
   - Relevant when: surface presents progression, readiness, risk, chapter state, or decision outcomes.
   - Failure: key truth requires hover/discovery or conflicts with current gameplay meaning.

Checklist usage law:

- “When relevant” requires explicit relevance judgment, not omission by convenience.
- Any failed relevant checklist item is a blocking failure for surface locally done claims.

## Supporting accessibility and performance guard rails (acceptance dependencies)

These are supporting acceptance constraints. They are not additional acceptance axes.

### Accessibility dependencies

1. Readable system text must remain in the DOM.
2. No critical state may rely on color alone.
3. Tooltips may elaborate but must not contain the only important information.
4. Focus states must remain obvious, even on ornate chrome.

### Performance/runtime discipline dependencies

1. One continuous active Pixi scene per major screen maximum.
2. Blur/filter usage must respect tier budgets.
3. Hero widgets must remain lightweight enough to preserve interaction clarity.
4. Atlas/reuse/nine-slice discipline must be followed before new heavy visual assets are introduced.
5. Low-tier fallback must resolve to DOM chrome plus static overlays with no continuous particles.

Acceptance dependency law:

- If performance overload or FX design makes a surface unreadable or unstable, the related axis fails even when local art quality appears high.

## Acceptance applicability by packet class

| Packet class | Axes always relevant | Axes that may be `N/A` | Common blocking failure |
| --- | --- | --- | --- |
| `docs-only` | Codex readiness, Truth (doctrinal accuracy), Continuity (no implied destructive permission) | Identity, Stability, Accessibility, Art discipline when no surface claims exist | Doctrine text allows ambiguous completion language, contradicts A.1/A.6/A.9, or implies hidden cleanup. |
| `infra-only` | Continuity, Codex readiness, Truth (no mechanic implication drift in infra claims) | Identity/Stability/Accessibility may be `N/A` only if no visible surface behavior is altered | Infra packet introduces destructive visual consequence or hidden migration semantics without surface/legal framing. |
| `additive screen enhancement` | Truth, Identity, Continuity, Stability, Accessibility, Codex readiness | Art discipline may be `N/A` only when no art request is involved and this is stated | Claims additive done while violating layout stability, truth visibility, or retained-old-layer declaration. |
| `cleanup request after cutover review` | All seven axes plus A.6 legality confirmation | None for claimed target screen; only unrelated surfaces can be `N/A` | Cleanup claimed without exact A.6 signoff, exact target visible surface, and exact unlocked cleanup scope. |

Rules:

1. Packet class never overrides axis truth.
2. `N/A` must include explicit reason.
3. “Looks complete” is never axis evidence.

## Acceptance interpretation by screen family

| Dominant screen family | Identity emphasis | Stability emphasis | Truth/Accessibility risk pattern |
| --- | --- | --- | --- |
| Hero ritual | Scenic and ceremonial center remains authoritative; ritual framing elevates decisions without obscuring meaning. | CTA clusters and ritual decision bands remain geometry-stable across states. | Risk: atmosphere overwhelms critical truth; ensure readiness/stakes remain visible in Low FX and Reduced Motion. |
| Scenic world | Atmospheric world ownership stays primary while explanatory overlays remain explicit. | Route cards, chips, and command rails must not resize under selection or recommendation changes. | Risk: scenic prominence hides route/commitment truth; maintain baseline-visible status and consequence. |
| Module activity | Surface reads as place-like and role-clear for its module function. | Module queues/cards/status rows remain stable through ready/warning transitions. | Risk: module-specific ornament masks blockers/shortfall; enforce explicit non-hover truth. |
| Dense management | Sober, stable, fast scan behavior dominates over ornament. | Highest strictness: rows, columns, inspectors, and filter controls must not shift during rapid interaction. | Risk: color-only density and tooltip dependence; require explicit labels/chips and focus clarity. |
| Ritual modal | Ceremonial framing with clear decisions, outcomes, and consequence language. | Confirmation blocks and action bands remain fixed while state labels change. | Risk: dramatic presentation obscures irreversible choice meaning or chapter state outcomes. |

## Reviewer rejection rules

Reviewers must reject claimed acceptance pass if any of the following occurs:

1. Claimed axis is contradicted by visible behavior on the target visible surface.
2. Deferred work invalidates a claimed axis.
3. Packet claims done without naming which axes passed and which are `N/A` with reason.
4. Surface appears visually strong but still fails Truth, Continuity, Stability, or Accessibility.
5. Packet claims additive completion while implying cleanup legality without A.6 basis.
6. Packet claims cleanup-ready status when only packet complete or surface locally done status is evidenced.

## Relationship to A.6 and A.9

- A.6 governs cleanup legality and exact-screen cutover approval.
- A.9 governs layout stability and truth surfacing doctrine.
- A.10 uses A.6 and A.9 inside acceptance judgment.
- A.10 does not replace A.6 cutover law or A.9 surface doctrine.

## Future packet usage rule

Every later UI packet must explicitly state:

1. which acceptance axes it claims to satisfy;
2. which axes are `N/A` and why;
3. which local done clause from `docs/ui/section-a-definition-of-done-registry.md` applies to the target visible surface;
4. what supporting evidence backs each claimed axis.

Packets that omit this declaration are incomplete by doctrine.

## Non-goals

- not a release signoff file;
- not a packet template;
- not a cutover workflow;
- not implementation code;
- not a screen redesign spec.
