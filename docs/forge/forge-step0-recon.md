# Forge Menu — Step 0A Recon

## Stack + conventions summary
- **Framework/runtime**: React + TypeScript + Vite. Scripts confirm Vite dev/build/typecheck and TS references. (package.json, tsconfig.json, vite.config.ts).【F:package.json†L1-L38】【F:tsconfig.json†L1-L7】【F:vite.config.ts†L1-L14】
- **State management**: Zustand stores (`create` + `immer`) drive crafting, professions, UI, etc. (e.g., `craftSessionStore`, `professionStore`, `uiStore`).【F:src/stores/craftSessionStore.ts†L1-L68】【F:src/stores/professionStore.ts†L1-L91】【F:src/stores/uiStore.ts†L1-L210】
- **Styling**: SCSS files are imported directly into components (global SCSS, not CSS modules). Example: `ForgeWorkshop.tsx` imports `ForgeWorkshop.scss`; `WorldBuildingModal.tsx` imports `WorldBuildingModal.scss`.【F:src/features/professions/forge/ForgeWorkshop.tsx†L1-L19】【F:src/components/modals/WorldBuildingModal.tsx†L1-L20】
- **World screen panel pattern**: Shared classes like `worldScreenPanel` and `worldScreenModuleButton` are defined in `WorldScreen.scss` and used across panels, including other profession panels; Forge uses the same button classes for actions.【F:src/components/screens/WorldScreen.scss†L145-L291】【F:src/features/professions/forge/ForgeWorkshop.tsx†L244-L305】
- **Modal overlay pattern**:
  - App modal primitive: `ui/primitives/Modal` (custom overlay + panel classes, keyboard handling).【F:src/ui/primitives/Modal.tsx†L1-L78】
  - Forge result uses a custom overlay DOM (`modalOverlay forgeResultModal`) in `ForgeWorkshop.tsx` (no local SCSS yet).【F:src/features/professions/forge/ForgeWorkshop.tsx†L592-L703】

## Preflight dev compilation
- `npm run dev` (timed out after 5s): Vite started successfully; no SCSS toolchain errors. (See command log in **Commands run**.)
- `npm run typecheck`: ✅ success.

## Forge entry point (render chain)
1. **Navigation**: `openWorldModule` sets active tab, validates module, and opens a world building modal for the module key (includes `forge`).【F:src/systems/world/openWorldModule.ts†L1-L48】
2. **UI state**: `uiStore.openWorldBuildingModal({ cityId, buildingKey })` sets modal state and emits `crafting/opened` for forge/alchemy/talisman studios.【F:src/stores/uiStore.ts†L676-L713】
3. **Modal host**: `WorldBuildingModal` renders the module’s content; for `forge`, it renders `ForgeWorkshop` and applies `worldBuildingModal--forge` background variant (animated forge background + hammer strike).【F:src/components/modals/WorldBuildingModal.tsx†L54-L134】【F:src/components/modals/WorldBuildingModal.scss†L33-L120】
4. **Forge UI component**: `ForgeWorkshop` (main Forge screen).【F:src/features/professions/forge/ForgeWorkshop.tsx†L94-L705】

### Forge UI stylesheets
- `src/features/professions/forge/ForgeWorkshop.scss` (primary panel layout + list/detail styling).【F:src/features/professions/forge/ForgeWorkshop.scss†L1-L201】
- `src/components/modals/WorldBuildingModal.scss` (forge background animation + hammer strike).【F:src/components/modals/WorldBuildingModal.scss†L33-L120】
- Hands-on sub-UI styles:
  - `src/components/crafting/ForgeHandsOnSession.tsx` + related SCSS (`ForgeWorkbenchScene.scss`, `ForgeRingQte.scss`, `TimingCircleQTE.scss`, `ForgeHeatPullOutQTE.scss`).【F:src/components/crafting/ForgeHandsOnSession.tsx†L1-L26】【F:src/components/crafting/ForgeWorkbenchScene.tsx†L1-L66】【F:src/components/crafting/ForgeRingQte.scss†L1-L120】【F:src/components/qte/TimingCircleQTE.scss†L1-L120】【F:src/ui/forge/ForgeHeatPullOutQTE.scss†L1-L123】

## Forge UI sub-areas (current state inventory)

### 1) Blueprint selection (list/search/filter)
- **Component**: `ForgeWorkshop`.
- **File**: `src/features/professions/forge/ForgeWorkshop.tsx`.
- **State**: `selectedBlueprintId`, `filterId`, `query` local state; derived `filteredBlueprints` from `listForgeBlueprints()` and content lookup; city lock gating uses `cityId` + `blueprint.cityId`.【F:src/features/professions/forge/ForgeWorkshop.tsx†L73-L210】【F:src/features/professions/forge/ForgeWorkshop.tsx†L311-L371】
- **Stores**: `contentStore` helpers (`listForgeBlueprints`, `getItemDef`, `getForgeBlueprint`).【F:src/features/professions/forge/ForgeWorkshop.tsx†L6-L14】【F:src/stores/contentStore.ts†L320-L349】
- **Services**: none directly.

### 2) Materials input + target slot
- **Component**: `ForgeWorkshop` detail section.
- **File**: `src/features/professions/forge/ForgeWorkshop.tsx`.
- **State**: `selectedServiceSlot` local state; `startEligibility` from `professionStore.canStartForge`; displays cost items from blueprint `costs` and output summary from content store.【F:src/features/professions/forge/ForgeWorkshop.tsx†L118-L240】【F:src/features/professions/forge/ForgeWorkshop.tsx†L360-L459】
- **Stores**: `professionStore` `canStartForge`; content helpers for item names.【F:src/features/professions/forge/ForgeWorkshop.tsx†L94-L137】【F:src/stores/professionStore.ts†L371-L419】
- **Services**: none directly (validation occurs in store).

### 3) Forging action + hands-on session
- **Components**:
  - `ForgeWorkshop` start CTA, mode selector.
  - `ForgeMinigame` → `ForgeHandsOnSession` for hands-on play.
- **Files**: `ForgeWorkshop.tsx`, `ForgeMinigame.tsx`, `ForgeHandsOnSession.tsx`.
- **State**:
  - `ForgeWorkshop` uses `useCraftSessionStore` (`modeByStation`, `activeSession`) and `useProfessionStore.startForgeJob`.
  - `ForgeHandsOnSession` manages QTE/step progression, reports results to `craftSessionStore` and emits game events.
- **Stores**:
  - `craftSessionStore` for hands-on session lifecycle and step results.
  - `professionStore` for starting forge jobs (queue + activity gating).
  - `activityStore` gating prevents other activities during forge session.
- **Services**:
  - `computeForgeOutcome` for scoring; `GameEvents` for telemetry; `RewardService` is not called in hands-on UI directly.
- **Key files**:【F:src/features/professions/forge/ForgeWorkshop.tsx†L94-L305】【F:src/features/professions/forge/ForgeMinigame.tsx†L1-L20】【F:src/components/crafting/ForgeHandsOnSession.tsx†L1-L72】【F:src/stores/craftSessionStore.ts†L546-L747】【F:src/stores/professionStore.ts†L460-L609】

### 4) Queue + timers
- **Component**: `ForgeWorkshop` queue list.
- **File**: `src/features/professions/forge/ForgeWorkshop.tsx`.
- **State**: `forgeQueue` from `professionStore`, `now` timer tick, local `queueStatus` feedback.
- **Stores**: `professionStore.getForgeJobStatus`, `professionStore.claimForgeJob`.
- **Services**: `RewardService.grantRewards` and forge services are called in `claimForgeJob` (not in UI).
- **Key files**:【F:src/features/professions/forge/ForgeWorkshop.tsx†L465-L592】【F:src/stores/professionStore.ts†L666-L768】

### 5) Result display
- **Component**: Forge result modal inside `ForgeWorkshop`.
- **File**: `src/features/professions/forge/ForgeWorkshop.tsx`.
- **State**: `lastClaimResult` (set from `claimForgeJob` result), `resultDelta` from `buildItemDelta`.
- **Stores/Services**: `claimForgeJob` return payload; `buildItemDelta` for stat diffs (local helper).
- **Key files**:【F:src/features/professions/forge/ForgeWorkshop.tsx†L180-L705】【F:src/features/professions/forge/forgeDelta.ts†L1-L58】【F:src/stores/professionStore.ts†L666-L768】

### 6) Refine/temper service flow (no salvage/reroll)
- **Components**: Same `ForgeWorkshop` detail section (target slot buttons) + queue/claim.
- **Store/services**: `professionStore.claimForgeJob` calls `applyRefineService` / `applyTemperService` and uses `RewardService.grantRewards` for service completion. `applyTemperService` uses RNG for proc chance + affix selection.
- **Files**:【F:src/features/professions/forge/ForgeWorkshop.tsx†L394-L459】【F:src/stores/professionStore.ts†L699-L748】【F:src/services/forgeService.ts†L1-L120】
- **Note**: No salvage/reroll-specific UI or services were found in Forge scope during search.

### 7) Gating / unlocks
- **City gating**: Forge blueprints carry `cityId`/`cityIndex` (normalized in content). `ForgeWorkshop` disables items not in current city, shows lock hint; `canStartForge` validates costs and target slot. 【F:src/content/forge.ts†L7-L134】【F:src/features/professions/forge/ForgeWorkshop.tsx†L172-L375】【F:src/stores/professionStore.ts†L371-L459】
- **Activity gating**: `ForgeWorkshop` blocks starting if other activity is active; `professionStore.startForgeJob` enforces forge-only active activity for hands-on mode. 【F:src/features/professions/forge/ForgeWorkshop.tsx†L138-L170】【F:src/stores/professionStore.ts†L492-L539】

## Forge data model + invariants

### Data model types
- **Blueprint type**: `NormalizedForgeBlueprint` in `src/content/forge.ts` (craft vs service, costs, output, step script, hands-on bonus).【F:src/content/forge.ts†L5-L52】
- **Crafting inputs**: `costs.items` + currency costs (gold/spiritStones) in `NormalizedForgeBlueprint`.【F:src/content/forge.ts†L11-L34】
- **Output item**: `output` field in blueprint; used for rewards in `professionStore.claimForgeJob`.【F:src/content/forge.ts†L27-L35】【F:src/stores/professionStore.ts†L699-L748】
- **RNG / roll parameters**: Forge performance scoring in `computeForgeOutcome` (seeded RNG + per-step scoring). Temper service uses RNG in `applyTemperService`.【F:src/systems/crafting/forgeOutcome.ts†L1-L220】【F:src/services/forgeService.ts†L52-L120】
- **Craft session types**: `CraftSession`, `ForgeStepDef`, `ForgeStepResult`, `ForgeSessionOutcome` in `craftingTypes`.【F:src/systems/crafting/craftingTypes.ts†L1-L275】

### Forge logic functions (single sources of truth)
- **Craft script construction**: `buildForgeScript` uses `resolveForgeStepScript` + blueprint data. 【F:src/systems/crafting/craftScripts.ts†L162-L214】【F:src/features/professions/forge/forgeScriptBuilder.ts†L1-L143】
- **Hands-on outcome**: `computeForgeOutcome` in `forgeOutcome.ts`, triggered by `craftSessionStore.completeHandsOnSession` or `professionStore.completeForgeSession`.【F:src/systems/crafting/forgeOutcome.ts†L1-L220】【F:src/stores/craftSessionStore.ts†L917-L999】【F:src/stores/professionStore.ts†L609-L665】
- **Inventory spend**: `professionStore.startForgeJob` spends items directly and uses `RewardService.spendCurrency` for currency costs (hands-on uses `skipPayment: true` when starting craft session).【F:src/stores/professionStore.ts†L531-L578】
- **Reward grant**: All forge outputs and services are granted via `RewardService.grantRewards` in `professionStore.claimForgeJob`.【F:src/stores/professionStore.ts†L699-L736】【F:src/services/rewards/RewardService.ts†L60-L118】

### Stores involved
- **Forge state/queue**: `professionStore` (`forgeQueue`, `startForgeJob`, `claimForgeJob`).【F:src/stores/professionStore.ts†L64-L91】【F:src/stores/professionStore.ts†L460-L768】
- **Hands-on crafting session**: `craftSessionStore` (`activeSession`, `recordForgeStepResult`, `completeHandsOnSession`).【F:src/stores/craftSessionStore.ts†L34-L70】【F:src/stores/craftSessionStore.ts†L842-L999】
- **Content**: `contentStore` for `forge_blueprints` and item defs. `normalizeForgeBlueprint` is the canonical blueprint type. 【F:src/stores/contentStore.ts†L320-L349】【F:src/content/forge.ts†L5-L52】
- **UI**: `uiStore` manages the world building modal open/close state. 【F:src/stores/uiStore.ts†L676-L729】
- **Inventory/equipment**: `inventoryStore` for costs; `equipmentStore` for refine/temper service application. 【F:src/stores/professionStore.ts†L531-L571】【F:src/services/forgeService.ts†L1-L120】

### Persisted/save assumptions
- `craftSessionStore` persists `modeByStation` + `activeSession` through `toSaveState()`; `saveload.ts` includes `craftSessionState` in persisted payload. **Do not rename or restructure these keys without migration.**【F:src/stores/craftSessionStore.ts†L34-L69】【F:src/utils/saveload.ts†L168-L182】

### DO NOT BREAK invariants
- **Forge “craft happens”**: `professionStore.startForgeJob` is the entry point; `claimForgeJob` finalizes rewards/services. Any UI changes must keep these as the authoritative flow.【F:src/stores/professionStore.ts†L460-L768】
- **Rewards**: All outputs (items or service completion) must continue through `RewardService.grantRewards` in `claimForgeJob`.【F:src/stores/professionStore.ts†L699-L736】【F:src/services/rewards/RewardService.ts†L60-L118】
- **Costs**: `startForgeJob` is the single place where inventory/currency is spent for forge jobs (hands-on uses `skipPayment: true` in `craftSessionStore.startSession`).【F:src/stores/professionStore.ts†L531-L578】【F:src/stores/craftSessionStore.ts†L586-L676】
- **Crafting in progress**: `craftSessionStore.activeSession` is the authoritative “hands-on in progress” state; `professionStore.forgeQueue` tracks queued/ready jobs. UI must reflect these, not invent new state. 【F:src/stores/craftSessionStore.ts†L34-L69】【F:src/stores/professionStore.ts†L64-L91】
- **Offline progress**: Forge queue offline handling lives in `professionStore.applyOffline` (hands-on never uses offline progress).【F:src/stores/professionStore.ts†L789-L836】

## Existing VFX / theming patterns to reuse
- **Forge background animation**: `worldBuildingModal--forge` animates through forge backgrounds + hammer strike sprite. (CSS keyframes: `forgeProgress`, `hammerStrike`).【F:src/components/modals/WorldBuildingModal.scss†L33-L120】
- **Hands-on forge VFX**: `ForgeWorkbenchScene` and related QTE styles include spark bursts, pulses, and forge-specific animations (see `forgeSparkBurst`, `forgeImpactPulse`, `forgeRingQteRating`, etc.).【F:src/components/crafting/ForgeWorkbenchScene.scss†L1-L120】【F:src/components/crafting/ForgeRingQte.scss†L1-L120】
- **Rare glow / breathing patterns**: Manual Pavilion rare spine glow uses `pavilionRareBreath` animation; Technique library has “stage breath/glow” keyframes. (These are likely reusable for rare forge outcomes).【F:src/components/screens/ManualPavilionPanel.scss†L492-L531】【F:src/components/screens/TechniqueLibraryScreen.scss†L914-L949】
- **Reduced motion handling**: Present in multiple SCSS modules (e.g., forge heat QTE, technique library stage). Use this pattern for any new animation layers. 【F:src/ui/forge/ForgeHeatPullOutQTE.scss†L110-L123】【F:src/components/screens/TechniqueLibraryScreen.scss†L946-L949】

## Data flow map (UI → store → logic → services)
- **Blueprint list/detail** → `contentStore.listForgeBlueprints()` + `getItemDef()` → normalized blueprint in `content/forge.ts` → displayed in `ForgeWorkshop`.【F:src/features/professions/forge/ForgeWorkshop.tsx†L118-L210】【F:src/stores/contentStore.ts†L320-L349】【F:src/content/forge.ts†L5-L52】
- **Start forging** → `ForgeWorkshop.handleStart()` → `professionStore.startForgeJob()` → inventory spend + `RewardService.spendCurrency()` → queue + (hands-on only) `craftSessionStore.startSession(skipPayment: true)` → activity started. 【F:src/features/professions/forge/ForgeWorkshop.tsx†L214-L251】【F:src/stores/professionStore.ts†L460-L609】
- **Hands-on steps** → `ForgeHandsOnSession` records step results via `craftSessionStore.recordForgeStepResult()` and outcome via `completeHandsOnSession()` → `computeForgeOutcome()` → `professionStore.completeForgeSession()` sets performance. 【F:src/components/crafting/ForgeHandsOnSession.tsx†L1-L72】【F:src/stores/craftSessionStore.ts†L842-L999】【F:src/stores/professionStore.ts†L609-L665】
- **Claim results** → `ForgeWorkshop` queue claim → `professionStore.claimForgeJob()` → `RewardService.grantRewards()` + `applyRefineService`/`applyTemperService` → return result snapshot to UI for modal display. 【F:src/features/professions/forge/ForgeWorkshop.tsx†L520-L592】【F:src/stores/professionStore.ts†L666-L768】【F:src/services/forgeService.ts†L1-L120】

## Risks / unknowns
- **Modal overlay styling**: The `modalOverlay` class is used in Forge/Alchemy result modals, but no SCSS definition was found in the codebase; styling might be in global CSS outside this repo or missing. (No match beyond component usage.)【F:src/features/professions/forge/ForgeWorkshop.tsx†L592-L703】【F:src/components/modals/AlchemyResultModal.tsx†L35-L63】
- **Forge blueprint content location**: `forge_blueprints.json` is referenced by loaders/validators, but exact pack file location wasn’t inspected in this recon pass. (Scoped to content system paths.)【F:src/content/loaders.ts†L1-L106】【F:src/content/validators.ts†L598-L1070】

## Commands run
- `npm run dev` (timed out after 5s; Vite started successfully).
- `npm run typecheck` (success).

