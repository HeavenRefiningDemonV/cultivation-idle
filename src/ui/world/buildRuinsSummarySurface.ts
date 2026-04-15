import type { RuinsActivityRewardReadModel } from '../../systems/economy/activityRewardReadModel.js';

export interface BuildRuinsSummarySurfaceArgs {
  rewardModel: RuinsActivityRewardReadModel;
  ruinName: string | null | undefined;
  leadMaterialNames: string[];
  anchorName: string | null;
  bossChestRareFailures: number;
  pityCap: number;
  autoRepeatEnabled: boolean;
  activeRun: { roomIndex: number; roomCount: number } | null;
  trackedBountyTitle: string | null;
}

export interface RuinsSummarySurface {
  ruinName: string;
  roleTag: string;
  bestUsedWhen: string;
  roomCountLine: string;
  leadMaterialsPreview: string[];
  leadMaterialsLine: string;
  anchorPreviewLine: string;
  rarePityPreviewLine: string;
  autoRepeatLine: string;
  runStateLine: string;
  trackedBountyVisible: boolean;
  goldSecondaryBoundaryLine: string | null;
}

function toRarePityPreviewLine(args: {
  bossChestRareFailures: number;
  pityCap: number;
  rarePitySummary: string;
}): string {
  const { bossChestRareFailures, pityCap, rarePitySummary } = args;
  const pityTarget = Math.max(pityCap - 1, 0);
  if (pityTarget <= 0) {
    return `Rare pity: ${rarePitySummary}`;
  }
  const guaranteed = bossChestRareFailures >= pityTarget;
  return `Rare pity: ${bossChestRareFailures}/${pityTarget}${guaranteed ? ' • Guaranteed next rare' : ''}`;
}

export function buildRuinsSummarySurface(args: BuildRuinsSummarySurfaceArgs): RuinsSummarySurface {
  const {
    rewardModel,
    ruinName,
    leadMaterialNames,
    anchorName,
    bossChestRareFailures,
    pityCap,
    autoRepeatEnabled,
    activeRun,
    trackedBountyTitle,
  } = args;

  const leadMaterialsPreview = leadMaterialNames.filter((name) => name.trim().length > 0).slice(0, 2);
  const leadMaterialsLine = `Lead materials: ${leadMaterialsPreview.length > 0 ? leadMaterialsPreview.join(' • ') : 'Local support materials'}`;
  const anchorPreviewLine = `Guaranteed anchor: ${anchorName ?? 'Deterministic support payout'}`;
  const runStateLine = activeRun
    ? `Run state: Active (Room ${activeRun.roomIndex + 1}/${activeRun.roomCount})`
    : 'Run state: Idle';

  return {
    ruinName: ruinName ?? 'Ruins',
    roleTag: rewardModel.roleTag,
    bestUsedWhen: rewardModel.bestUsedWhen,
    roomCountLine: `Rooms: ${rewardModel.roomCount}`,
    leadMaterialsPreview,
    leadMaterialsLine,
    anchorPreviewLine,
    rarePityPreviewLine: toRarePityPreviewLine({
      bossChestRareFailures,
      pityCap,
      rarePitySummary: rewardModel.rarePitySummary,
    }),
    autoRepeatLine: `Auto-repeat: ${autoRepeatEnabled ? 'On' : 'Off'}`,
    runStateLine,
    trackedBountyVisible: Boolean(trackedBountyTitle),
    goldSecondaryBoundaryLine: rewardModel.goldIsSecondary ? rewardModel.boundaryLine : null,
  };
}
