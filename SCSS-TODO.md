# SCSS migration follow-ups

The project now uses global SCSS with explicit class strings and BEM-style naming (see `GameLayout`, `Header`, and `Sidebar`). Remaining components to convert to the new naming scheme and confirm they rely on global SCSS instead of implicit module styles:

- Components: `TabNav`, `TechniquePanel`, `SpiritRootDisplay`, `InkWashBackground`, `CombatCanvas`
- Screens: `CultivateScreen`, `StatusScreen`, `AdventureScreen`, `DungeonScreen`, `InventoryScreen`, `PrestigeScreen`, `SettingsScreen`
- Tabs: `CultivationTab`, `AdventureTab`
- Modals: `OfflineProgressModal`, `PathSelectionModal`, `PerkSelectionModal`

When converting, replace camelCase class names with the chosen block/element/modifier pattern (e.g., `component-name__element--state`) and ensure their SCSS files match the updated selectors.
