# Status V3 Dao Decommission Plan - Packet A Foundation

## Packet D completion update - 2026-05-24

Packet D removes default public Dao/Omen/Proof/Source/Mandate widgets outside Status while preserving internal diagnostic libraries and save compatibility.

- Cultivation now exposes local `Breakthrough Readiness` instead of compact Omen/proof/source UI.
- Gate Trial now keeps native Gate Readiness, checklist, safety-net, summary, and result surfaces without mandate lens/detail ownership.
- World, World modal, combat top lanes, Outskirts, and Ruins no longer inject `LocalMandateLensHeader` or public relation labels.
- Forge, Apothecary, Manual Pavilion, Pavilion/Records, Techniques, Bounties, and Expeditions no longer render `ModuleSourceSinkPanel` or public `mandateSourceSink` projections.
- Inventory, Offline Progress, and Settings now use Item Ledger, Return Report, and ordinary gameplay/UI settings language; old hidden guidance settings remain compatibility-only.
- Public-root static scans are clean. Remaining `LocalMandateLensSurface` strings are internal-only and classified by the vocabulary audit.
- Browser screenshot evidence was not captured in this pass because the in-app Browser capability was unavailable; static scans, focused contracts, typecheck, icon check, vocabulary audit, and build were used as the Packet D gate evidence.

## Summary
Packet A replaces stale sparse Dao/Omen public UI instructions with the Status V3 Cultivator Ledger target and prepares tests and audits for public Dao/Omen/Proof/Source decommission.

## Why Packet A exists
- `AGENTS.md` still described sparse omen/proof/reflection public UI as the target.
- Status V2 tests required `OmenSeal`, `ProofSealRow`, `SourceThreadDrawer`, `Current Omen`, `Gate Proof`, and `Recent Omens`.
- Cultivation, Gate Trial, World, modules, Offline Progress, Inventory, and Settings still contain public Dao/Omen/Proof/Source vocabulary or components.
- The vocabulary audit was built around the older V2-11 route-board cleanup and still treated concrete labels such as `Mission Requirements` as forbidden.

## New source-truth rules
- Status is the old-look Cultivator Ledger.
- Status owns whole-life synthesis.
- Local screens own local action and local explanation.
- Dao Mandate / Run Compass internals may remain internally for diagnostics, migration, historical docs, debug/specimen components, and negative tests.
- Public default Dao/Omen/Proof/Source/Mandate UI is forbidden.
- Non-destructive visual ownership applies: preserve-first, enhance-first, new-art-last.

## Status Ledger target
Future Status UI should reserve these target IDs:

- `status-ledger-root`
- `status-ledger-hero`
- `status-ledger-metrics`
- `status-ledger-grid`
- `status-ledger-mission-requirements`
- `status-ledger-cultivation-base`
- `status-ledger-current-work`
- `status-ledger-build-preparation`

Expected public areas include identity header, metric strip, three-column parchment grid, mission requirements rail, safety net, current work, build/prep, best improvements, recent changes, and Details / How calculated.

## Public forbidden terms
Default reachable public UI must not use these as primary labels:

- `Current Omen`
- `Gate Proof`
- `Recent Omens`
- `Source Thread`
- `Proof Detail`
- `Preparation Health`
- `Mandate Lens`
- `Module Source-Sink`
- `Threshold Omen`
- `Omen evidence`
- `Proof sealed`
- `Source sealed`
- `Mandate after return`
- `Current Mandate`
- `proof source handoff`
- `status snapshot only`
- `cultivation compact only`
- `Dao Mandate Interface`
- `Mandate points elsewhere`

## Forbidden public components
Default reachable public UI must not render:

- `OmenSeal`
- `ProofSealRow`
- `PressureBadgeRow`
- `ReflectionPlaque`
- `SourceThreadDrawer`
- `LocalMandateLensHeader`
- `ModuleSourceSinkPanel`
- `DaoMandateRouteButton`
- `MandateChamberHero`
- `RequirementLedger`
- `ReadinessLedger`
- `SourceRouteSlip`

## Required public vocabulary
Use concrete labels such as:

- `Cultivation Base`
- `Mission Requirements`
- `Gate Readiness`
- `Current Bottleneck`
- `Main Gap`
- `Best Improvements`
- `Safety Net`
- `Current Work`
- `Build & Preparation`
- `Identity & Doctrine`
- `Recent Changes`
- `Details`
- `How calculated`
- `Healing Reserve`
- `Pouch Fit`
- `Forge Floor`
- `Doctrine Stock`
- `Expedition Support`
- `Bounty Board`
- `Item Ledger`
- `Return Report`

## Screen ownership matrix
| Screen | Public language target |
| --- | --- |
| Status | Whole-life Cultivator Ledger: identity, metrics, mission requirements, bottleneck, improvements, safety net, current work, build/prep, recent changes, details. |
| Cultivation | Cultivation explains cultivation: Qi, realm, stage, stability, Heart Law, breath/focus, breakthrough readiness. |
| Gate Trial | Gate Trial explains gate readiness: minimum checklist, recommended prep, fail-safe, trial summary, readiness rail, attempt/result. |
| World | World explains city services, availability, ordinary service cues, active/idle hints, and travel context. |
| Forge | Forge explains `Forge Floor`, materials, next upgrade, queue, refine/temper/rune state. |
| Apothecary | Apothecary explains `Healing Reserve`, `Pouch Fit`, craft/buy next, ingredients. |
| Manual Pavilion / Techniques | Doctrine stock, path fit, study queue, fragments, and loadout fit. |
| Bounties | `Bounty Board`, tracked bounty, Merit reward, target, city need, claim state. |
| Expeditions | `Expedition Support`, idle slots, active routes, expected yield, shortage fit. |
| Inventory | `Item Ledger`, item purpose, source, sink, reserved-by-goal. |
| Offline Progress | `Return Report`: time away, Qi, craft/expedition gains, claim/continue. |
| Settings | Settings explains ordinary preferences and accessibility; no broad `Dao Mandate Interface`. |

## Internal allowed contexts
- `src/systems/ui/daoMandate/**`
- `src/ui/daoMandate/**`
- `src/services/diagnostics/**`
- save/default/migration/sanitize settings compatibility
- tests that assert absence, retirement, compatibility, or negative guards
- historical docs and reference prompts
- debug/specimen components not reachable as default public UI

## Tests changed
| Test file | Old target | New target | Strict/pending status |
| --- | --- | --- | --- |
| `statusV2LayoutContract.test.ts` | Status V2 must use Omen/Proof/Source components. | Status V3 guardrails, target IDs, and strict Packet C render copy guard. | Immediate docs guard; strict render assertions gated by `STATUS_V3_STRICT=1`. |
| `statusMandateChamberContract.test.ts` | Status public vocabulary is Omen/Proof/Health/Work. | Status target is Cultivator Ledger; Status V2 surface is transitional. | Immediate docs guard; strict component removal gated. |
| `cultivationCompactOmenContract.test.ts` | Cultivation default view renders compact Omen/Proof. | Cultivation target is breakthrough readiness. | Immediate docs guard; strict Packet D removal gated. |
| `cultivationMandateLensContract.test.ts` | Cultivation compact Omen projection is public target. | Cultivation no-Dao target and transitional-debt marker. | Immediate docs guard; strict Packet D removal gated. |
| `gateTrialDetailOwnershipContract.test.ts` | Proof/source handoff and status/cultivation boundary strings are target. | Native Gate Readiness ownership and strict Packet D decommission. | Immediate local readiness guard; strict removal gated. |
| `daoMandateProductionModuleSourceSinkSurfaces.test.ts` | Exact modules render `ModuleSourceSinkPanel`. | Local purpose panels replace public source/sink UI. | Immediate docs/internal guard; strict Packet D removal gated. |
| `settingsGuidanceRetirement.test.ts` | Settings exposes `Dao Mandate Interface`. | Settings target retires broad Dao interface while save compatibility remains. | Immediate compatibility guard; strict Packet D removal gated. |
| `statusLedgerGuardrailsContract.test.ts` | New. | AGENTS and packet rules encode Status V3 and A-D sequence. | Immediate. |
| `statusLedgerCopyPolicyContract.test.ts` | New. | Forbidden old labels and concrete replacements are documented. | Immediate. |
| `nonStatusNoDaoPublicUiTargetContract.test.ts` | New. | Non-Status public roots and forbidden components are documented; strict import guard ready. | Immediate docs guard; strict Packet D removal gated. |

## Vocabulary audit changes
- Audit schema label moves to `status-v3-dao-decommission-vocabulary-audit`.
- `Mission Requirements`, `Current Bottleneck`, `Best Improvements`, `Forge Floor`, `Healing Reserve`, `Doctrine Stock`, `Expedition Support`, `Item Ledger`, and `Return Report` are not globally forbidden.
- `Current Omen`, `Gate Proof`, `Source Thread`, `Recent Omens`, `Threshold Omen`, `Omen evidence`, `Proof Detail`, `Preparation Health`, and `Dao Mandate Interface` are public default blockers when they appear in reachable public roots.
- Internal Dao engine/component libraries, diagnostics, migration compatibility, historical docs, and negative tests are classified explicitly.

## Current public offender scan
Packet A intentionally does not remove current offenders. The baseline scans are expected to remain positive until Packet C/D:

```bash
rg -n "OmenSeal|ProofSealRow|SourceThreadDrawer|ReflectionPlaque|PressureBadgeRow|LocalMandateLensHeader|ModuleSourceSinkPanel|DaoMandateRouteButton" src/components src/features src/ui/status src/ui/world src/components/modals
rg -n "Current Omen|Gate Proof|Source Thread|Recent Omens|Mandate Lens|Module Source-Sink|Threshold Omen|Omen evidence|Dao Mandate Interface|Proof Detail|Preparation Health" src/components src/features src/ui/status src/components/modals src/components/screens
```

## Expected temporary failures
- `STATUS_V3_STRICT=1` target contracts fail until Packet C replaces the public Status render path and Packet D removes non-Status public Dao UI.
- `npm run release:vocab-audit -- --fail-on-drift` may fail until current public offenders are removed in Packet C/D.

## Next packets
### Packet B
Create `StatusLedgerSurfaceV1` and concrete rows for hero, metrics, mission requirements, cultivation base, current work, build/prep, safety net, best improvements, recent changes, and details.

### Packet C
Replace public Status V2 render with the old-look Status Ledger UI and capture screenshot evidence.

### Packet D
Remove public Dao/Omen/Proof/Source UI outside Status, replace module source/sink panels with local purpose panels, clean Settings/Offline/Inventory, and run final screenshot/static QA.

## Risks
- Do not delete internal Dao engine modules.
- Do not hide future cleanup behind broad allowlists.
- Do not remove old save migration settings.
- Do not alter RewardService, CombatStore, ActivityStore, TrialStore, PrestigeResetService, or content runtime for this packet.
