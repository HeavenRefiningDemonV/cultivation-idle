import type { MajorRealmId } from '../../content';
import {
  buildProgressionContract,
  type ProgressionContentSlice,
  type ProgressionContractDiagnostics,
  type ProgressionIssue,
  type RuntimeProgressionHints,
} from './progressionContract';

function createIssue(issue: ProgressionIssue): ProgressionIssue {
  return issue;
}

function buildMajorRealmIndexMap(content: ProgressionContentSlice): Map<MajorRealmId, number> {
  return new Map(content.economy.majorRealms.map((realm) => [realm.id, realm.index]));
}

export function getProgressionDiagnostics(
  content: ProgressionContentSlice,
  runtimeHints: Partial<RuntimeProgressionHints> = {},
): ProgressionContractDiagnostics {
  const contract = buildProgressionContract(content, runtimeHints);
  const issues: ProgressionIssue[] = [];

  issues.push(
    createIssue({
      severity: 'warn',
      code: 'PATH_DUAL_IDENTITY_FIELDS',
      title: 'Dual path identity fields are still present',
      message:
        "Runtime and save state currently carry both 'selectedPath' and 'lifePath', so path truth remains split.",
      evidenceFiles: ['src/stores/gameStore.ts', 'src/types/index.ts', 'src/save/defaultSaveState.ts', 'src/utils/saveload.ts'],
      impactedWorkstream: 'Packet 0.1B path truth unification',
    }),
  );

  const majorRealmIndexMap = buildMajorRealmIndexMap(content);
  for (const transition of contract.transitions) {
    if (!transition.fromMajorRealm || !transition.gateItemIdFromContent) continue;
    const realmIndex = majorRealmIndexMap.get(transition.fromMajorRealm);
    if (realmIndex === undefined) continue;

    const runtimeItem = (runtimeHints.breakthroughGateItemsByRealmIndex ?? {})[realmIndex];
    if (!runtimeItem) continue;

    if (runtimeItem !== transition.gateItemIdFromContent) {
      issues.push(
        createIssue({
          severity: 'error',
          code: `GATE_ITEM_NAMESPACE_DRIFT_${transition.toMajorRealm.toUpperCase()}`,
          title: `Gate item mismatch for ${transition.toMajorRealm}`,
          message: `Content trial awards '${transition.gateItemIdFromContent}', while runtime breakthrough consumes '${runtimeItem}'.`,
          evidenceFiles: [
            'public/cultivation_idle_content_bible_v1_config/trials.json',
            'src/systems/loot.ts',
            'src/stores/gameStore.ts',
          ],
          impactedWorkstream: 'Packet 0.1C gate/trial contract wiring',
        }),
      );
    }
  }

  if (contract.cityUnlockContracts.some((entry) => !entry.runtimeWiringAppearsToHonorUnlock)) {
    issues.push(
      createIssue({
        severity: 'warn',
        code: 'CITY_UNLOCK_RUNTIME_WIRING_MISSING',
        title: 'City unlock intent is not centrally wired at runtime',
        message:
          'Content authors unlockMajorRealm per city, but runtime currently initializes only starter city and lacks central realm->city unlock integration.',
        evidenceFiles: ['public/cultivation_idle_content_bible_v1_config/cities.json', 'src/stores/cityStore.ts', 'src/stores/gameStore.ts'],
        impactedWorkstream: 'Packet 0.2 city progression wiring',
      }),
    );
  }

  issues.push(
    createIssue({
      severity: 'warn',
      code: 'PRESTIGE_RESET_ORCHESTRATION_SPLIT',
      title: 'Prestige reset contract is distributed',
      message:
        'Reset behavior is split across gameStore.performPrestigeReset and prestigeStore.performPrestige with per-slice resets but no central declared contract.',
      evidenceFiles: ['src/stores/gameStore.ts', 'src/stores/prestigeStore.ts', 'src/stores/cultivationStore.ts', 'src/stores/zoneStore.ts'],
      impactedWorkstream: 'Packet 0.3 prestige reset contract',
    }),
  );

  issues.push(
    createIssue({
      severity: 'warn',
      code: 'OFFLINE_SPLIT_BRAIN_PATHS',
      title: 'Offline progression has split implementations',
      message:
        'SaveService uses services/time/OfflineCatchup while systems/offline contains alternate cultivation-only flow with different eligibility and efficiency rules.',
      evidenceFiles: ['src/services/save/SaveService.ts', 'src/services/time/OfflineCatchup.ts', 'src/systems/offline.ts'],
      impactedWorkstream: 'Packet 0.4 offline progression unification',
    }),
  );

  return { issues };
}
