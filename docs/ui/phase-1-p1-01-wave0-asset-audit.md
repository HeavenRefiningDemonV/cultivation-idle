# Phase 1 P1-01 — Wave 0 asset audit and support-art backlog kickoff

## Purpose
Classify the current asset base honestly and prove what support art is truly missing before any art generation begins.

## Packet identity and alias mapping
- Packet class: `docs-first / asset-prep / audit`
- Requested alias: `P0-16`
- Canonical mapping: `Phase 1 / P1-01 / Workstream 1.1 / Wave 0 asset audit`
- Title: `Wave 0 asset audit and support-art backlog kickoff`
- Depends on: `P0-15` handoff packet plus Section A doctrine stack
- Downstream packets:
  - `Phase 1 / P1-02` shared frame atlas + plaque/ribbon generation
  - `Phase 1 / P1-03` overlays / masks / state underlays
  - `Phase 1 / P1-04` shared FX atlas
  - `Phase 1 / P1-05` later-wave hero overlay prep

## Dependency state
- `P0-15` exists and records branch-level verdict `NOT SAFE FOR PHASE 1` until screenshot-proof gaps are closed.
- Section A doctrine docs for asset constitution, request rules, cutover gate, truth surfacing, layout stability, and touchpoint registry are present.
- `docs/release/live_surface_visual_audit.md` and Phase 0 packet evidence folders are present.
- Latest redesign/implementation `.docx` files are not present in this repository snapshot; this packet therefore uses the in-repo Section A and Phase 0 docs as authoritative sources.

## Deep doctrine sources consumed
- Packet contract/meta docs:
  - `docs/codex/PROMPT_STYLE.md`
  - `docs/codex/UI_PACKET_SCHEMA.md`
  - `docs/codex/UI_SECTION_A_PACKET_TEMPLATE.md`
  - `docs/codex/SECTION_A_PACKET_QUEUE.md`
  - `docs/codex/SECTION_A_PROMPT_PRELUDE.md`
- Section A doctrine and governance:
  - `docs/ui/section-a-global-doctrine.md`
  - `docs/ui/section-a-asset-constitution.md`
  - `docs/ui/section-a-asset-request-rules.md`
  - `docs/ui/section-a-four-layer-model.md`
  - `docs/ui/section-a-screen-family-matrix.md`
  - `docs/ui/section-a-cutover-gate.md`
  - `docs/ui/section-a-layout-stability-rules.md`
  - `docs/ui/section-a-truth-surfacing-rules.md`
  - `docs/ui/section-a-touchpoint-registry.md`
  - `docs/ui/section-a-touchpoint-registry.json`
  - `docs/ui/section-a-definition-of-done-registry.md`
  - `docs/ui/section-c-baseline-audit.md`
- Release governance:
  - `docs/release/live_surface_visual_audit.md`
  - `docs/release/ui_cutover_red_flags.md`
  - `docs/release/ui_screen_signoff_sheet.md`
- Prior packet records:
  - `docs/ui/phase-0-p0-04-*.md` … `docs/ui/phase-0-p0-15-*.md`
  - `docs/release/qa/ui-cutover/phase-0-p0-*/README.md`

## Current asset roots verified
Verified in this repo snapshot (existence + current use in source):
- `src/assets/background/`
- `src/assets/background/citystates/`
- `src/assets/menus/`
- `src/assets/onscreen/`
- `src/assets/ui/book_spines/`
- `src/assets/icons/`
- `src/assets/items/ui/`

Notable preserve-first anchors verified by concrete files:
- path portraits: `src/assets/menus/path_heaven 1.png`, `path_earth 1.png`, `path_martial 1.png`
- book spines: `src/assets/ui/book_spines/spine_*.png`
- city overlays: `src/assets/background/citystates/city_*.png`
- forgewide backgrounds: `src/assets/background/forgewide_*.png`
- Manual Pavilion/Techniques scenic owners: `src/assets/background/manualpavilion.png`, `src/assets/background/tech.png`
- bountyboard scenic owner: `src/assets/background/bountyboard.png`
- expedition hourglass family: `src/assets/icons/hourglass_empty.png`, `hourglass_progress.png`
- qi lotus family: `src/assets/onscreen/qi_lotus_closed.png`, `qi_lotus_open.png`, `qi_lotus_full.png`
- cultivator/dantian center anchors: `src/assets/onscreen/cbg_full.png`, `src/assets/onscreen/qisign.png`, plus existing dantian UI stack
- legacy paper/ink material primitives: `src/assets/menus/buttoncorners.png`, `scroll.png`, `bar_long.png`, `bar_short.png`, `block_fancy.png`

## Preserve as core matrix
| family id | human label | real repo root(s) | current owner screens | why classification is correct | explicitly forbidden now | later wave/packet touch allowed |
| --- | --- | --- | --- | --- | --- | --- |
| core-path-portraits | Path portraits | `src/assets/menus/path_heaven 1.png`; `path_earth 1.png`; `path_martial 1.png` | Path / Life Start | First-contact identity owner remains intact in Phase 0 records. | Replacing portrait family or repainting hero triptych. | Wave 3 additive support overlays only (`P1-05`), no replacement. |
| core-book-spines | Book spine family | `src/assets/ui/book_spines/` | Manual Pavilion, Techniques-adjacent shelves | Existing shelves/spines are explicit identity anchors. | Replacing spine family or broad repaint of shelf art. | Wave 1 support labels/frames around spines (`P1-02`). |
| core-city-overlays | City + citystate overlays | `src/assets/background/city.png`; `src/assets/background/citystates/` | World and routed building context | Scenic world ownership remains primary in doctrine. | Repainting world map/city scenic base. | Wave 2/3 support overlays, labels only after proof (`P1-03`, `P1-04`). |
| core-forgewide | Forgewide background family | `src/assets/background/forgewide_empty.png`; `forgewide_unshaped.png`; `forgewide_shaping.png`; `forgewide_shaped.png` | Forge, World building modal forge variants | Forgewide family provides process-state scenic ownership. | Forge scenic repaint/replacement request in early waves. | Wave 1 support plaque/strip additions only (`P1-02`). |
| core-manual-tech | Manual Pavilion + Techniques scenic owners | `src/assets/background/manualpavilion.png`; `src/assets/background/tech.png` | Manual Pavilion, Techniques | These are current scenic room owners in active surfaces. | Scenic replacement and shell takeover. | Wave 1 support chrome; Wave 2 atmosphere accents only. |
| core-bountyboard | Bounty board scenic owner | `src/assets/background/bountyboard.png` | Bounties / Expeditions board family | Anchor element remains directionally correct post-P0-12. | Repainting/removing board as base owner. | Wave 1 support plaques/tags around board truth. |
| core-hourglass | Expedition hourglass icon family | `src/assets/icons/hourglass_empty.png`; `hourglass_progress.png` | Expedition route timing/readiness | Existing semantic icon family is already in use. | Icon-family replacement pass for taste-only reasons. | Wave 1 state underlays only if proof shows missing readability role. |
| core-qi-lotus | Qi lotus progression family | `src/assets/onscreen/qi_lotus_closed.png`; `qi_lotus_open.png`; `qi_lotus_full.png` | Cultivation center progression | Recognized cultivation progression semantic anchor. | Replacing lotus family in early waves. | Wave 3 hero enhancement wrappers only (`P1-05`). |
| core-cultivator-center | Cultivator / dantian center ownership | `src/assets/onscreen/cbg_full.png`; `src/assets/onscreen/qisign.png`; dantian UI stack | Cultivation, combat-facing context cards | Mechanics-semantic center remains foundational per doctrine. | Replacing cultivator center or dantian core art in Wave 0/1. | Wave 3 overlays after screenshot proof (`P1-05`). |

## Preserve but enhance matrix
| family id | human label | real repo root(s) | current owner screens | why classification is correct | explicitly forbidden now | later wave/packet touch allowed |
| --- | --- | --- | --- | --- | --- | --- |
| enh-buttoncorners | `buttoncorners` primitive | `src/assets/menus/buttoncorners.png` | shared shell/chips/buttons across many screens | Mature reusable primitive exists and is heavily used. | Replacing family without insufficiency proof. | Wave 1 atlas extension-compatible parts (`P1-02`). |
| enh-scroll | `scroll` parchment primitive | `src/assets/menus/scroll.png` | ritual/modal and ink-shell compositions | Existing thematic primitive supports current paper/ink language. | Throwing out scroll family in early waves. | Wave 1 compatible wrappers, no base replacement. |
| enh-bars | `bar_long` + `bar_short` strips | `src/assets/menus/bar_long.png`; `bar_short.png` | ribbons, strips, headers, compact bars | Existing bars are reusable but need disciplined variants. | Bespoke repaint bars per screen. | Wave 1 shared strip variants if missing role proven. |
| enh-block-fancy | `block_fancy` ornate block | `src/assets/menus/block_fancy.png` | card/chrome decorative accents | Existing primitive remains useful but composition varies by screen. | Replacing with unrelated frame family immediately. | Wave 1 harmonized variants and sizing rules. |
| enh-paper-ink-shell | Paper/ink shell family | `src/assets/menus/`; `src/assets/items/ui/`; current `src/ui/ink/*` consumers | Status, modals, support boards, ritual surfaces | Existing shell language is functional and should be extended first. | Declaring shell missing and skipping straight to repaint asks. | Wave 1 support chrome consolidation (`P1-02`). |
| enh-dantian-orb-presentation | Dantian/orb presentation | `src/assets/onscreen/qisign.png` with current dantian component stack | Cultivation center | Current center is correct base but can be additively reinforced. | Hero-center replacement art requests. | Wave 3 overlay support only after proof (`P1-05`). |
| enh-room-foundations | Workshop/apothecary room foundations | `src/assets/background/forgewide_*.png`; `src/assets/background/alchemylab_idle.png` | Forge, Apothecary | Room foundations are valid owners, support art can improve legibility. | Scenic room repaint wave in P1-01. | Wave 1 labels/frames; Wave 2 restrained FX support. |

## Create later only if still needed matrix
| family id | human label | real repo root(s) | current owner screens | why classification is correct | explicitly forbidden now | later wave/packet touch allowed |
| --- | --- | --- | --- | --- | --- | --- |
| later-frame-atlas | Shared frame atlas variants | planned root `src/assets/ui/chrome/frames/` | cross-screen support roles | Missing role is standardized reusable frame variants across many screens. | Immediate scenic replacement using frame request as excuse. | Wave 1 (`P1-02`) once screenshot proof identifies role gaps. |
| later-plaque-ribbon | Plaque/ribbon/title-plate family | planned root `src/assets/ui/chrome/plaques/` | status headers, world labels, bounty/prestige tags | Missing role is consistent cross-screen support labeling. | Per-screen decorative repaint requests. | Wave 1 (`P1-02`) after additive proof on targeted screens. |
| later-overlay-mask | Overlay/mask support pack | planned root `src/assets/ui/overlays/` | hero/dense surfaces requiring legibility support | Missing role is reusable compositing overlays beyond current wrappers. | Overlay pack used to hide unfinished layout/truth debt. | Wave 2 (`P1-03`) with multi-screen proof. |
| later-fx-atlas | Shared restrained FX atlas | planned root `src/assets/ui/fx/` | ritual, hero emphasis, state ambiance | Missing role is coherent low/high/reduced FX vocabulary across screens. | FX as substitute for readability/completion. | Wave 2 (`P1-04`) after atmosphere proof and no-shift validation. |
| later-world-label-kit | World/building label plaque kit | planned root `src/assets/ui/chrome/world_labels/` | World + routed building surfaces | Missing role is diegetic world/building labels with consistent support semantics. | Repainting world map or replacing city scenic ownership. | Wave 1/2 bridge (`P1-02` then targeted follow-up). |
| later-hero-overlays | Cultivation/ritual hero enhancement overlays | planned root `src/assets/ui/heroes/` | Cultivation, Prestige, selective ritual surfaces | Missing role is additive hero emphasis while preserving base owners. | Replacing cultivator/dantian center or path portraits. | Wave 3 (`P1-05`) only after screenshot approval. |
| later-state-underlays | Recommendation swashes/state underlays/tracked stamps | planned root `src/assets/ui/chrome/states/` | dense management + support boards | Missing role is consistent recommendation/readiness grounding. | Replacing truth text/controls with ornament. | Wave 2/3 after proof of current insufficiency. |
| later-medallion-seals | Selective medallions/icon seals | planned root `src/assets/ui/chrome/medallions/` | optional cross-screen ornament | Missing role is optional reusable ornament after core support roles land. | Any prerequisite claim blocking earlier waves. | Wave 4 optional only, never prerequisite. |

## Screen-by-screen preserved owner map
| screen | primary preserved owner families | preserve-first notes | first additive screenshot target |
| --- | --- | --- | --- |
| Path / Life Start | `core-path-portraits`, `enh-bars` | Keep portrait triptych ownership intact; only add support labels/frames. | Path card + selected path + all FX modes with preserved portrait base. |
| Cultivation | `core-cultivator-center`, `core-qi-lotus`, `enh-dantian-orb-presentation` | Keep cultivator+dantian as base owner; overlays only later and additive. | Cultivation hero center with readiness states and no-layout-shift proof. |
| Status | `enh-paper-ink-shell`, `enh-bars`, `enh-buttoncorners` | Preserve current diagnostic shell truth; support plaques can be additive only. | Status diagnostic rows/cards with recommended/warning state captures. |
| World | `core-city-overlays`, `later-world-label-kit` (planned only) | Keep city map ownership primary; labels must stay support-role. | World map + routed building panel with explicit label/readiness truth. |
| Manual Pavilion | `core-manual-tech`, `core-book-spines`, `enh-paper-ink-shell` | Keep pavilion scenic room and spines as owners; no shelf repaint requests. | Manual Pavilion shelf + tags + truth labels with no-shift interaction. |
| Techniques | `core-manual-tech`, `enh-paper-ink-shell`, `enh-dantian-orb-presentation` | Keep techniques scenic altar backdrop; overlay asks require proof later. | Techniques altar card selections with preserved backdrop and truth states. |
| Apothecary | `enh-room-foundations`, `enh-paper-ink-shell` | Keep apothecary room ownership and pouch semantics; add support chips only. | Apothecary route/readiness states in board + modal captures. |
| Forge | `core-forgewide`, `enh-room-foundations`, `enh-bars` | Keep forgewide room states as base owner; support rows/plaques additively only. | Forge requirement/source rows across hover/selected/warning states. |
| Bounties / Expeditions | `core-bountyboard`, `core-hourglass`, `enh-paper-ink-shell` | Keep board/hourglass semantics; prioritize reusable route tags and strips. | Bounty queue strip + expedition slot states with preserved board owner. |
| Prestige | `enh-paper-ink-shell`, `enh-bars`, `later-hero-overlays` (planned only) | Preserve ritual/decree foundations; no hero/scenic replacement asks. | Prestige ritual states with hold progress + no-jitter evidence. |

## Wave sequence and unlock criteria
- **Wave 0 (this packet):** classify current assets and lock backlog gating. No art generation.
- **Wave 1 (`P1-02`):** shared support chrome (frames/plaques/ribbons/title strips) only after per-target screenshot proof exists.
- **Wave 2 (`P1-03` + `P1-04`):** shared overlays/masks and restrained FX atlas after Wave 1 proves unresolved reusable role gaps.
- **Wave 3 (`P1-05`):** hero enhancement overlays only after exact-screen additive proof for targeted hero surfaces.
- **Wave 4 (optional):** selective ornament (medallions/seals) only if still justified.

Unlock criteria for any create-later family:
1. Additive screen evidence exists for exact target surfaces.
2. Missing role is explicit and reusable (not taste-based).
3. Request preserves scenic/base ownership.
4. Proof includes no-layout-shift and truth readability checks.

## Shared support-art backlog priority
1. Shared frame/plaque/ribbon/title-plate family (Wave 1)
2. World/building label plaques (Wave 1/2 bridge)
3. Overlay/mask pack + state underlays (Wave 2)
4. Shared restrained FX atlas (Wave 2)
5. Hero enhancement overlays for Cultivation/Prestige (Wave 3)
6. Optional medallions/seals (Wave 4, non-blocking)

## Screenshot-proof requirement for later art requests
Every later art request must cite, at minimum:
- one exact-screen base screenshot,
- one interaction or truth-state screenshot for the role,
- High FX / Low FX / Reduced Motion captures,
- evidence that preserve-core owners remain present,
- a missing-role sentence that cannot be solved by existing asset reuse/tint/nine-slice/layering.

Requests failing any proof item must be rejected as unjustified.

## Folder plan and asset placement
- Existing roots kept as authority for current owners:
  - `src/assets/background/`
  - `src/assets/menus/`
  - `src/assets/onscreen/`
  - `src/assets/ui/book_spines/`
- Phase 1 destination scaffolding (empty in this packet):
  - `src/assets/ui/chrome/`
  - `src/assets/ui/fx/`
  - `src/assets/ui/overlays/`
  - `src/assets/ui/heroes/`

## Immediate next-packet handoff
- Canonical next packet: `P1-02 — Shared frame atlas and plaque/ribbon family`.
- Required carry-forward artifacts:
  - `docs/ui/phase-1-support-art-backlog.json`
  - `docs/ui/phase-1-asset-spec-sheet.md`
  - `docs/ui/phase-1-wave0-screenshot-matrix.md`
- Guardrail reminder: no scenic repaint, no owner replacement, no cleanup permission implied.

## Scope confirmation
This packet is documentation and asset-program scaffolding only. Runtime UI code, gameplay stores, and real art files were not modified.
