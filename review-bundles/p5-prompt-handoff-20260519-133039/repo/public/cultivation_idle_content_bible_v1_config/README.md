# Cultivation Idle — Content Bible Config Pack (v1.0)

Generated: 2025-12-15

This folder contains implementation-ready JSON configs for the **Unified City Hub** design
(Cities 1–5, full support for Heaven/Earth/Martial).

## Files

- `economy.json` — global tuning: manual grades, rarity weights, prices, rank-up costs, drop baselines, trial fail-safe costs.
- `cities.json` — the 5 cities and references to their modules.
- `items.json` — all non-manual items (materials, reagents, consumables, runes, talismans, gate items).
- `techniques.json` — **60 techniques** (20 per path) with cooldowns, costs, effects, and mastery-75 secondaries.
- `pavilions.json` — per-city pavilion pools (which techniques can appear) + grade sold + featured rules (ultimates in City 5).
- `outskirts.json` — per-city outskirts: mob pool, boss, mat pools.
- `enemies.json` — enemy IDs and boss mechanic tags/params (stats are expected to scale in code).
- `trials.json` — gate trials, eligibility rules, guaranteed gate items, fail-safe references.
- `ruins.json` — ruins definitions (room counts + bonus hooks).
- `alchemy_recipes.json`, `forge_blueprints.json`, `talisman_recipes.json` — crafting recipes and costs.
- `runes.json` — rune effects and socket constraints.
- `expeditions.json` — forage/mine/scout yields by city and duration modes.
- `bounties.json` — bounty templates and reward scaling.
- `heart_laws.json` — heart laws with chapters and numeric effects.
- `prestige_store.json` — AP upgrades with costs and prerequisites.

## Manual Item Strategy (recommended)

Manuals are represented parametrically as **(techId, grade, rarity)** rather than enumerating 1,200+ item IDs.
Implementation should:
- Generate a manual item instance when a pavilion/droptable rolls one.
- Store manual instance data in inventory.
- Convert duplicates to fragments using `economy.json` fragment values.

If you prefer fully enumerated manual item IDs, we can generate a `manual_items.json` file as a follow-up.
