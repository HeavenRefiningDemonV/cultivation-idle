# 02-ruins preflight evidence (Ruins Exact)

- Screen: **Ruins Exact** (`surface=ruins`, screen-owned `ruins-exact` / `ruins-scenic`)
- Signoff state: `DEFERRED_ART_ACCEPTED` while scenic `artStatus: deferred`
- Evidence pipeline: `release:phase6-combat-capture` → `release:phase6-combat-evidence-audit` → `release:phase6-combat-preflight`
- Fixture route pattern: `?uiAudit=phase-6-combat&surface=ruins&slot=<slot>&fx=<mode>&controls=0`

## Required slots (global six)
- `01-base.png` — Ruins Exact fixture active state, no audit controls
- `02-interaction.png` — Ruins Exact interaction state
- `03-truth-states.png` — lead materials + anchor + pity + auto-repeat + route + CTA + summary truth capture
- `04-high-fx.png` — High FX
- `05-low-fx.png` — Low FX
- `06-reduced-motion.png` — Reduced Motion

## Accepted target (must be visible)
- Full-screen `ruinsExactPage` destination (not old boxed combat-path panel)
- `Ruins` title, Run Compass, compact seven tactical cells, `Hollow Log Den ▾`
- `Targeted local materials and guaranteed anchor rewards`
- Chips: `Targeted Mats`, `Deterministic Support`
- Left `Ruin Kit`, central scenic stage, right `Targeted Materials`
- `Spirit Leaf`, `Beast Materials`, `Guaranteed Anchor`, `Core Fragment x1`, `Final Chest`
- `Rare Pity 1 / 6`, `Auto-Repeat Off`, footer `Best used for targeted local materials, not gold.`
- `Hollow Log Den Route` with node labels `Root Mouth`, `Spirit Nest`, `Sealed Cache`, `Den Guardian`, `Final Chest`
- `Continue Exploration` CTA and `Exploration Summary` dock

## Rejected target (fail evidence)
- `RuinsSummaryCard`, `RuinsProgress`, `RuinsCtaZone`, `CombatModuleTopLane`, `InkCombatShell`
- `combatPathModule`, `ruinsPanel`, `worldBuildingBody--combat-path`, `worldBuildingBody--inside-dungeon`
- Giant tactical columns / giant natural-size icons / blank scenic center / raw route list / missing CTA / missing summary

## Manual visual checklist
- Tactical strip stays compact (not giant columns)
- Side-card icons are contained (no giant cropped art)
- Body grid is visible (left/scenic/right + route/cta/summary)
- Scenic stage exists and is dominant in center
- Route is styled as five-node medallion strip, not raw list text
- CTA visible without scrolling at desktop 16:9
- Summary visible lower-right
- No major region overlap/clipping
- No old shell markers

## Deferred art note
Final Hollow Log Den art may remain deferred for Packet 11 evidence. Deferred state is acceptable only when:
- central scenic slot exists and is visually dominant,
- metadata records deferred art status,
- no forbidden substitute is treated as final (`InsideDungeon.png`, `city_ruins.png`, generic cave/outskirts substitutes).

## Cleanup authority status
Packet 13 cutover remains blocked until the Ruins Exact page receives explicit exact-screen cleanup approval.
Do not remove legacy Ruins combat-path code while this evidence folder is still operating in preflight mode.
