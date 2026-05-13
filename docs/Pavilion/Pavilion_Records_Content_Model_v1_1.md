# Pavilion Records Content Model v1.1 — Actionable Player Guidance

## Purpose

The Pavilion should not be an in-game dictionary. It should be a decision aid. A useful record should let a player move from confusion to action without searching Discord, external notes, or source code.

## Required questions per record

Each record should answer:

1. **What is it?**
   - Plain meaning in current gameplay terms.
2. **Why does it matter?**
   - The system, milestone, bottleneck, or build decision it affects.
3. **What do I do next?**
   - Concrete actions the player can take immediately.
4. **Where do I act?**
   - The owning screen, building, route button, source, or fallback.
5. **What numbers should I watch?**
   - Counts, costs, readiness values, cooldowns, source yields, or reset values.
6. **What mistake does this prevent?**
   - The behavior that would waste time, cause a bad purchase, or repeat a failed attempt.

## Section priority

The live surface should render sections roughly in this priority:

1. Jade Slip
2. Sect Note
3. Plain Meaning
4. Why It Matters
5. Current Relevance
6. Player Question
7. Quick Rule
8. When To Read
9. What To Do Next
10. Readiness Checks
11. How to Get / Where to Act
12. Used For
13. Requirements
14. Source / Use Ledger
15. Best Source
16. Numbers To Watch
17. Fallback Source
18. Failure Diagnosis
19. Elder Note
20. Prior-Life Note
21. Common Mistakes
22. Route Buttons
23. Related Records

## Copy rules

### Use action language
Bad:
> Gold is a currency used for many purchases.

Better:
> Use Gold when a prep route is blocked by shop purchases, forge service costs, or fail-safe requirements. If a gate prep row is red because you cannot afford medicine or forge work, route to Outskirts, Bounties, or sell-safe items.

### Preserve source/use clarity
Every item, resource, recipe, and activity should expose:

- best source
- fallback source
- used for
- do-not-sell or safe-to-sell warning where possible
- current milestone relevance

### Prevent repeated failed attempts
Gate and combat records should explicitly say:

- what changed since the last attempt
- what blocker is still open
- which system fixes that blocker
- whether the player should retry, route away, or use fail-safe

### Tie systems together
The Pavilion should make loops visible:

- Outskirts → gold/common mats → Apothecary/Forge prep
- Ruins → targeted support materials/fragments → gate readiness
- Manual Pavilion → manual → study → technique → equip → combat log proof
- Bounties → useful actions → Merit → fail-safe/support purchases
- Expeditions → background shortage relief → craft/forge/manual support
- Gate Trial → gate item → Cultivation breakthrough → next city
- Prestige → AP/meta upgrades → faster next life

## Current limitation

The new authored fields are additive. They are now rendered by `buildPavilionSurface.ts`, but deeper personalization still depends on runtime data quality. The next improvement should be more dynamic per-save guidance: exact missing item counts, exact best source by current city, exact gate readiness gaps, and exact post-defeat recommendations.
