# Phase 1 — P1-01 Wave 0 Asset Audit Refresh and Preserve-Owner Lock

## Packet identity
- Packet ID: `P1-01`
- Packet class: `docs-only`
- Current phase: `Phase 1 — Support-art generation and asset preparation`
- Objective: refresh Wave 0 asset governance so later Phase 1 packets inherit one explicit preserve / enhance / create-later record without repaint drift.

## Purpose and scope
This audit is a governance artifact for Wave 0. It classifies current asset families using the current repository snapshot and blocks destructive interpretation in later Phase 1 prompts.

In scope:
- classify mandatory families into `preserve-core`, `preserve-enhance`, or `create-later-only`;
- lock preserve-owner map by screen family;
- record blocked requests and hard bans;
- provide Wave 0 gating rules for later support-art prompts.

Out of scope:
- generating art;
- editing runtime code;
- editing live assets under `src/assets/`;
- cleanup or replacement directives.

## Authoritative source order used for this packet
1. Latest repo snapshot (file existence and current tree)
2. `docs/ui/section-a-asset-constitution.md`
3. `docs/ui/section-a-touchpoint-registry.md`
4. `docs/ui/section-a-touchpoint-registry.json`
5. `docs/ui/section-a-asset-request-rules.md`
6. `docs/ui/section-a-screen-family-matrix.md`
7. `docs/codex/PROMPT_STYLE.md`
8. `docs/codex/UI_PACKET_SCHEMA.md`
9. `docs/codex/UI_SECTION_A_PACKET_TEMPLATE.md`
10. Current Phase 1 intent already captured in-repo

## Verification basis (current repo snapshot)
- Git basis: branch `work`, short commit `683f3e0`.
- Verification method: direct path existence checks against repository files/directories.
- Stale appendix assumptions were not treated as authority.

## Repo roots verified
- `src/assets/background/`
- `src/assets/background/citystates/`
- `src/assets/menus/`
- `src/assets/onscreen/`
- `src/assets/ui/book_spines/`
- `src/assets/icons/`
- `src/assets/items/ui/`

## Bucket taxonomy
- `preserve-core`: existing family remains visual/semantic owner; only additive integration support allowed.
- `preserve-enhance`: existing family remains in place, but can be strengthened additively by shared support usage.
- `create-later-only`: no Wave 0 production; later support-art allowed only with missing-role proof and additive screenshots.

## Family classification table

| Family | Exact repo evidence | Bucket | Reason | First-wave rule | Later note / trigger |
| --- | --- | --- | --- | --- | --- |
| Path portraits | `src/assets/menus/path_heaven 1.png`; `src/assets/menus/path_earth 1.png`; `src/assets/menus/path_martial 1.png` | preserve-core | Path identity anchor is already active and screen-defining. | Keep portrait triptych ownership; no portrait replacement. | Later support overlays only after additive proof; portraits remain base owner. |
| Bookshelf / spines | `src/assets/ui/book_spines/spine_heaven.png`; `src/assets/ui/book_spines/spine_earth.png`; `src/assets/ui/book_spines/spine_martial.png`; `src/assets/ui/book_spines/spine_neutral.png` | preserve-core | Manual/library identity depends on current spine family. | Keep spine ownership and shelving identity in place. | Support labels/frames may be added only as subordinate wrappers. |
| World scenic owners | `src/assets/background/city.png`; `src/assets/background/citystates/city.png`; `src/assets/background/citystates/city_alchemy.png`; `src/assets/background/citystates/city_apothecary.png`; `src/assets/background/citystates/city_bounties_expeditions.png`; `src/assets/background/citystates/city_forge.png`; `src/assets/background/citystates/city_gate.png`; `src/assets/background/citystates/city_manual.png`; `src/assets/background/citystates/city_outskirts.png`; `src/assets/background/citystates/city_ruins.png`; `src/assets/background/citystates/city_talisman.png`; `src/assets/background/citystates/citygreen.png` | preserve-core | World map + citystate overlays are current scenic owner stack. | Preserve city + citystate ownership. | Label plaques can be requested later only if label role remains unresolved. |
| Forge scenic owners | `src/assets/background/forgewide_empty.png`; `src/assets/background/forgewide_unshaped.png`; `src/assets/background/forgewide_shaping.png`; `src/assets/background/forgewide_shaped.png` | preserve-core | Forgewide family already provides state-aware room ownership. | No forgewide replacement. | Later masks/FX support only if additive screenshots prove missing compositing role. |
| Room/backdrop owners | `src/assets/background/manualpavilion.png`; `src/assets/background/tech.png`; `src/assets/background/bountyboard.png` | preserve-core | Manual/Tech/Bounty boards have active room ownership roles. | Keep scenic owners as base layers. | Additive support chrome only; no scenic repaint. |
| Expedition semantic owner | `src/assets/icons/hourglass_empty.png`; `src/assets/icons/hourglass_progress.png` | preserve-core | Hourglass family is active expedition timing semantic anchor. | Preserve hourglass semantics in Wave 0. | Optional support underlays only when state role is proven missing. |
| Cultivation semantic owner | `src/assets/onscreen/qi_lotus_closed.png`; `src/assets/onscreen/qi_lotus_open.png`; `src/assets/onscreen/qi_lotus_full.png` | preserve-core | Lotus progression remains a live cultivation semantic. | Preserve lotus family as current semantic owner. | Enhancement wrappers may appear later but must not replace lotus states. |
| Cultivator / dantian hero base | `src/assets/onscreen/cultivator_backshots.png`; `src/assets/onscreen/cbg_full.png`; `src/assets/onscreen/qisign.png`; `src/ui/cultivation/DantianOrb.tsx` | preserve-core | Current cultivator center stack is already integrated in active surfaces. | No cultivator-center replacement. | Hero overlays are deferred to later wave with explicit proof. |
| Legacy menu support primitives | `src/assets/menus/buttoncorners.png`; `src/assets/menus/scroll.png`; `src/assets/menus/bar_long.png`; `src/assets/menus/bar_short.png`; `src/assets/menus/block_fancy.png` | preserve-enhance | Existing support primitives are broadly reusable and still functional. | Keep current primitives in place and strengthen compositionally. | New variants only if multi-screen missing-role proof is provided. |
| Paper/ink shell | `src/ui/ink/InkPanel.tsx`; `src/ui/ink/PaperCard.tsx`; `src/ui/ink/PaperChip.tsx`; `src/ui/ink/InkModalFrame.tsx`; `src/styles/paperInkTokens.scss` | preserve-enhance | Existing shell already owns many truth surfaces. | Preserve shell and improve hierarchy additively. | Shared support chrome can extend shell after evidence of reusable role gaps. |
| Dantian/altar/orb truth surfaces | `src/ui/cultivation/DantianOrb.tsx`; `src/ui/cultivation/VerseMiniBar.tsx`; `src/ui/cultivation/QiLotusIcon.tsx` | preserve-enhance | Existing cultivation UI surfaces are live and should be reinforced first. | Keep current component ownership and refine additively. | Later overlays only if role remains missing after additive pass. |
| Gate Trial / Outskirts shell alignment | `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx`; `src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx` | preserve-enhance | Existing module shells are current owner structure for module activity flow. | Preserve module shells during Wave 0. | Shared support kits may be layered later with no shell replacement. |
| Workshop + apothecary foundations | `src/assets/background/alchemylab_idle.png`; forgewide family above | preserve-enhance | Existing room foundations already carry scene context. | Preserve room foundations and add support wrappers only. | Later masks/FX support gated by missing-role proof. |
| Shared frame atlas variants | none yet (support role only) | create-later-only | Missing role: standardized reusable frame variants for multiple screen families that cannot be fulfilled by current primitives alone. | Do not request in Wave 0. | Trigger: additive screenshots from 2+ screens show unresolved frame-role gap. |
| Plaque / ribbon / title-plate family | none yet (support role only) | create-later-only | Missing role: unified reusable title/label strips for cross-screen headers and badges without scenic replacement. | Do not request in Wave 0. | Trigger: current bars/blocks cannot represent required shared label states across multiple screens. |
| World / building label plaques | none yet (support role only) | create-later-only | Missing role: diegetic world/building label carriers that preserve city scenic ownership and improve label consistency. | Do not request in Wave 0. | Trigger: world/building screenshots show unresolved label grounding role. |
| Overlay / mask pack | none yet (support role only) | create-later-only | Missing role: reusable compositing masks/overlays to improve legibility while preserving current owners. | Do not request in Wave 0. | Trigger: additive captures show recurring compositing gap in multiple screens. |
| State underlays / recommendation swashes / tracked stamps | none yet (support role only) | create-later-only | Missing role: shared state-marking underlays/stamps for recommendation/tracking states that current chips cannot represent consistently. | Do not request in Wave 0. | Trigger: state readability gaps persist across at least two surfaces after additive shell pass. |
| Shared FX sprite atlas | none yet (support role only) | create-later-only | Missing role: restrained reusable FX vocabulary for consistent high/low/reduced feedback across supported surfaces. | Do not request in Wave 0. | Trigger: atmosphere role remains unresolved after static support layers are in place. |
| Cultivation hero enhancement overlays | none yet (support role only) | create-later-only | Missing role: additive emphasis layers around preserved cultivator/dantian center without replacing base semantic owners. | Do not request in Wave 0. | Trigger: approved additive cultivation captures still show unresolved hero-emphasis support role. |
| Heart Law altar / seal support kit | none yet (support role only) | create-later-only | Missing role: reusable altar/seal support kit for Heart Law sacred-focus framing while preserving current doctrine shell. | Do not request in Wave 0. | Trigger: Heart Law composition evidence shows unresolved sacred-focus support role. |
| Optional medallions / icon seals | none yet (support role only) | create-later-only | Missing role: optional reusable ornament seals that are non-blocking and subordinate to functional labels. | Do not request in Wave 0. | Trigger: only after core support roles are met and optional ornament role is still explicitly missing. |

## Screen-family preserve-owner map
- **Life Start / Path Selection** → preserve `path_heaven/earth/martial` full-height triptych ownership.
- **Heart Law / Dao Heart** → preserve current doctrine shell and current heart-law / mind-view ownership (`HeartLawMindView`, `ChangeHeartLawModal`, `DaoHeartModal`) until later support proof exists.
- **Cultivation** → preserve current cultivator/dantian center (`cultivator_backshots.png`, current dantian center stack) + lotus family + doctrine/truth surfaces.
- **Status** → preserve current diagnostic parchment/ink truth surfaces (`RunCompass`, `PostFailureDiagnosisPanel`, `ui/ink` shell).
- **World** → preserve `city.png` and `citystates/*` overlays as scenic owner.
- **Manual Pavilion** → preserve bookshelf/spine family and `manualpavilion.png`.
- **Techniques** → preserve current Inner Palace / altar backdrop and `tech.png`.
- **Outskirts** → preserve current field/combat shell ownership (`OutskirtsBuildingPanel` module shell).
- **Ruins** → preserve current ruins module shell ownership (`RuinsBuildingPanel`).
- **Gate Trial** → preserve current gate/combat shell ownership (`GateTrialBuildingPanel`).
- **Apothecary** → preserve current room foundation (`alchemylab_idle.png`) and pouch shell behaviors.
- **Forge** → preserve forgewide room family and workshop centerpiece ownership.
- **Bounties** → preserve `bountyboard.png` and posted-paper board identity.
- **Expeditions** → preserve current board shell and hourglass family.
- **Prestige / ritual modals** → preserve current ritual parchment shell until decree/plaque support kits are explicitly approved.

## Blocked-request list
- Requesting portrait repaints.
- Requesting bookshelf/spine family repaint.
- Requesting forgewide family replacement.
- Requesting world map/city scenic repaint.
- Requesting cultivator-center replacement.
- Requiring full icon-overhaul before support-art packets can proceed.
- Using support-art packets to hide cleanup/replacement work.

## Hard bans (explicit)
1. No portrait repaint.
2. No bookshelf repaint.
3. No forgewide replacement.
4. No world repaint.
5. No cultivator-center replacement.
6. No full icon-overhaul prerequisite.

## Wave 0 rule lock
- Current assets first.
- Additive screenshot proof first.
- No support-art request without missing-role proof.

## Verification notes
- This refresh is path-driven and rooted in current file existence.
- Paths were not guessed and `.scss` companions were not inferred when absent.
- This packet is governance-only and does not authorize destructive cleanup.

## Acceptance criteria
- `docs/ui/phase-1-p1-01-wave0-asset-audit.md` exists and records explicit preserve / enhance / create-later governance.
- Every mandatory family from packet requirements is classified.
- Every create-later family includes a missing-role statement and trigger.
- Preserve-owner map is explicit for all required screen families.
- Blocked requests and hard bans are explicit and non-ambiguous.
- Wave 0 gates clearly enforce current-assets-first and additive-proof-first.
