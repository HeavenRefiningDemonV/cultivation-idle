Prompt 4 patch files

Copy these files into your repo root, preserving paths.

Changed/added:
- package.json
- src/stores/activityStore.ts (new)
- src/stores/rewardsLogStore.ts (new)
- src/systems/rewards.ts (new)
- src/stores/combatStore.ts (combatContext + startCombat/endCombat)
- src/stores/inventoryStore.ts (new currencies + hybrid content items)
- src/types/index.ts (CombatContext + new inventory currencies)
- src/utils/saveload.ts (save/load new currencies)
- src/components/screens/SettingsScreen.tsx/.scss (Rewards Debug button + recent log)
- src/components/screens/InventoryScreen.tsx (display Spirit Stones + Merit)

After copying:
- npm install
- npm run build
