# Phase 0 — Packet 0.1A: Progression Contract + Drift Diagnostics

## 1) Purpose

Packet 0.1A introduces a read-side progression contract surface plus diagnostics that capture current content/runtime drift. This packet documents and exposes truth; it does **not** change gameplay behavior.

## 2) New contract/diagnostics surface

- `src/systems/progression/progressionContract.ts`
  - typed progression rows (`ProgressionTransition`)
  - typed city unlock rows (`CityUnlockContract`)
  - typed prestige reset notes (`PrestigeResetContractNote`)
  - typed offline notes (`OfflineContractNote`)
  - read-side builders/getters:
    - `buildProgressionContract(content, runtimeHints?)`
    - `getRealmTransitions(...)`
    - `getTransitionByTargetMajorRealm(...)`
    - `getCityUnlockContracts(...)`
    - `getPrestigeResetNotes()`
    - `getOfflineContractNotes()`
- `src/systems/progression/progressionDiagnostics.ts`
  - `getProgressionDiagnostics(...)`
  - typed issues (`ProgressionContractDiagnostics`) with severity, stable code, evidence, and impacted workstream

## 3) Major realm transition contract (content-authored)

| From realm | To realm | Trial ID | Gate item from content | Eligibility condition | City unlock tied to target realm |
|---|---|---|---|---|---|
| qi_condensation | foundation_establishment | trial_novices_clearing | gate_foundation_pill | atFinalSubstageQiCap (fromMajorRealm=qi_condensation) | city_stonecrag_town |
| foundation_establishment | core_formation | trial_stone_core_sanctum | gate_core_catalyst | atFinalSubstageQiCap (fromMajorRealm=foundation_establishment) | city_spirit_cavern_city |
| core_formation | nascent_soul | trial_patriarchs_seal | gate_core_stabilizer | atFinalSubstageQiCap (fromMajorRealm=core_formation) | city_lotusford |
| nascent_soul | soul_formation | trial_soul_lantern_vault | gate_soul_condensate | atFinalSubstageQiCap (fromMajorRealm=nascent_soul) | city_ironpeak_bastion |
| soul_formation | spirit_severing | trial_severing_court | gate_severing_seal | atFinalSubstageQiCap (fromMajorRealm=soul_formation) | _(none authored)_ |

## 4) City unlock intent from content

| City | unlockMajorRealm (content) | Runtime appears to honor? | Notes |
|---|---|---:|---|
| city_pinewind_hamlet | qi_condensation | yes | Starter city is force-unlocked during initialization.
| city_stonecrag_town | foundation_establishment | no | No central realm->city unlock flow currently consumes `unlockMajorRealm`.
| city_spirit_cavern_city | core_formation | no | Same drift.
| city_lotusford | nascent_soul | no | Same drift.
| city_ironpeak_bastion | soul_formation | no | Same drift.

## 5) Known drift currently surfaced

### Path truth drift
- Both `selectedPath` and `lifePath` remain active in runtime/save contract surfaces.

### Gate/item namespace drift
- Content trial rewards use `gate_*` IDs.
- Runtime breakthrough consumption currently uses legacy `GATE_ITEMS` IDs (`foundation_pill`, `core_catalyst`, etc.).

### City unlock runtime drift
- Content expresses unlock realm per city, but runtime does not centrally wire realm transitions to city unlocks.

### Prestige reset drift
- Reset behavior is distributed across `prestigeStore.performPrestige` and `gameStore.performPrestigeReset`, with mixed per-life vs permanent semantics and no explicit shared contract table.

### Offline split-brain drift
- `SaveService` route uses `OfflineCatchup.apply`.
- `systems/offline` still exposes alternate logic (meditation gate + efficiency multiplier path).

## 6) Scope statement

This packet adds canonical contract+diagnostics layers only. It intentionally does not unify or fix runtime progression behavior.

## 7) Expected follow-up packet ownership

- Path truth drift -> **Packet 0.1B**
- Gate/trial namespace + consumption drift -> **Packet 0.1C**
- City unlock runtime wiring drift -> **Packet 0.2**
- Prestige reset contract drift -> **Packet 0.3**
- Offline split-brain drift -> **Packet 0.4**
