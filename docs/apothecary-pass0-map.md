# Apothecary Pass 0B — Location & System Map

## Step 0 — What “Apothecary” means here

**Apothecary is a world building modal opened from the World tab’s city map.** The flow is:

1. **World tab (Adventure) → WorldScreen** renders the city hub and map. [`src/components/screens/WorldScreen.tsx`](../src/components/screens/WorldScreen.tsx)【F:src/components/screens/WorldScreen.tsx†L1-L206】
2. **CityMapHub** renders the clickable module hotspots (including `apothecary`). [`src/components/screens/CityMapHub.tsx`](../src/components/screens/CityMapHub.tsx)【F:src/components/screens/CityMapHub.tsx†L1-L89】
3. **openWorldModule** is called to open the module, which always opens the world building modal. [`src/systems/world/openWorldModule.ts`](../src/systems/world/openWorldModule.ts)【F:src/systems/world/openWorldModule.ts†L1-L46】
4. **WorldBuildingModal** renders `ApothecaryPanel` when `buildingKey === 'apothecary'`. [`src/components/modals/WorldBuildingModal.tsx`](../src/components/modals/WorldBuildingModal.tsx)【F:src/components/modals/WorldBuildingModal.tsx†L1-L152】

> **Conclusion:** Apothecary is a **world building modal**, not a bottom-tab screen.

---

## Step 1 — Apothecary screen files

### A) Primary TSX component

- **Main screen component:** `src/components/screens/ApothecaryPanel.tsx`【F:src/components/screens/ApothecaryPanel.tsx†L1-L475】
- Rendered inside the WorldBuildingModal when the module key is `apothecary`.【F:src/components/modals/WorldBuildingModal.tsx†L1-L152】

### B) Subcomponents (notable imports)

- **Medicine Pouch UI:** `MedicinePouchPanel` (always rendered at top of ApothecaryPanel).【F:src/components/screens/ApothecaryPanel.tsx†L1-L475】
- **Apothecary bundles/services data:**
  - `src/features/apothecary/apothecaryBundles.ts`【F:src/features/apothecary/apothecaryBundles.ts†L1-L31】
  - `src/features/apothecary/apothecaryServices.ts`【F:src/features/apothecary/apothecaryServices.ts†L1-L29】

### C) Stylesheets

- **Main Apothecary styles:** `src/components/screens/ApothecaryPanel.scss` (imported in `ApothecaryPanel.tsx`).【F:src/components/screens/ApothecaryPanel.tsx†L1-L13】
- **Medicine Pouch styles:** `src/components/consumables/MedicinePouchPanel.scss` (imported in `MedicinePouchPanel.tsx`).【F:src/components/consumables/MedicinePouchPanel.tsx†L1-L13】

---

## Step 2 — Medicine Pouch implementation (UI + state)

### A) UI components

- **Apothecary screen panel:** `src/components/consumables/MedicinePouchPanel.tsx` (config UI for slots/rules, rendered inside ApothecaryPanel).【F:src/components/consumables/MedicinePouchPanel.tsx†L1-L245】【F:src/components/screens/ApothecaryPanel.tsx†L415-L475】
- **Combat strip UI:** `src/components/combat/MedicinePouchStrip.tsx` (in-combat quick-use strip).【F:src/components/combat/MedicinePouchStrip.tsx†L1-L183】

**How it’s rendered:** currently **always visible** at the top of `ApothecaryPanel` (not toggled).【F:src/components/screens/ApothecaryPanel.tsx†L415-L475】

### B) State/store

- **Zustand store:** `src/stores/medicinePouchStore.ts`【F:src/stores/medicinePouchStore.ts†L1-L170】
  - **State fields:** `slots` keyed by `healing`, `utility`, `specialty` with:
    - `equippedItemId`, `enabled`, `trigger`, `thresholdPct`, `cooldownSec`, `bossOnly`, `lastUsedAt`.【F:src/stores/medicinePouchStore.ts†L11-L132】
  - **Key actions:** `equip`, `setSlotConfig`, `markUsed`, `hydrate`, `toSaveState`, `hardReset`.【F:src/stores/medicinePouchStore.ts†L11-L170】
  - **Default rules:** `createDefaultSlots()` defines initial triggers and thresholds per slot.【F:src/stores/medicinePouchStore.ts†L45-L79】

### C) Persistence strategy

- **Saved in save data:** `medicinePouchState` is included in save build and hydrated on load.
  - Save build includes `medicinePouchState`.【F:src/save/defaultSaveState.ts†L1-L206】
  - Save validation allows `medicinePouchState` if slots are present.【F:src/utils/saveload.ts†L396-L417】

### D) Auto-use rules in combat

- **Auto-use logic lives in CombatStore** (`tryAutoUseMedicinePouch`) and checks:
  - `useConsumablesInCombat` toggle from UI settings.
  - slot enabled, cooldowns, trigger conditions, boss-only gates.
  - consumes via `consumeCombatConsumable` and updates slot via `markUsed`.【F:src/stores/combatStore.ts†L720-L822】

### E) Consumable definitions

- **Consumable usage/cooldowns/effects:** `src/systems/consumables/consumableCatalog.ts` (source of `getConsumableSpec` and `isCombatUsableConsumable`).【F:src/systems/consumables/consumableCatalog.ts†L1-L119】

---

## Step 3 — Apothecary stock + purchase logic

### A) Stock source & data

- **Content source:** `public/cultivation_idle_content_bible_v1_config/apothecary_shops.json` (shops + stock + daily limits).【F:public/cultivation_idle_content_bible_v1_config/apothecary_shops.json†L1-L136】
- **Loaded into ContentStore:** `apothecariesById` / `apothecariesByCityId`.【F:src/stores/contentStore.ts†L18-L148】

### B) Purchase logic

- **Shop store:** `src/stores/shopStore.ts` provides:
  - `canBuy(shopId, stockId, qty)` → `{ ok, error }`.
  - `buy(shopId, stockId, qty)` → `{ ok, error, grantedQty }`.
  - Errors include: `Invalid quantity`, `Apothecary not found`, `Item not found`, `Sold out today`, `Daily limit reached`, `Not enough <currency>`, `Failed to spend currencies`, `Failed to grant item`.【F:src/stores/shopStore.ts†L13-L197】
  - Currency spend and item grant funnel through `RewardService` (guardrail honored).【F:src/stores/shopStore.ts†L128-L189】

### C) Apothecary Panel purchase usage

- **Item purchases:** `ApothecaryPanel` calls `canBuy`/`buy` and uses `statusByStock` for feedback text.【F:src/components/screens/ApothecaryPanel.tsx†L60-L236】
- **Bundles:** `ApothecaryPanel` uses `apothecaryBundles`, `RewardService.spendCurrency`, and `RewardService.grantRewards`, with local success/error status messages.【F:src/components/screens/ApothecaryPanel.tsx†L238-L338】【F:src/features/apothecary/apothecaryBundles.ts†L1-L31】
- **Services:** `apothecaryServices` present but currently display a “Service not implemented yet” status when clicked.【F:src/components/screens/ApothecaryPanel.tsx†L323-L420】【F:src/features/apothecary/apothecaryServices.ts†L1-L29】

---

## Step 4 — Styling anchors (to reuse later)

### A) Bottom tab button styling

- **Component:** `src/components/BottomTabBar.tsx` uses `button-standard` + `bottomTabBarButton`.【F:src/components/BottomTabBar.tsx†L1-L47】
- **Styles:** `src/components/BottomTabBar.scss` defines base and active button visuals (gradient active state + shadows).【F:src/components/BottomTabBar.scss†L1-L43】
- **Global base button style:** `src/styles/global.css` defines `.button-standard` (border-image + background).【F:src/styles/global.css†L70-L104】

### B) Shared panel/card styles

- **World screen module buttons + placeholder panels:**
  - `src/components/screens/WorldScreen.scss` contains `.worldScreenModuleButton`, `.worldScreenPlaceholder`, `.worldScreenPanel`.【F:src/components/screens/WorldScreen.scss†L1-L207】
- **Status screen card base (reused via `@extend`):**
  - `.statusScreenCardBase` in `src/components/screens/StatusScreen.scss`.【F:src/components/screens/StatusScreen.scss†L45-L138】

### C) Current Apothecary-specific styling

- `src/components/screens/ApothecaryPanel.scss` defines panel header, cards, tags, actions, and status messaging for the Apothecary UI.【F:src/components/screens/ApothecaryPanel.scss†L1-L395】

---

## Quick navigation note (how to reach Apothecary)

1. Click **World** tab in the bottom bar.
2. Select a city in the **World** screen.
3. Click the **Apothecary** hotspot on the city map → opens World Building modal with the Apothecary panel.

Primary route: `BottomTabBar → WorldScreen → CityMapHub (apothecary hotspot) → openWorldModule → WorldBuildingModal → ApothecaryPanel`.

---

## Pass 0B Map Summary (for later passes)

### Entry point
- World tab → city map → building modal (`WorldScreen` → `CityMapHub` → `WorldBuildingModal`).【F:src/components/screens/WorldScreen.tsx†L1-L206】【F:src/components/screens/CityMapHub.tsx†L1-L89】【F:src/components/modals/WorldBuildingModal.tsx†L1-L152】

### Main UI files
- `src/components/screens/ApothecaryPanel.tsx` (main Apothecary screen).【F:src/components/screens/ApothecaryPanel.tsx†L1-L475】
- `src/components/screens/ApothecaryPanel.scss` (main Apothecary styles).【F:src/components/screens/ApothecaryPanel.scss†L1-L395】

### Medicine Pouch
- **UI:** `src/components/consumables/MedicinePouchPanel.tsx` + `MedicinePouchPanel.scss`.【F:src/components/consumables/MedicinePouchPanel.tsx†L1-L245】
- **Combat strip:** `src/components/combat/MedicinePouchStrip.tsx`.【F:src/components/combat/MedicinePouchStrip.tsx†L1-L183】
- **Store/state:** `src/stores/medicinePouchStore.ts` (slots + triggers + cooldowns + bossOnly + lastUsedAt).【F:src/stores/medicinePouchStore.ts†L11-L170】
- **Auto-use logic:** in `combatStore.tryAutoUseMedicinePouch`.【F:src/stores/combatStore.ts†L720-L822】

### Core data + purchase logic
- **Apothecary stock:** `public/cultivation_idle_content_bible_v1_config/apothecary_shops.json`.【F:public/cultivation_idle_content_bible_v1_config/apothecary_shops.json†L1-L136】
- **Shop logic:** `src/stores/shopStore.ts` (`canBuy`, `buy`, errors, currency checks).【F:src/stores/shopStore.ts†L13-L197】
- **UI feedback:** local status messages in `ApothecaryPanel.tsx`.【F:src/components/screens/ApothecaryPanel.tsx†L60-L338】

### Style anchors
- **Bottom tabs:** `BottomTabBar.tsx` + `BottomTabBar.scss` + `.button-standard` in `styles/global.css`.【F:src/components/BottomTabBar.tsx†L1-L47】【F:src/components/BottomTabBar.scss†L1-L43】【F:src/styles/global.css†L70-L104】
- **World modules / cards:** `.worldScreenModuleButton` + `.worldScreenPanel` in `WorldScreen.scss`.【F:src/components/screens/WorldScreen.scss†L1-L207】
- **Apothecary panel styles:** `ApothecaryPanel.scss` as current local implementation.【F:src/components/screens/ApothecaryPanel.scss†L1-L395】
