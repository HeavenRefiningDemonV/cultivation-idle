import { REALMS } from '../../../constants/index.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { formatNumber, formatPercentFromValue } from '../../../utils/numbers.js';
import { getAffinityStatus } from '../../heartLaw/heartLawLogic.js';
import { analyzeSelectedBuild } from '../../builds/buildAnalysisService.js';
import { getBuildArchetype } from '../../builds/archetypeRegistry.js';
import { evaluateCurrentCombatPostureFit } from '../../builds/combatPostureFit.js';
import { buildDoctrineSnapshot } from '../../doctrine/doctrineSnapshot.js';
import { getBreathModeSemantics, getFocusModeSemantics, getPathDoctrineProfile } from '../../doctrine/index.js';
import { buildSupportEconomyReadModelFromState } from '../../economy/supportEconomyReadModel.js';
import { buildLiveEconomicRecommendationEngine } from '../../economy/economicRecommendationEngine.js';
import { diagnoseTrialFailure } from '../../readiness/failureDiagnosis.js';
import type { FailureDiagnosis, FailureDiagnosisCode } from '../../readiness/failureDiagnosisTypes.js';
import { evaluateCurrentGateReadiness, getCurrentGateTrialId } from '../../readiness/readinessRuntime.js';
import { getReadinessBandLabel, getDiagnosisLabel, getWorldModuleLabel } from '../../../ui/text/playerFacingLabels.js';
import { clampRealmIndexToSemesterSlice } from '../../progression/runtime/index.js';
import { getTrialLifecycleSnapshot } from '../../progression/runtime/trialLifecycle.js';
import { mapFailureFixToSurface } from '../postFailure/postFailureSurface.js';

const ROOT_GRADE_LABELS = {
  1: 'Mortal',
  2: 'Common',
  3: 'Uncommon',
  4: 'Rare',
  5: 'Legendary',
} as const;

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export type StatusUrgentCardId =
  | 'identity'
  | 'readiness'
  | 'permanent_floor'
  | 'preparation'
  | 'build'
  | 'safety_net'
  | null;

export interface StatusTroubleshootingSurface {
  realmName: string;
  stageText: string;
  pathLabel: string;
  archetypeLabel: string;
  archetypeSummary: string;
  shortfall: {
    diagnosisCode: FailureDiagnosisCode | null;
    diagnosisLabel: string;
    reason: string;
    headline: string;
    topFix: string | null;
    topFixDetail: {
      label: string;
      destinationLabel: string;
      blockedReason: string | null;
    } | null;
  };
  combatStrip: Array<{ label: string; value: string; tone: 'hp' | 'offense' | 'defense' | 'crit' }>;
  identity: {
    heartLawName: string;
    heartLawVerse: string;
    resonanceLabel: string;
    spiritRootSummary: {
      element: string;
      grade: string;
      purity: string;
      totalMultiplier: string;
    };
    focusMode: string;
    breathMode: string;
  };
  readiness: {
    readinessLabel: string;
    gateTrialName: string;
    diagnosisLabel: string;
    reasons: string[];
    warnings: string[];
    shortfallLine: string;
  };
  permanentFloor: {
    weaponRefine: number;
    accessoryRefine: number;
    temperSuccesses: number;
    runeSummary: string;
    gateTargetLine: string;
    floorJudgment: 'Behind floor' | 'On floor' | 'Above floor';
  };
  preparation: {
    meritReserve: string;
    spiritStoneReserve: string;
    pouchSummary: string;
    pouchFit: string;
    topWarning: string;
    gateTokenLine: string | null;
  };
  build: {
    alignment: string;
    emptySlots: string;
    mastery: string;
    rank: string;
    runes: string;
    policyFit: string;
    topGap: string;
  };
  safetyNet: {
    state: string;
    progress: string;
    threshold: string;
    cost: string;
    affordability: string;
    blockedReason: string;
  };
  urgentCardId: StatusUrgentCardId;
}

function title(input: string): string {
  return input ? `${input[0].toUpperCase()}${input.slice(1)}` : input;
}

export function resolveStatusUrgentCard(code: FailureDiagnosisCode | null): StatusUrgentCardId {
  switch (code) {
    case 'undercultivated': return 'readiness';
    case 'underforged': return 'permanent_floor';
    case 'underprepared': return 'preparation';
    case 'underbuilt': return 'build';
    case 'close': return 'readiness';
    case 'bypassAvailable': return 'safety_net';
    default: return null;
  }
}

export function resolveStatusShortfallReason(code: FailureDiagnosisCode | null, capReached: boolean): string {
  if (capReached) return 'Current chapter cap reached.';
  switch (code) {
    case 'undercultivated':
      return 'Gate entry threshold is not met yet.';
    case 'underforged':
      return 'Permanent forge floor is below this gate target.';
    case 'underprepared':
      return 'Consumables, reserves, or pouch posture are still unstable.';
    case 'underbuilt':
      return 'Loadout coverage or technique floor is still missing.';
    case 'close':
      return 'One focused correction should clear the next attempt.';
    case 'bypassAvailable':
      return 'Safety Net is currently available for this gate.';
    default:
      return 'No major blocker is surfaced right now.';
  }
}

function toShortfallHeadline(diagnosisLabel: string, reason: string): string {
  return `Biggest Shortfall: ${diagnosisLabel} — ${reason}`;
}

function toEconomicTopFixLabel(actionKind: string, destinationModuleKey: string): string {
  switch (actionKind) {
    case 'run_ruins':
      return `Run ${getWorldModuleLabel('ruins')} for missing materials`;
    case 'farm_outskirts':
      return `Farm ${getWorldModuleLabel('outskirts')} for missing materials`;
    case 'launch_expedition':
      return `Launch ${getWorldModuleLabel('expeditions')} for materials`;
    case 'craft_forge':
      return 'Raise forge floor';
    case 'route_manual_pavilion':
      return `Tune build via ${getWorldModuleLabel('manualPavilion')}`;
    case 'buy':
      return `Restock via ${getWorldModuleLabel(destinationModuleKey)}`;
    case 'brew':
      return `Brew support tonics at ${getWorldModuleLabel(destinationModuleKey)}`;
    default:
      return `Open ${getWorldModuleLabel(destinationModuleKey)}`;
  }
}

export function buildStatusTroubleshootingSurface(): StatusTroubleshootingSurface {
  const content = useContentStore.getState().raw;
  const game = useGameStore.getState();
  const inventory = useInventoryStore.getState();
  const cultivation = useCultivationStore.getState();
  const prestige = usePrestigeStore.getState();
  const pouch = useMedicinePouchStore.getState();
  const ui = useUIStore.getState();
  const snapshot = buildDoctrineSnapshot();
  const build = analyzeSelectedBuild(snapshot);
  const archetype = getBuildArchetype(build.archetypeId);
  const readiness = evaluateCurrentGateReadiness(snapshot);
  const posture = evaluateCurrentCombatPostureFit('trial');
  const support = buildSupportEconomyReadModelFromState({ content, currencies: inventory.currencies });
  const currentGateTrialId = getCurrentGateTrialId();
  const gateTrial = currentGateTrialId ? content?.trials.find((trial) => trial.id === currentGateTrialId) ?? null : null;
  const heartLaw = cultivation.selectedHeartLawId
    ? content?.heart_laws.find((entry) => entry.id === cultivation.selectedHeartLawId) ?? null
    : null;
  const capReached = currentGateTrialId == null;
  const canPrestigeNow = usePrestigeStore.getState().canPrestige();

  const requiredItemSatisfied = !gateTrial?.requiredItemId || inventory.getItemCount(gateTrial.requiredItemId) > 0;
  const lifecycle = getTrialLifecycleSnapshot({
    content,
    trial: gateTrial,
    progress: currentGateTrialId ? useTrialStore.getState().getProgress(currentGateTrialId) : null,
    realm: game.realm,
    qi: game.qi,
    breakthroughRequirement: game.getBreakthroughRequirement(),
    requiredItemSatisfied,
  });

  let diagnosis: FailureDiagnosis | null = null;
  if (currentGateTrialId && readiness) {
    const trialProgress = useTrialStore.getState().getProgress(currentGateTrialId);
    if (trialProgress.lastAttemptSummary) {
      diagnosis = diagnoseTrialFailure({
        trialId: currentGateTrialId,
        summary: trialProgress.lastAttemptSummary,
        readiness,
        build,
        bypassAvailable: lifecycle.failSafe.canPurchase,
      });
    }
  }

  const diagnosisCode = diagnosis?.primary ?? (lifecycle.failSafe.canPurchase ? 'bypassAvailable' : null);
  const diagnosisLabel = capReached
    ? 'Current Chapter Exhausted'
    : diagnosisCode
      ? getDiagnosisLabel(diagnosisCode)
      : 'Viable';
  const economic = buildLiveEconomicRecommendationEngine();
  const forgeFloor = economic.snapshot.forgeFloor;
  const gateTarget = forgeFloor.nextGateRecommendation;

  let floorJudgment: StatusTroubleshootingSurface['permanentFloor']['floorJudgment'] = 'On floor';
  if (diagnosisCode === 'underforged') {
    floorJudgment = 'Behind floor';
  } else if (readiness?.forge.band === 'recommended_met') {
    floorJudgment = 'Above floor';
  }

  const pouchSlots = Object.values(pouch.slots);
  const pouchFilled = pouchSlots.filter((slot) => slot.equippedItemId != null).length;
  const affinity = getAffinityStatus(heartLaw, snapshot.spiritRoot);
  const realm = REALMS[clampRealmIndexToSemesterSlice(game.realm.index)] ?? REALMS[0];
  const topFailureFix = diagnosis?.topFixes[0] ?? null;
  const mappedTopFailureFix = topFailureFix ? mapFailureFixToSurface({
    fix: topFailureFix,
    cityId: economic.snapshot.currentCityId,
    canRetry: lifecycle.canStart,
    canBuySafetyNet: lifecycle.failSafe.canPurchase,
  }) : null;

  const economicTopCandidate = economic.topRouteCandidates[0] ?? null;
  const economicTopFix = economicTopCandidate
    ? {
      label: toEconomicTopFixLabel(economicTopCandidate.actionKind, economicTopCandidate.destinationModuleKey),
      destinationLabel: getWorldModuleLabel(economicTopCandidate.destinationModuleKey),
      blockedReason: economicTopCandidate.blockedReason,
    }
    : null;

  const topFixDetail = mappedTopFailureFix
    ? {
      label: mappedTopFailureFix.label,
      destinationLabel: mappedTopFailureFix.destinationLabel,
      blockedReason: mappedTopFailureFix.blockedReason,
    }
    : economicTopFix;

  const topFixFallbackByDiagnosis = capReached
    ? {
      label: 'Open Reincarnation for permanent progress',
      destinationLabel: 'Prestige',
      blockedReason: canPrestigeNow ? null : 'Too Early',
    }
    : diagnosisCode === 'undercultivated'
      ? {
        label: 'Keep cultivating toward the next breakthrough',
        destinationLabel: 'Cultivation',
        blockedReason: null,
      }
      : diagnosisCode === 'underforged'
        ? {
          label: 'Refine your weapon toward the next gate floor',
          destinationLabel: getWorldModuleLabel('forge'),
          blockedReason: null,
        }
        : diagnosisCode === 'underprepared'
          ? {
            label: 'Open Apothecary and restore your prep package',
            destinationLabel: getWorldModuleLabel('apothecary'),
            blockedReason: null,
          }
          : diagnosisCode === 'underbuilt'
            ? {
              label: 'Open Techniques and close your top build gap',
              destinationLabel: 'Techniques',
              blockedReason: null,
            }
            : diagnosisCode === 'close'
              ? {
                label: 'Open the Gate Trial and test a cleaner attempt',
                destinationLabel: getWorldModuleLabel('gateTrial'),
                blockedReason: null,
              }
              : diagnosisCode === 'bypassAvailable'
                ? {
                  label: 'Use Safety Net to resolve this gate',
                  destinationLabel: getWorldModuleLabel('gateTrial'),
                  blockedReason: null,
                }
                : {
                  label: 'Follow the best next action from Run Compass',
                  destinationLabel: 'Run Compass',
                  blockedReason: null,
                };

  const resolvedTopFixDetail = topFixDetail ?? topFixFallbackByDiagnosis;
  const headline = toShortfallHeadline(diagnosisLabel, resolvedTopFixDetail.label);

  const readinessReasons = [
    ...diagnosis?.reasons.slice(0, 2) ?? [],
    ...(readiness?.warnings ?? []).slice(0, 2),
  ]
    .filter((line, index, all) => line && all.indexOf(line) === index)
    .slice(0, 4);

  return {
    realmName: realm.name,
    stageText: `Stage ${game.realm.substage}/${realm.substages}`,
    pathLabel: getPathDoctrineProfile(snapshot.path)?.label ?? 'No Path selected',
    archetypeLabel: archetype?.label ?? 'Unshaped Build',
    archetypeSummary: archetype?.summary ?? 'No stable archetype profile detected yet.',
    shortfall: {
      diagnosisCode,
      diagnosisLabel,
      reason: resolvedTopFixDetail.label,
      headline,
      topFix: `${resolvedTopFixDetail.label} (${resolvedTopFixDetail.destinationLabel})`,
      topFixDetail: resolvedTopFixDetail,
    },
    combatStrip: [
      { label: 'HP', value: formatNumber(game.stats.hp), tone: 'hp' },
      { label: 'ATK', value: formatNumber(game.stats.atk), tone: 'offense' },
      { label: 'DEF', value: formatNumber(game.stats.def), tone: 'defense' },
      { label: 'Crit Rate', value: formatPercentFromValue(game.stats.crit), tone: 'crit' },
    ],
    identity: {
      heartLawName: heartLaw?.name ?? 'No Heart Law selected',
      heartLawVerse: heartLaw
        ? `Verse ${ROMAN[Math.max(0, cultivation.chapter - 1)] ?? cultivation.chapter} • Chapter ${cultivation.chapter}`
        : 'No active verse',
      resonanceLabel: affinity.status === 'match' ? 'Resonant' : affinity.status === 'mismatch' ? 'Mismatched' : 'Neutral',
      spiritRootSummary: {
        element: snapshot.spiritRoot ? title(snapshot.spiritRoot.element) : 'Dormant',
        grade: snapshot.spiritRoot ? ROOT_GRADE_LABELS[snapshot.spiritRoot.grade] : 'Dormant',
        purity: snapshot.spiritRoot ? `${Math.round(snapshot.spiritRoot.purity)}%` : '0%',
        totalMultiplier: `${prestige.getSpiritRootTotalMultiplier().toFixed(2)}x`,
      },
      focusMode: getFocusModeSemantics(snapshot.focusMode).label,
      breathMode: getBreathModeSemantics(snapshot.breathMode).label,
    },
    readiness: {
      readinessLabel: readiness?.overallBand ? getReadinessBandLabel(readiness.overallBand) : capReached ? 'Cap Reached' : 'Preparing',
      gateTrialName: gateTrial?.name ?? 'No active gate trial',
      diagnosisLabel,
      reasons: readinessReasons,
      warnings: (readiness?.warnings ?? []).slice(0, 2),
      shortfallLine: `${diagnosisLabel} — ${resolvedTopFixDetail.label}`,
    },
    permanentFloor: {
      weaponRefine: forgeFloor.weaponRefineFloor,
      accessoryRefine: forgeFloor.accessoryRefineFloor,
      temperSuccesses: forgeFloor.temperSuccessTotal,
      runeSummary: forgeFloor.runeSummaryLabel,
      gateTargetLine: gateTarget
        ? `Next gate target W${gateTarget.weaponRefine} / A${gateTarget.accessoryRefine} / Temper ${gateTarget.temperSuccesses}`
        : 'No next gate target surfaced at current cap.',
      floorJudgment,
    },
    preparation: {
      meritReserve: `Merit reserve: ${formatNumber(support.currentMerit)} (${support.meritReserveStatus.replaceAll('_', ' ')})`,
      spiritStoneReserve: `Spirit Stones reserve: ${formatNumber(support.currentSpiritStones)} (${support.reserveStatus.replaceAll('_', ' ')})`,
      pouchSummary: `Auto-use ${ui.settings.useConsumablesInCombat ? 'enabled' : 'disabled'} • ${pouchFilled}/3 slots filled`,
      pouchFit: posture.pouchFit.replaceAll('_', ' '),
      topWarning: posture.warnings[0] ?? 'No major preparation warning.',
      gateTokenLine: gateTrial?.requiredItemId
        ? (requiredItemSatisfied ? 'Gate token readiness: ready' : 'Gate token readiness: missing required token')
        : null,
    },
    build: {
      alignment: `${build.pathAlignmentScore}%`,
      emptySlots: `${build.emptyUnlockedSlots}`,
      mastery: build.masteryFloorMet ? 'Met' : 'Below floor',
      rank: build.rankFloorMet ? 'Met' : 'Below floor',
      runes: build.runeFloorMet ? 'Met' : 'Below floor',
      policyFit: `AI ${posture.aiFit} • Casting ${posture.castingFit}`,
      topGap: build.gaps[0]?.reason ?? 'No top build gap surfaced.',
    },
    safetyNet: {
      state: capReached
        ? 'Current Chapter Exhausted'
        : lifecycle.failSafe.canPurchase
          ? 'Bypass Available'
          : lifecycle.failSafe.status === 'resolved'
            ? 'Gate already resolved'
            : canPrestigeNow
              ? 'Prestige Viable'
              : 'Too Early',
      progress: capReached
        ? 'No further live gate in the current chapter.'
        : `Safety Net progress: ${lifecycle.failSafe.eligibleFailures} / ${lifecycle.failSafe.threshold} eligible defeats`,
      threshold: capReached ? 'Threshold: n/a at chapter cap' : `Threshold: ${lifecycle.failSafe.threshold}`,
      cost: capReached
        ? 'Cost: Reincarnation now drives permanent progress.'
        : lifecycle.failSafe.cost
          ? `Cost: ${lifecycle.failSafe.cost.merit ?? '0'} Merit / ${lifecycle.failSafe.cost.spiritStones ?? '0'} Spirit Stones`
          : 'Cost unavailable',
      affordability: capReached
        ? (canPrestigeNow ? 'Recommended' : 'Too Early')
        : lifecycle.failSafe.canPurchase
          ? 'Affordable now'
          : canPrestigeNow
            ? 'Viable'
            : 'Too Early',
      blockedReason: capReached
        ? (canPrestigeNow ? 'Current Chapter Exhausted — Open Reincarnation.' : 'Current Chapter Exhausted — Too Early for Reincarnation.')
        : lifecycle.failSafe.status === 'resolved'
          ? 'Gate already resolved'
          : lifecycle.failSafe.blockedReason ?? 'Not available yet',
    },
    urgentCardId: resolveStatusUrgentCard(diagnosisCode),
  };
}
