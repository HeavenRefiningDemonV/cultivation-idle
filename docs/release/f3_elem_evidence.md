# F3-ELEM — the single pure element resolver (evidence)

**Packet:** D17 manifest #02 · Phase 0 · infra-only / foundation-mechanical (non-screen). **Class I, additive.**
Ships the one element resolver Combat (M.V) and Techniques (M.IV) both query, plus the canonical D3 catalog
(14 elements · 20 resonance edges · 19 directed opposition edges · 33 reactions · 21 states). **Logic + shape,
never numbers** (every magnitude is `[tune]` → D15), **never a surface** (renders nothing). **11 new files,
0 existing files edited.**

## 1 · Changed files

**New module — `src/systems/elements/` (6):**
- `elementTypes.ts` — `ElementId` (aliased onto the live `SpiritRootElement`), `Ring`, `ElementStateId` (21),
  `StateCategory`, `ReactionId` (33), `ReactionFamily` (10), `SealShape`, the catalog-record interfaces, and
  the resolver I/O types (`ElementWeights`, `ResolveCtx`, `AffinityResult`, `TargetElementState`, `StateDelta`,
  `ReactionEffect`, `ReactionEvent`, `ElementTuning`).
- `elementCatalog.ts` — the frozen roster (14, CANONICAL order) · resonance (20, degree-sum 40) · opposition
  (19 directed) · states (21); `ELEMENT_IDS … satisfies readonly SpiritRootElement[]`; `D3_LORE_NAME_BY_ELEMENT`.
- `reactionCatalog.ts` — the 33 reactions in priority order + `FAMILY_PRIORITY` + `SEAL_SHAPE_BY_FAMILY`.
- `elementTuning.ts` — `DEFAULT_ELEMENT_TUNING`: balance-inert `[tune]` defaults, each carrying its `// [tune]
  D15 #N — <constraint>` comment.
- `elementResolver.ts` — the four pure functions (`resolveAffinity` / `resolveResist` / `resolveReaction` /
  `resolveState`). No store/save/stat-engine/UI import; no RNG; no mutation.
- `index.ts` — the flat `export *` barrel (no UI types dragged into the systems tsc project, cf. meridians).

**New contract tests — `tests/contracts/*.contract.test.ts` (5):** `elementCatalogCompleteness`,
`elementVocabularyNoFork`, `elementResolverPurity`, `elementResolverDeterminism`, `elementContentReconciliation`.

**Edited: none.** No consumer wired (`combatStore`, `spiritRootCombatAdapter`, `techCollectionStore`, the
content manifest are untouched). No new JSON content pack.

## 2 · Dependency handling outcome

- **F0 element accents — partial:** only the 5 Ring-I accents exist; the 9 Ring II–IV accents are deferred
  (F0 / M.I). F3 records each element's accent token NAME as a string and emits no CSS, so this does not block.
- **F1 derived stat engine — not a prerequisite:** the resolver maps elements→outcomes; it never reads stats.
- **The live element vocabulary — reconciled (§3):** `ElementId` is aliased onto `SpiritRootElement`; the
  resolver id is **`lightning`**, not D3's lore spelling `thunder`. "Thunder / 雷" survives as `loreName`/`glyph`
  display metadata + `D3_LORE_NAME_BY_ELEMENT`. Renaming the live `lightning` was rejected (a destructive cutover
  across 10 files + a content pack); the resolver moves to the live spelling instead.
- **D15 numbers — deferred:** the `ElementTuning` shape is fixed; the values are balance-inert placeholders.

## 3 · Catalog shipped (transcribed verbatim from D3, structure only)

14 roster · 20 resonance (5 generation `G` + 15 kinship `K`; degree-sum 40, water = 5 the connector) · 19
opposition (5 pentagram + 4 storm-square + 1 fire▸ice + 6 duals + 3 cross-ring; no pair is both resonance and
opposition; duals are opposition-only) · 33 reactions across 10 families (cleanse 2 · control 5 · sever 4 ·
shred 4 · burst 4 · spread 4 · dot 5 · drain 2 · tempo 2 · catalyst 1) · 21 states (19 base + petrified + frozen).

The four pure functions hold the invariants: **purity** (same inputs → byte-identical outputs; no side effects /
RNG / mutation), **determinism** (reaction resolution by fixed family priority → ring → index → catalog order,
ICD-gated; cleanse-before-affliction, control-before-damage), **no immunity** (`resolveResist` ∈ [0, HARDCAP),
HARDCAP < 1 — now enforced in code, not just convention), **caps** (burst/sever effects carry `capped: true`),
and **composition** (DR-12: the resolver only RETURNS events/deltas; it never edits the damage formula, adds a
multiplier slot, writes saved data, or renders).

## 4 · Verification

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ (the catalog `satisfies SpiritRootElement`; the four signatures compile strict) |
| `npm run check:icons` | ✅ no emoji (CJK glyphs/seals are not emoji; the `★` was de-worded) |
| `npm run validate:content` | ✅ existing packs still valid (F3 adds none) |
| `npm run test:contracts` | ✅ **543 / 543** (was 538; +5 F3 `.contract.test.ts`, the floor rose in-diff) |
| `npm run build` | ✅ built ~7s |

**Adversarially verified (3 independent lenses, all PASS):** catalog re-derived faithful to D3 (every edge
direction, every reaction trigger/family/priority, the family tally, the state escalations); resolver invariants
(purity / resist∈[0,HARDCAP) / determinism / caps / composition); anti-fork & single-ownership (`ElementId`
aliased; `ELEMENT_IDS === CANONICAL_SPIRIT_ROOT_ELEMENTS`; no `id: 'thunder'`; barrel leaks no UI type; 0 files
edited; no content pack). Two hardening nits it raised were closed (the no-immunity floor is now enforced in
code; the derived maps are deep-frozen).

**Idle-parity:** the resolver is queried identically by idle auto-combat and active combat (a pure function over
the supplied state) — it serves both halves by construction and takes no tick.

## 5 · The reconciliation note (for M.IV / M.V)

The resolver's element id for the second Storm is **`lightning`** (the live spelling). "Thunder / 雷" is the lore
**label** only (`loreName`/`glyph`). `D3_LORE_NAME_BY_ELEMENT` documents the one divergence. Consumers query the
resolver; none re-implements element math or re-spells an element.

## 6 · Intentionally deferred (named, with owner)

- **9 Ring II–IV accent hex values** → F0 follow-up + M.I Constellation (astral must be gold-on-ink, never indigo).
  F3 names the token strings; it authors no hex.
- **All 16 D15 numeric deposits** → D15. F3 ships balance-inert defaults only.
- **Consumer wiring** → M.IV (techniques query `resolveReaction`/`resolveAffinity`), M.V (combat queries all four),
  M.VIII (roots feed the weight vector), M.I/§G (compass + seal-stamp render the emitted metadata).
- **Environmental fields / 15th element / dual roots / second-order reactions** → D3 §I extensibility (the reserved
  `ResolveCtx.environment` slot only; no logic).

## 7 · Diff scope confirmation

Additive-only; no consumer wired; no number tuned; no surface rendered; no save-shape change. Battery green with
+5 contract tests in-diff. `spiritRootResonance.ts` (root↔heart-law fit) left untouched — a different question.
