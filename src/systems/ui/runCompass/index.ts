import { getNextLiveRealm, isAtSemesterCap, getTrialGateItemId } from '../../progression/runtime/index.js';
import { buildLiveEconomicRecommendationEngine } from '../../economy/economicRecommendationEngine.js';
import { buildSection5StatusSurface } from '../../readiness/section5Adapters.js';
import { buildSupportEconomySurfaceModel } from '../../economy/supportEconomySurfaceModel.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { getDiagnosisLabel, getPrestigeRecommendationLabel, getReadinessBandLabel, getShellTabLabel, getWorldModuleLabel } from '../../../ui/text/playerFacingLabels.js';
import type { GameTab } from '../../../stores/uiStore.js';
import type { LiveWorldModuleKey } from '../../../content/index.js';
import { formatNumber } from '../../../utils/numbers.js';

export interface RunCompassActionTargetTab {
  kind: 'tab';
  tab: GameTab;
}

export interface RunCompassActionTargetWorldModule {
  kind: 'world_module';
  cityId: string;
  moduleKey: LiveWorldModuleKey;
}

export type RunCompassActionTarget = RunCompassActionTargetTab | RunCompassActionTargetWorldModule;

export interface RunCompassActionLine {
  id: string;
  label: string;
  why: string;
  destinationLabel: string;
  blocked: boolean;
  blockedReason: string | null;
  target: RunCompassActionTarget | null;
}

export interface RunCompassInfoLine {
  id: string;
  label: string;
  detail: string;
  tone?: 'default' | 'warning' | 'success' | 'muted';
  placeholder?: boolean;
}

export interface RunCompassSurface {
  milestone: {
    title: string;
    detail: string;
    contextLine: string;
    readinessLabel: string;
    prestigeLine: string | null;
  };
  readiness: {
    label: string;
    detail: string;
    diagnosisLabel: string | null;
    rows: RunCompassInfoLine[];
  };
  missingRequirements: RunCompassInfoLine[];
  bestNextActions: RunCompassActionLine[];
  safetyNet: {
    title: string;
    progressLine: string;
    costLine: string;
    reserveLine: string;
    detailLine: string;
  };
}

export interface RunCompassCompactSurface {
  milestoneLine: string;
  readinessLabel: string;
  blockerLine: string;
  actionLine: string;
}

function fillInfoLines(lines: RunCompassInfoLine[], count: number, emptyLabel: string, emptyDetail: string): RunCompassInfoLine[] {
  const seeded = lines.length > 0 ? [...lines] : [{ id: 'empty', label: emptyLabel, detail: emptyDetail, tone: 'success' as const }];
  while (seeded.length < count) {
    seeded.push({ id: `placeholder-${seeded.length}`, label: 'Waiting', detail: 'No additional action needed right now.', tone: 'muted', placeholder: true });
  }
  return seeded.slice(0, count);
}

function fillActions(lines: RunCompassActionLine[], count: number): RunCompassActionLine[] {
  const seeded = [...lines];
  while (seeded.length < count) {
    seeded.push({
      id: `placeholder-${seeded.length}`,
      label: 'Stay the course',
      why: 'No stronger corrective route is surfaced right now.',
      destinationLabel: 'Current focus',
      blocked: true,
      blockedReason: null,
      target: null,
    });
  }
  return seeded.slice(0, count);
}

function destinationLabelForTarget(target: RunCompassActionTarget | null): string {
  if (!target) return 'Current focus';
  if (target.kind === 'tab') return getShellTabLabel(target.tab);
  return getWorldModuleLabel(target.moduleKey);
}

function toActionLabel(actionKind: string): string {
  switch (actionKind) {
    case 'buy': return 'Restock supplies';
    case 'brew': return 'Brew support tonics';
    case 'farm_outskirts': return 'Farm the Outskirts';
    case 'run_ruins': return 'Run the Ruins';
    case 'launch_expedition': return 'Launch an Expedition';
    case 'claim_bounty': return 'Work Bounties';
    case 'craft_forge': return 'Raise forge floors';
    case 'route_manual_pavilion': return 'Tune your manuals';
    case 'attempt_gate': return 'Challenge the Gate Trial';
    case 'hold_and_cultivate':
    default:
      return 'Cultivate steadily';
  }
}

export function buildLiveRunCompassSurface(): RunCompassSurface | null {
  const contentStore = useContentStore.getState();
  const content = contentStore.raw;
  if (!content) return null;

  try {
    const game = useGameStore.getState();
    const inventory = useInventoryStore.getState();
    const prestige = usePrestigeStore.getState();
    const economic = buildLiveEconomicRecommendationEngine();
    const readiness = buildSection5StatusSurface();
    const support = buildSupportEconomySurfaceModel({ content, currencies: inventory.currencies, cityId: economic.snapshot.currentCityId });
    const currentRealm = economic.snapshot.currentRealmIndex;
    const nextRealm = getNextLiveRealm(currentRealm);
    const atCap = economic.snapshot.phase.atContentCap || isAtSemesterCap(currentRealm);
    const activeTransition = economic.snapshot.phase.currentGateTransition;
    const activeTrial = activeTransition ? contentStore.maps.trialsById[activeTransition.trialId] ?? null : null;
    const gateItemId = activeTrial ? getTrialGateItemId(content, activeTrial) : null;
    const gateItemDef = gateItemId ? contentStore.maps.itemsById[gateItemId] ?? null : null;
    const gateItemCount = gateItemId ? inventory.getItemCount(gateItemId) : 0;
    const breakthroughRequirement = game.getBreakthroughRequirement();
    const qiReady = Number(game.qi) >= Number(breakthroughRequirement ?? '0');
    const gateResolved = economic.snapshot.phase.currentGateResolved;
    const breakthroughPending = !atCap && gateResolved;
    const canPrestigeNow = prestige.canPrestige();

    const milestoneTitle = atCap
      ? 'Current semester cap reached'
      : breakthroughPending
        ? `Break through to ${nextRealm?.name ?? 'the next realm'}`
        : `Prepare for ${activeTrial?.name ?? 'the next Gate Trial'}`;
    const milestoneDetail = atCap
      ? 'You are at the current content cap for the live semester slice.'
      : breakthroughPending
        ? `Gate requirements are settled. Gather the last Qi you need and advance when ready.`
        : `Clear the current Gate Trial to open the path to ${nextRealm?.name ?? 'the next realm'}.`;
    const milestoneContextLine = atCap
      ? 'No future city or gate is shown beyond the live semester slice.'
      : `Current realm ${game.realm.name} → Next realm ${nextRealm?.name ?? 'Unknown'}`;
    const milestoneReadinessLabel = atCap
      ? 'Cap Reached'
      : breakthroughPending
        ? (qiReady ? 'Ready' : 'Preparing')
        : readiness.overallBand
          ? getReadinessBandLabel(readiness.overallBand)
          : 'Preparing';
    const prestigeLine = canPrestigeNow
      ? `${getPrestigeRecommendationLabel(atCap ? 'recommended' : 'viable')}: Reincarnation is unlocked on the Prestige tab.`
      : null;

    const readinessRows: RunCompassInfoLine[] = [
      {
        id: 'readiness-band',
        label: 'Current state',
        detail: atCap
          ? 'This life is in a cap-safe state.'
          : breakthroughPending
            ? (qiReady ? 'Qi and gate requirements are ready for a breakthrough.' : `Need ${formatNumber(Number(breakthroughRequirement ?? '0') - Number(game.qi))} more Qi before the breakthrough.`)
            : `Gate status: ${milestoneReadinessLabel}.`,
        tone: breakthroughPending && qiReady ? 'success' : atCap ? 'success' : 'default',
      },
      {
        id: 'readiness-diagnosis',
        label: 'Diagnosis',
        detail: readiness.currentDiagnosis ? getDiagnosisLabel(readiness.currentDiagnosis.primary) : (atCap ? 'No active gate diagnosis' : 'No recent gate diagnosis'),
        tone: readiness.currentDiagnosis ? 'warning' : 'muted',
      },
      {
        id: 'readiness-path',
        label: 'Build posture',
        detail: readiness.archetypeId ? `Current build leans ${readiness.archetypeId.replace(/_/g, ' ')}.` : 'No major posture warning surfaced.',
        tone: 'muted',
      },
    ];

    const missingRequirements: RunCompassInfoLine[] = [];
    if (atCap) {
      missingRequirements.push({ id: 'cap', label: 'No major blockers', detail: 'The live semester cap is the current stopping point.', tone: 'success' });
    } else if (breakthroughPending) {
      if (!qiReady) {
        missingRequirements.push({ id: 'qi', label: 'Qi requirement', detail: `Need ${formatNumber(Math.max(0, Number(breakthroughRequirement ?? '0') - Number(game.qi)))} more Qi for the breakthrough.`, tone: 'warning' });
      }
      if (gateItemId && gateItemCount <= 0) {
        missingRequirements.push({ id: 'gate-item', label: gateItemDef?.name ?? 'Gate proof', detail: 'Required before the breakthrough can proceed.', tone: 'warning' });
      }
    } else {
      missingRequirements.push(...economic.orderedShortfalls.slice(0, 3).map((shortfall): RunCompassInfoLine => ({
        id: shortfall.id,
        label: shortfall.label,
        detail: `Gap ${formatNumber(shortfall.gap)} • priority ${shortfall.priorityBand}`,
        tone: shortfall.severity === 'critical' || shortfall.severity === 'high' ? 'warning' : 'default',
      })));
    }

    const actionLines: RunCompassActionLine[] = [];
    if (atCap) {
      actionLines.push({
        id: 'prestige',
        label: canPrestigeNow ? 'Review Reincarnation' : 'Hold your current line',
        why: canPrestigeNow ? 'The next meaningful milestone is permanent progress.' : 'No future gate is exposed beyond the live cap.',
        destinationLabel: canPrestigeNow ? getShellTabLabel('prestige') : 'Current focus',
        blocked: !canPrestigeNow,
        blockedReason: canPrestigeNow ? null : 'Reincarnation is not unlocked yet.',
        target: canPrestigeNow ? { kind: 'tab', tab: 'prestige' as GameTab } : null,
      });
    } else if (breakthroughPending) {
      actionLines.push({
        id: 'cultivate',
        label: qiReady ? 'Attempt the breakthrough' : 'Keep cultivating',
        why: qiReady ? 'The gate is settled and your Qi is ready.' : 'The breakthrough is the next milestone, but Qi is still short.',
        destinationLabel: getShellTabLabel('cultivation'),
        blocked: false,
        blockedReason: null,
        target: { kind: 'tab', tab: 'cultivation' as GameTab },
      });
    }

    const economicActions = economic.topRouteCandidates.map((candidate, index): RunCompassActionLine => {
      const target: RunCompassActionTarget | null = candidate.destinationCityId
        ? { kind: 'world_module' as const, cityId: candidate.destinationCityId, moduleKey: candidate.destinationModuleKey }
        : candidate.actionKind === 'hold_and_cultivate'
          ? { kind: 'tab' as const, tab: 'cultivation' as GameTab }
          : null;
      return {
        id: `${candidate.problemKind}-${index}`,
        label: toActionLabel(candidate.actionKind),
        why: candidate.blockedReason ?? candidate.reasonSummary,
        destinationLabel: destinationLabelForTarget(target),
        blocked: Boolean(candidate.blockedReason) || target == null,
        blockedReason: candidate.blockedReason,
        target,
      };
    });
    for (const action of economicActions) {
      if (actionLines.some((existing) => existing.label === action.label && existing.destinationLabel === action.destinationLabel)) continue;
      actionLines.push(action);
    }

    return {
      milestone: {
        title: milestoneTitle,
        detail: milestoneDetail,
        contextLine: milestoneContextLine,
        readinessLabel: milestoneReadinessLabel,
        prestigeLine,
      },
      readiness: {
        label: milestoneReadinessLabel,
        detail: breakthroughPending
          ? 'The breakthrough remains the active milestone.'
          : atCap
            ? 'Current live content is complete.'
            : 'Use this section to judge whether the next Gate Trial is truly ready.',
        diagnosisLabel: readiness.currentDiagnosis ? getDiagnosisLabel(readiness.currentDiagnosis.primary) : null,
        rows: fillInfoLines(readinessRows, 3, 'No major blockers', 'No major blockers are surfaced right now.'),
      },
      missingRequirements: fillInfoLines(missingRequirements, 3, 'No major blockers', 'No major blockers are surfaced right now.'),
      bestNextActions: fillActions(actionLines, 3),
      safetyNet: {
        title: support.reserveHeadline,
        progressLine: support.eligibleDefeatRewardLine,
        costLine: support.failSafeLine,
        reserveLine: support.meritReserveLine,
        detailLine: atCap ? 'Safety Net spending is cap-safe right now.' : support.reserveGapLine,
      },
    };
  } catch (error) {
    console.warn('[RunCompass] Failed to build live surface', error);
    return null;
  }
}

export function buildRunCompassCompactSurface(surface: RunCompassSurface | null): RunCompassCompactSurface | null {
  if (!surface) return null;
  const firstBlocker = surface.missingRequirements.find((line) => !line.placeholder) ?? surface.readiness.rows[1] ?? null;
  const firstAction = surface.bestNextActions[0] ?? null;
  return {
    milestoneLine: surface.milestone.title,
    readinessLabel: surface.milestone.readinessLabel,
    blockerLine: firstBlocker ? `${firstBlocker.label}: ${firstBlocker.detail}` : 'No major blockers',
    actionLine: firstAction
      ? `${firstAction.label} → ${firstAction.destinationLabel}`
      : surface.safetyNet.detailLine,
  };
}
