# Section D.0 — Hero-Screen Touchpoint Registry (Cultivation + Status)

## Purpose

This registry freezes exact, latest-repo touchpoints for Section D hero-screen work so D1–D10 cannot drift into guessed paths, implicit replacements, or accidental cleanup. This file is path truth only.

## Verification basis

- Verified against current local working tree using direct file existence checks.
- Git basis available in this runtime: branch `work`, short commit `67d8488`.
- Section A doctrine references reviewed before authoring:
  - `docs/ui/section-a-global-doctrine.md`
  - `docs/ui/section-a-destructive-freeze.md`
  - `docs/ui/section-a-asset-constitution.md`
  - `docs/ui/section-a-four-layer-model.md`
  - `docs/ui/section-a-screen-family-matrix.md`
  - `docs/ui/section-a-cutover-gate.md`
  - `docs/ui/section-a-screenshot-approval-workflow.md`
  - `docs/ui/section-a-touchpoint-registry.md`
  - `docs/ui/section-a-touchpoint-registry.json`

## Registry rules

1. Paths are exact canonical file paths from the latest repo snapshot.
2. `.scss` partners are listed only when a real local stylesheet exists.
3. No wildcard placeholders are allowed.
4. No stale appendix shorthand is authoritative unless re-verified by direct file checks.

## Cultivation touchpoints (primary + support)

| Canonical path | Class | Local stylesheet pairing | Section D relevance note |
| --- | --- | --- | --- |
| `src/components/screens/CultivateScreen.tsx` | primary | `src/components/screens/CultivateScreen.scss` | Hero-screen root composition and major layout truth owner for Cultivation. |
| `src/components/screens/CultivateScreen.scss` | primary | N/A | Core Cultivation visual shell and layout stability surface. |
| `src/ui/cultivation/CultivationHeaderRibbon.tsx` | support | `src/ui/cultivation/CultivationHeaderRibbon.scss` | Header ribbon truth, collapse behavior, and potential duplicate-ribbon risk anchor. |
| `src/ui/cultivation/CultivationHeaderRibbon.scss` | support | N/A | Styling contract for ribbon identity and interaction-state stability. |
| `src/ui/cultivation/DantianOrb.tsx` | support | `src/ui/cultivation/DantianOrb.scss` | Central dantian/cultivator hero identity support node. |
| `src/ui/cultivation/DantianOrb.scss` | support | N/A | Visual treatment for retained dantian scenic ownership. |
| `src/ui/cultivation/VerseMiniBar.tsx` | support | `src/ui/cultivation/VerseMiniBar.scss` | Verse truth strip; known unresolved docking fidelity tracked in retained-layer registry. |
| `src/ui/cultivation/VerseMiniBar.scss` | support | N/A | Verse mini bar presentation and docking behavior surface. |
| `src/ui/cultivation/heartLaw/HeartLawMindView.tsx` | support | `src/ui/cultivation/heartLaw/HeartLawMindView.scss` | Heart-law truth rendering in Cultivation screen context. |
| `src/ui/cultivation/heartLaw/HeartLawMindView.scss` | support | N/A | Styling for heart-law view legibility/state clarity. |
| `src/ui/cultivation/CultivationBreakthroughPanel.tsx` | support | none (no local `.scss`) | Breakthrough truth surface that must remain legible through additive packets. |
| `src/ui/cultivation/CultivationDoctrineSummary.tsx` | support | none (no local `.scss`) | Doctrine truth summary support surface for hero-screen reading flow. |
| `src/ui/fx/scenes/CultivationFxScene.tsx` | support | none (scene-managed) | Cultivation high/low/reduced-motion FX scene touchpoint. |

## Status touchpoints (primary + support)

| Canonical path | Class | Local stylesheet pairing | Section D relevance note |
| --- | --- | --- | --- |
| `src/components/screens/StatusScreen.tsx` | primary | `src/components/screens/StatusScreen.scss` | Hero-screen root for diagnostic grid, summary, and card-family composition. |
| `src/components/screens/StatusScreen.scss` | primary | N/A | Primary Status shell styling and layout stability anchor. |
| `src/ui/status/RunCompass.tsx` | support | `src/ui/status/RunCompass.scss` | Run Compass truth owner and major retained diagnostic surface. |
| `src/ui/status/RunCompassCompact.tsx` | support | none (no local `.scss`) | Compact diagnostic rendering path used in Status contexts. |
| `src/ui/status/StatusSummaryHeader.tsx` | support | `src/ui/status/StatusSummaryHeader.scss` | Existing summary header truth owner that must remain intact. |
| `src/ui/status/StatusSummaryHeader.scss` | support | N/A | Header presentation and duplicate-header risk surface. |
| `src/ui/status/StatusMiniCard.tsx` | support | `src/ui/status/StatusMiniCard.scss` | Status truth-card composition for readiness/floor/prep/build/safety-net family. |
| `src/ui/status/StatusMiniCard.scss` | support | N/A | Mini-card presentation and scan-speed stability surface. |
| `src/ui/status/CombatStatTile.tsx` | support | `src/ui/status/CombatStatTile.scss` | Combat stat truth tiles inside status diagnostic composition. |
| `src/ui/status/CombatStatTile.scss` | support | N/A | Stat tile styling and readability-state surface. |
| `src/ui/status/PostFailureDiagnosisPanel.tsx` | support | `src/ui/status/PostFailureDiagnosisPanel.scss` | Post-failure diagnosis truth owner and remediation cues. |
| `src/ui/status/PostFailureDiagnosisPanel.scss` | support | N/A | Diagnosis panel styling and state clarity surface. |
| `src/ui/status/useRunCompassSurface.ts` | support | N/A | Run Compass surface composition hook used by Status truth rendering. |
| `src/systems/ui/status/statusTroubleshootingSurface.ts` | support | N/A | Canonical status troubleshooting truth model/system surface. |
| `src/ui/fx/scenes/StatusFxScene.tsx` | support | none (scene-managed) | Status hero atmosphere FX scene touchpoint. |

## Shared supporting files (both hero surfaces)

| Canonical path | Class | Local stylesheet pairing | Section D relevance note |
| --- | --- | --- | --- |
| `src/systems/ui/runCompass/performRunCompassAction.ts` | support | N/A | Shared run-compass action routing used by both Cultivation and Status flows. |
| `src/styles/paperInkTokens.scss` | support | N/A | Shared token surface for cross-screen paper/ink consistency and D9 alignment. |

## Resolved drift

No path drift was detected for the D.0 provided touchpoint list; all listed paths exist as canonical files in the current snapshot.
