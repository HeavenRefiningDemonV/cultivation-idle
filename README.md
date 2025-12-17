Prompt 4 patch files

Apply by copying the contents of this archive over your project root (merge/replace matching paths).

Key additions:
- Foreground ActivityStore (single active activity gate)
- CombatStore: combatContext + startCombat/endCombat (template-driven)
- Reward pipeline: grantRewards(bundle, reason) + RewardsLogStore
- Inventory: added Spirit Stones + Merit currencies; hybrid item definitions (legacy itemsDatabase + content items.json)
- Settings: "Rewards Debug" panel with "Test Grant Rewards" button

Build note:
- If your build previously failed with missing Sass preprocessor, run `npm install` and ensure `sass` is installed (added to devDependencies).
