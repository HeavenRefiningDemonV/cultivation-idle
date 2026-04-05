# P0-03 — Shared-chrome regression rollback

## Purpose

Quarantine shared-chrome ownership drift identified in P0-01 so shared wrappers return to connective-tissue role and stop competing with local screen ownership.

## Dependency state

- P0-00 present: yes (`phase-0-source-lock`, `phase-0-packet-register`).
- P0-01 present: yes (`phase-0-destructive-migration-audit.md`, `phase-0-destructive-migration-ledger.json`).
- P0-02 present: yes (`phase-0-screenshot-baseline.md`, `phase-0-screenshot-manifest.json`), but screenshot slots remain blocked.

## Audit inputs consumed

- `P0-01-S001` / `P0-01-F001` / `P0-01-F002` / `P0-01-F004` (shared header/ribbon ownership channel split).
- `P0-01-S002` / `P0-01-F003` was reviewed but deferred here because safe unification of `ui/paper` and `ui/ink` primitive families requires dedicated screen-local validation in P0-12.

## Shared-owner findings addressed

| Finding / offender | Screens affected | Root file(s) | Action taken | Why this belongs to P0-03 | Deferred packet |
| --- | --- | --- | --- | --- | --- |
| `P0-01-S001` split header/ribbon ownership channel | World, Techniques, Prestige | `WorldScreen.tsx`, `TechniqueLibraryScreen.tsx`, `PrestigeScreen.tsx` | `local-unmount` of stale `setHeaderTitles` writes on surfaces with local/shared visible header owners | Removes shared-channel ownership duplication without redesigning screen content | — |
| `P0-01-S002` parallel paper/ink primitive families | Bounties/Expeditions | `ui/paper/*`, `ui/ink/*`, board screens | `defer` | Requires careful board-specific owner recovery and screenshot proof to avoid regression | P0-12 |

## Global wrapper changes

- No global primitive deletion performed.
- Shared primitives remain available, but World/Techniques/Prestige no longer write to the dormant global header-title channel from these surfaces.

## Local integration-site changes

- `src/components/screens/WorldScreen.tsx`
  - Removed `useUIStore` `setHeaderTitles` wiring.
- `src/components/screens/TechniqueLibraryScreen.tsx`
  - Removed `useUIStore` `setHeaderTitles` wiring.
- `src/components/screens/PrestigeScreen.tsx`
  - Removed `useUIStore` `setHeaderTitles` wiring.

## Screens verified

- World
- Techniques
- Prestige

Verification focus:
- shared header-title channel no longer written by these screens;
- existing local/screen-owned headers remain the visible owner path.

## Remaining local screen debt deferred to P0-04+

- `P0-01-S002` board-family primitive overlap (`ui/paper` vs `ui/ink`) deferred to P0-12 where board-specific owner recovery is in scope.
- Any per-screen composition recovery beyond shared-wrapper quarantine remains in P0-04..P0-13.

## Review screenshots

Review folder: `docs/ui/review/phase-0-p0-03-shared-chrome-rollback/`

Current screenshot status: blocked in this runtime (documented in folder README and per-screen witness slot READMEs).

## Verification results

Commands executed:
- `git diff --check`
- `git diff --name-only`
- `rg -n "Header|TopRibbon|PlaqueHeader|FrameCard|BottomNavDock|InspectorPanel|InspectorDrawer|ScenicLabel|RitualModalFrame|PaperStamp" src`
- `rg -n "phase-0-shared-chrome-regression-rollback|P0-03" docs/ui docs/codex`
- `npm run build`
- `npm run ensure:vendor-links && tsc --project tsconfig.tests.json && npm run build:progression-fixtures && NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tmp-tests/tests/contracts/worldCommandSurfaceContract.test.js tmp-tests/tests/contracts/prestigeScreenHonesty.test.js tmp-tests/tests/contracts/techniqueTaxonomyContract.test.js`

## Scope confirmation

- No new art created.
- No shared-shell expansion implemented.
- No per-screen redesign implemented.
- Packet scope was limited to shared-owner channel quarantine and report/evidence path updates.
