# Phase A.5 — Hero Recovery Pass (Cultivation + Status)

## 1) Purpose of Packet A.5
Packet A.5 recovers the Cultivation and Status hero screens into coherent additive compositions using only existing repo assets and existing runtime structure. It preserves live truth surfaces while reducing half-migrated gray-slab/dashboard presentation.

## 2) Dependencies on A.1–A.4
A.5 depends on:
- A.1 recovery doctrine (`phase-a-recovery-constitution.md`, `phase-a-rollout-guardrails.md`) for preserve-and-enhance behavior.
- A.2 planning authority (`phase-a-asset-continuity-matrix.*`, `phase-a-screen-recovery-audit.md`) for screen-specific breakage and target direction.
- A.3 shared-chrome freeze (`phase-a-shared-chrome-freeze.md`) so local screen recovery does not re-open foundation ownership drift.
- A.4 ritual recovery (`phase-a-a4-ritual-recovery.md`) as the immediate predecessor for Phase A ordered hero stabilization.

## 3) Current File-Surface Truth
Primary touched surfaces:
- `src/components/screens/CultivateScreen.tsx`
- `src/components/screens/CultivateScreen.scss`
- `src/components/screens/StatusScreen.tsx`
- `src/components/screens/StatusScreen.scss`
- `src/ui/cultivation/CultivationHeaderRibbon.scss`
- `src/ui/cultivation/DantianOrb.tsx`
- `src/ui/cultivation/DantianOrb.scss`
- `src/ui/cultivation/VerseMiniBar.scss`
- `src/ui/cultivation/QiLotusIcon.scss`
- `src/ui/status/StatusSummaryHeader.tsx`
- `src/ui/status/StatusSummaryHeader.scss`

No gameplay/store/combat logic was changed.

## 4) Target Screenshot References
Visual north-star references for this packet:
- `/mnt/data/Cultivation screen.png`
- `/mnt/data/Status.png`

(If unavailable in environment, recovery still proceeds using A.2 audit + existing file-surface truths.)

## 5) Cultivation Recovery Goals
- Keep `cbg_full.png` as the visible sacred Layer-1 center.
- Keep Run Compass, doctrine, breakthrough, qi/readiness, and verse/buff/action truth surfaces intact.
- Reduce disconnected slab feeling by re-framing command deck + HUD as additive parchment planes over the scene.
- Keep `CultivationHeaderRibbon` behavior while softening its visual ownership.
- Anchor `DantianOrb` locally in hero composition (not viewport-fixed).
- Give `VerseMiniBar` and `QiLotusIcon` a shared, stable placement and visual language.
- Preserve no-layout-shift behavior.

## 6) Status Recovery Goals
- Preserve existing troubleshooting structure and card jobs.
- Add a calm scenic Layer-1 base using existing background assets.
- Add a centered sacred anchor that supports (not replaces) diagnostic readability.
- Recompose header/cards around a cohesive identity layer.
- Keep Status calmer than Cultivation while improving Spirit Root emphasis.
- Preserve no-layout-shift behavior for card and summary states.

## 7) Existing Assets Reused
- `src/assets/onscreen/cbg_full.png`
- `src/assets/background/cbg_bg.png`
- `src/assets/background/cbg_bgblue.png`
- `src/assets/onscreen/qisign.png`
- `src/assets/onscreen/qi_lotus_closed.png`
- `src/assets/onscreen/qi_lotus_open.png`
- `src/assets/onscreen/qi_lotus_full.png`
- `src/assets/menus/buttoncorners.png`
- `src/assets/menus/bar_long.png`
- `src/assets/menus/bar_short.png`
- `src/assets/texture_overlay.png`

## 8) Optional Support Adjustments
Optional support files were **not** touched in A.5:
- `CultivationDoctrineSummary.tsx`
- `CultivationBreakthroughPanel.tsx`
- `StatusMiniCard.scss`
- `CombatStatTile.scss`
- `SpiritRootDisplay.tsx/.scss`

## 9) Explicit Non-Goals
A.5 is:
- not a new-art pass,
- not a full final hero-screen redesign,
- not a broader system/UI migration,
- not a logic/balance packet.

## 10) Manual QA and Acceptance Criteria
Manual QA checklist:
- Cultivation
  - `cbg_full.png` remains the primary base scene.
  - command deck reads as additive parchment/plaque planes.
  - header ribbon reads quieter and more integrated.
  - Dantian orb is locally anchored, not fixed to viewport.
  - verse + lotus land as one coherent hero lane.
  - no layout shift during ready/hover/activity states.
- Status
  - screen no longer reads as gray cards on blank surface.
  - scenic base uses existing assets (`cbg_bg*`) only.
  - centered sacred anchor exists and stays secondary to diagnostics.
  - summary header feels quieter and identity-forward.
  - Spirit Root is surfaced more prominently.
  - troubleshooting cards stay clear and actionable.
  - no layout shift for urgency/positive/readiness states.
- Packet safety
  - no new art files added.
  - file-touch surface stays inside A.5 bounds.
