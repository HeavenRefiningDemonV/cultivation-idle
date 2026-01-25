# Bounties + Expeditions — Pass 0B Recon (Stores, Actions, Models)

> Scope: inventory of store ownership, actions, data models, reward flow, and save keys. **No behavior changes.**

## 1) File Path Map

### Screens + UI
- Bounty Board screen: `src/components/screens/BountyBoardPanel.tsx`
- Bounty Board styles: `src/components/screens/BountyBoardPanel.scss`
- Expeditions screen: `src/components/screens/ExpeditionBoardPanel.tsx`
- Expeditions styles: `src/components/screens/WorldScreen.scss` (expedition block + ceremony overlay)
- World-building modal (entry point container): `src/components/modals/WorldBuildingModal.tsx`
- World map entry flow (opens modules): `src/components/screens/WorldScreen.tsx` + `src/systems/world/openWorldModule.ts`

### Stores (core)
- Bounties store: `src/stores/bountyStore.ts`
- Expeditions store: `src/stores/expeditionStore.ts`
- Inventory + currencies (“Merit”): `src/stores/inventoryStore.ts`
- Content accessors: `src/stores/contentStore.ts`
- UI notifications: `src/stores/uiStore.ts`

### Content / Data Models
- Bounties + expeditions content schema: `src/content/types.ts`
- Content validation for bounties/expeditions: `src/content/validators.ts`

### Save / Persistence
- Save/Load and save keys: `src/utils/saveload.ts`

### Helpers / Routing / Shared Reward Pipeline
- Bounty navigation routing + labels: `src/utils/bountyRouting.ts`
- Rewards pipeline: `src/services/rewards/RewardService.ts` + `src/services/rewards/types.ts`

---

## 2) Store Ownership & State Shapes

### Bounties — `useBountyStore`
**File:** `src/stores/bountyStore.ts`

**State shape (bounty-related):**
```ts
activeByCityId: Record<string, BountyInstance[]>;
lastRefreshAtByCityId: Record<string, number>;
trackedByCityId: Record<string, string | null>;
```

**Actions + signatures:**
```ts
generateForCity(cityId: string, cityIndex: number): void;
refresh(cityId: string, cityIndex: number): void;
canRefresh(cityId: string, now?: number): boolean;
nextRefreshAt(cityId: string): number | null;
recordEvent(event: BountyEvent): void;
claim(cityId: string, instanceId: string): boolean;
getTrackedBounty(cityId: string): BountyInstance | null;
setTrackedBounty(cityId: string, bountyId: string | null): void;
hardResetBounties(): void;
```

**Other stores/services used:**
- `useContentStore` for content (templates, reward tiers, cooldown, city modules).
- `RewardService.grantRewards` for payout.
- `useUIStore.addNotification` for progress toasts.
- `resolveBountyDestination` to filter templates by available city modules.

**Persistence:**
- Saved/loaded as `bountyState` in `src/utils/saveload.ts` (active list, last refresh, tracked by city).

---

### Expeditions — `useExpeditionStore`
**File:** `src/stores/expeditionStore.ts`

**State shape (expedition-related):**
```ts
slots: number;
active: ExpeditionRun[];
rareProgressByKey: Record<string, number>;
```

**Actions + signatures:**
```ts
setSlots(slots: number): void;
start(slotIndex: number, typeId: string, durationId: string, cityId: string, cityIndex: number): boolean;
claim(slotIndex: number): ClaimExpeditionResult;
tick(now: number): void;
```

**Other stores/services used:**
- `useContentStore` for durations/types/yields + economy pity defaults.
- `RewardService.grantRewards` for payouts.
- `useBountyStore.recordEvent` (EXPEDITION_COMPLETE) when claiming.
- `useUIStore.addNotification` for rare drop toast.

**Persistence:**
- Saved/loaded as `expeditionState` in `src/utils/saveload.ts` (slots, active runs, rare progress).

---

### Inventory / Currency (“Merit”) — `useInventoryStore`
**File:** `src/stores/inventoryStore.ts`

**State shape:**
```ts
currencies: Record<CurrencyKey, string>;
items: Record<string, number>;
merit: string; // also in currencies.merit
```

**Actions relevant to Merit:**
```ts
addCurrency(key: CurrencyKey, amount: string): void;
spendCurrency(key: CurrencyKey, amount: string): boolean;
canAffordCurrency(costs: Partial<Record<CurrencyKey, string>>): boolean;
spendCurrencies(costs: Partial<Record<CurrencyKey, string>>): boolean;
addMerit(amount: string): void; // wrapper around addCurrency('merit', ...)
```

**Notes:**
- RewardService uses `addCurrency` (and `addItem`) as the unified flow to grant rewards.

---

## 3) Action Map — Bounties

### A) Refresh bounties
- **UI event → store:**
  - `BountyBoardPanel` "Refresh Bounties" button → `useBountyStore.refresh(cityId, cityIndex)`.
- **Conditions / guards:**
  - `useBountyStore.canRefresh()` uses `bounties.refreshCooldownSeconds` from content; returns false until cooldown elapses.
- **State mutations:**
  - Rebuilds 3 bounties for the city.
  - Updates `lastRefreshAtByCityId[cityId]`.
  - Clears tracked bounty if no longer present in new list.
- **Side effects:**
  - None beyond state update.

### B) Generate initial bounties
- **UI event → store:**
  - `BountyBoardPanel` on mount → `useBountyStore.generateForCity(cityId, cityIndex)`.
- **Conditions / guards:**
  - If existing list has 3 entries, no-op.
  - Skips if content invalid or no templates or no valid templates for city modules.
- **State mutations:**
  - Populates `activeByCityId[cityId]`, `lastRefreshAtByCityId[cityId]`, `trackedByCityId[cityId]` default.
- **Side effects:**
  - None beyond state update.

### C) Track / untrack bounty
- **UI event → store:**
  - `BountyBoardPanel` Track button → `setTrackedBounty(cityId, bountyId | null)`.
- **Conditions / guards:**
  - If `bountyId === null`, clears.
  - If id is not in active list, sets to null.
- **State mutations:**
  - Updates `trackedByCityId[cityId]`.
- **Side effects:**
  - Header shows tracked bounty and click navigation uses this tracked record.

### D) “Go There” navigation
- **UI event → store:**
  - `BountyBoardPanel` “Go There” button → `openWorldModule({ cityId, moduleKey })`.
  - Header tracked bounty badge → `setActiveTab('adventure')`, `setCurrentCity`, `setSelectedModule` (directly in `Header.tsx`).
- **Conditions / guards:**
  - `resolveBountyDestination` determines module or moduleChoice or unavailable.
- **State mutations:**
  - UI tab/module state changes (via UI + City store)
- **Side effects:**
  - Opens `WorldBuildingModal` for module (via `openWorldModule`).

### E) Progress updates (passive)
- **UI event → store:**
  - Store-driven from other systems via `useBountyStore.recordEvent`.
- **Sources:**
  - Outskirts kills/boss kills (CombatStore)
  - Ruins room/run clear (RuinsStore)
  - Gate trial clear (CombatStore)
  - Crafting job claim (ProfessionStore)
  - Expedition claim (ExpeditionStore)
- **Conditions / guards:**
  - Event cityId must match; only increments if matching bounty kind and not claimed.
- **State mutations:**
  - Updates bounty `progress` up to `target`.
- **Side effects:**
  - UIStore notifications per progress update.

### F) Claim bounty
- **UI event → store:**
  - `BountyBoardPanel` “Claim Reward” → `useBountyStore.claim(cityId, instanceId)`.
- **Conditions / guards:**
  - Fails if not complete, already claimed, or not found.
- **State mutations:**
  - Marks `claimed = true` and clears tracked bounty if it was the claimed one.
- **Side effects:**
  - Rewards are granted through `RewardService.grantRewards(..., reason)`.

---

## 4) Action Map — Expeditions

### A) Select expedition type (forage / mine / scout)
- **UI event → store:**
  - Local state in `ExpeditionBoardPanel` (`selectedTypeId`).
- **Conditions / guards:**
  - Types come from `content.raw?.expeditions.types`.
- **State mutations:**
  - UI-only state (no store mutations).
- **Side effects:**
  - UI derives preview yields from content.

### B) Select duration
- **UI event → store:**
  - Local state in `ExpeditionBoardPanel` (`selectedDurationId`).
- **Conditions / guards:**
  - Durations come from `content.raw?.expeditions.durations`.
- **State mutations:**
  - UI-only state.
- **Side effects:**
  - Updates preview yield/rare chance/pity display.

### C) Start expedition
- **UI event → store:**
  - `ExpeditionBoardPanel` “Send Expedition” → `useExpeditionStore.start(slotIndex, typeId, durationId, cityId, cityIndex)`.
- **Conditions / guards:**
  - Slot must be in range and unused.
  - Duration must exist and have `seconds > 0`.
- **State mutations:**
  - Pushes a new `ExpeditionRun` into `active` for that slot.
- **Side effects:**
  - None (no immediate reward; timers begin).

### D) Tick / mark complete
- **UI event → store:**
  - `useExpeditionStore.tick(now)` is called by OfflineCatchup (and elsewhere when needed).
- **Conditions / guards:**
  - Runs `status = 'complete'` when time is elapsed.
- **State mutations:**
  - Updates run status.
- **Side effects:**
  - Offline summary reports “Expeditions ready”.

### E) Claim expedition
- **UI event → store:**
  - `ExpeditionBoardPanel` “Claim Rewards” → `useExpeditionStore.claim(slotIndex)`.
- **Conditions / guards:**
  - Slot must exist; run must be complete or time elapsed.
  - Content must provide yield tags + city yields.
- **State mutations:**
  - Removes run from `active`.
  - Updates `rareProgressByKey` (pity tracking) when relevant.
- **Side effects:**
  - Rewards granted through `RewardService.grantRewards`.
  - `useBountyStore.recordEvent({ type: 'EXPEDITION_COMPLETE', ... })`.
  - Rare drop toast via `useUIStore.addNotification`.

---

## 5) Data Model Summary (Types & Definitions)

### Bounties
- **Content definitions:** `src/content/types.ts`
  - `BountiesConfig`, `BountyTemplate`, `BountyRewardTier`, `BountyRewardTiersByCityIndex`, `BountyDifficulty`.
- **Runtime instance:** `src/stores/bountyStore.ts`
  - `BountyInstance` (instanceId, cityId, templateId, difficulty, kind, title, description, progress, target, claimed, rewards, createdAt).
- **Routing helpers:** `src/utils/bountyRouting.ts`
  - `resolveBountyDestination`, `bountyKindToLabel`, `bountyKindToProgressRule`.

### Expeditions
- **Content definitions:** `src/content/types.ts`
  - `ExpeditionsConfig`, `ExpeditionDurationDef`, `ExpeditionTypeDef`, `ExpeditionCityYieldDef`.
- **Runtime instance:** `src/stores/expeditionStore.ts`
  - `ExpeditionRun` + `ExpeditionRunStatus`.
- **Display helpers:**
  - UI-level compute helpers in `ExpeditionBoardPanel` (expected bundle, value estimate, formatters).

### Rewards
- **Reward bundle type:** `src/services/rewards/types.ts` (`RewardBundle`, `RewardCurrencyBundle`, `RewardItemBundle`, etc.).
- **Rewards pipeline:** `src/services/rewards/RewardService.ts` (applies to inventory + emits events).

---

## 6) Merit + Reward Flow (Confirmation)

- **Merit is a currency in `useInventoryStore`** (`currencies.merit` and `merit` field). All increments must go through `RewardService.grantRewards` → `useInventoryStore.addCurrency` for consistency.
- **Bounties grant rewards** through `RewardService.grantRewards(bounty.rewards, reason)` on `claim`.
- **Expeditions grant rewards** through `RewardService.grantRewards(rolledBundle, reason)` on `claim`.
- **Crafting, combat, ruins** also grant rewards via the same reward service and feed bounty progress via `recordEvent`.

---

## 7) Safe to Change Later (UI-only)

These are UI-level (no save keys or gameplay logic):
- `src/components/screens/BountyBoardPanel.tsx` (layout, component hierarchy, styling class usage)
- `src/components/screens/ExpeditionBoardPanel.tsx` (layout, progressive disclosure, modal presentation)
- `src/components/screens/BountyBoardPanel.scss`
- `src/components/screens/WorldScreen.scss` (expedition styles section)
- `src/components/modals/WorldBuildingModal.tsx` (presentation/layout only, keep open/close behavior)

---

## 8) Do NOT Touch Without Explicit Plan (Logic / Save / Reward)

- **Save keys + shapes** in `src/utils/saveload.ts`:
  - `bountyState` (activeByCityId, lastRefreshAtByCityId, trackedByCityId)
  - `expeditionState` (slots, active, rareProgressByKey)
- **Reward flow** via `RewardService.grantRewards` (do not bypass).
- **Bounty event routing** via `useBountyStore.recordEvent` and call sites in combat/profession/expedition/ruins stores.
- **Expedition rare pity tracking** (`rareProgressByKey` + pity defaults in economy config).
- **Bounty refresh cooldown** (`bounties.refreshCooldownSeconds` in content config).

