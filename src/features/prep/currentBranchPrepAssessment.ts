import { getCurrentBranchRewardProfile } from '../economy/currentBranchRewardProfiles';
import {
  CURRENT_BRANCH_PREP_RECOVERY_TARGETS,
  getCurrentBranchGatePrepProfile,
  type CurrentBranchGatePrepProfile,
  type PrepCategory,
} from './currentBranchGatePrepProfiles';
import { recordPrepRecoveryDiagnosticEvent } from './prepRecoveryDiagnostics';

export interface CurrentBranchPrepSnapshot {
  gateId: string;
  realmIndex: number;
  realmSubstage: number;
  isProgressionBlocked: boolean;
  progressionBlockReason: string | null;
  runTimeMinutes: number;
  inventoryCounts: Record<string, number>;
  equippedWeaponId: string | null;
  equippedAccessoryId: string | null;
  selectedPath: string | null;
  unlockedPathTechniqueCount: number;
  primaryTechniqueProficiency: number;
}

export interface PrepChecklistLine {
  category: PrepCategory;
  label: string;
  met: boolean;
  severity: number;
}

export interface PrepRoute {
  category: PrepCategory;
  routeToken: 'adventure' | 'inventory' | 'cultivation' | 'status';
  label: string;
  reason: string;
}

export interface GatePrepAssessment {
  gateId: string;
  status: 'progression_blocked' | 'underprepared' | 'close' | 'ready';
  progressionBlockReason: string | null;
  minimumChecklist: PrepChecklistLine[];
  recommendedChecklist: PrepChecklistLine[];
  missingCategories: PrepCategory[];
  biggestShortfall: PrepChecklistLine | null;
  topFixes: PrepRoute[];
}

export function buildCurrentBranchPrepSnapshot(input: CurrentBranchPrepSnapshot): CurrentBranchPrepSnapshot {
  return input;
}

function equippedIds(snapshot: CurrentBranchPrepSnapshot) {
  return [snapshot.equippedWeaponId, snapshot.equippedAccessoryId].filter(Boolean) as string[];
}

function evaluateChecklist(profile: CurrentBranchGatePrepProfile, snapshot: CurrentBranchPrepSnapshot, band: 'minimum' | 'recommended'): PrepChecklistLine[] {
  const lines: PrepChecklistLine[] = [];
  const data = profile[band];
  const equipped = equippedIds(snapshot);

  for (const req of data.consumables) {
    const have = snapshot.inventoryCounts[req.itemId] ?? 0;
    lines.push({
      category: 'consumables',
      label: `${req.itemId} ${have}/${req.quantity}`,
      met: have >= req.quantity,
      severity: Math.max(0, req.quantity - have),
    });
  }

  for (const req of data.equipment) {
    const matched = req.anyOf.some((id) => equipped.includes(id));
    lines.push({
      category: 'equipment',
      label: req.label,
      met: matched,
      severity: matched ? 0 : 2,
    });
  }

  for (const req of data.build) {
    let value = 0;
    if (req.type === 'selectedPath') value = snapshot.selectedPath ? 1 : 0;
    if (req.type === 'unlockedTechniqueCount') value = snapshot.unlockedPathTechniqueCount;
    if (req.type === 'techniqueProgress') value = snapshot.primaryTechniqueProficiency;
    lines.push({
      category: 'build',
      label: `${req.label} (${value}/${req.minValue})`,
      met: value >= req.minValue,
      severity: Math.max(0, req.minValue - value),
    });
  }

  return lines;
}

function categoriesFromMissing(lines: PrepChecklistLine[]) {
  const totals = new Map<PrepCategory, number>();
  for (const line of lines.filter((l) => !l.met)) {
    totals.set(line.category, (totals.get(line.category) ?? 0) + Math.max(1, line.severity));
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, CURRENT_BRANCH_PREP_RECOVERY_TARGETS.antiStallCaps.maxMajorCorrectionCategories)
    .map(([category]) => category);
}

export function getCurrentBranchPrepRoutes(
  gateId: string,
  missingCategories: PrepCategory[],
  _snapshot: CurrentBranchPrepSnapshot
): PrepRoute[] {
  const profile = getCurrentBranchGatePrepProfile(gateId);
  if (!profile) return [];

  return missingCategories.slice(0, 3).map((category) => {
    const source = profile.bestSources[category];
    const rewardIdentity = source.zoneId ? getCurrentBranchRewardProfile(source.zoneId)?.renewableValue : null;
    const reason = category === 'consumables'
      ? `Missing consumable stock for ${profile.label}. ${rewardIdentity ? `Best loop: ${rewardIdentity}.` : ''}`
      : category === 'equipment'
      ? `Your equipped anchors are below ${profile.label} floor; upgrade through real zone farming + inventory equips.`
      : `Your build floor is behind for ${profile.label}; fix through cultivation progress and live combat technique usage.`;

    return {
      category,
      routeToken: source.routeToken,
      label: source.zoneId
        ? `Farm ${source.zoneId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`
        : source.label,
      reason,
    };
  });
}

export function getBiggestPrepShortfall(lines: PrepChecklistLine[]): PrepChecklistLine | null {
  const missing = lines.filter((line) => !line.met);
  if (missing.length === 0) return null;
  return missing.sort((a, b) => b.severity - a.severity)[0];
}

export function assessCurrentBranchGatePrep(snapshot: CurrentBranchPrepSnapshot): GatePrepAssessment {
  const profile = getCurrentBranchGatePrepProfile(snapshot.gateId);
  if (!profile) {
    return {
      gateId: snapshot.gateId,
      status: 'progression_blocked',
      progressionBlockReason: 'Gate prep profile unavailable.',
      minimumChecklist: [],
      recommendedChecklist: [],
      missingCategories: [],
      biggestShortfall: null,
      topFixes: [],
    };
  }

  const minimumChecklist = evaluateChecklist(profile, snapshot, 'minimum');
  const recommendedChecklist = evaluateChecklist(profile, snapshot, 'recommended');
  const missingCategories = categoriesFromMissing(minimumChecklist);
  const biggestShortfall = getBiggestPrepShortfall(minimumChecklist);
  const topFixes = getCurrentBranchPrepRoutes(snapshot.gateId, missingCategories, snapshot);

  for (const category of ['consumables', 'equipment', 'build'] as const) {
    if (missingCategories.includes(category)) {
      recordPrepRecoveryDiagnosticEvent({
        gateId: snapshot.gateId,
        category,
        status: 'missing',
        runTimeMinutes: snapshot.runTimeMinutes,
      });
    } else {
      recordPrepRecoveryDiagnosticEvent({
        gateId: snapshot.gateId,
        category,
        status: 'resolved',
        runTimeMinutes: snapshot.runTimeMinutes,
      });
    }
  }

  const recommendedMissing = recommendedChecklist.some((line) => !line.met);
  if (recommendedMissing) {
    recordPrepRecoveryDiagnosticEvent({ gateId: snapshot.gateId, category: 'package', status: 'missing', runTimeMinutes: snapshot.runTimeMinutes });
  } else {
    recordPrepRecoveryDiagnosticEvent({ gateId: snapshot.gateId, category: 'package', status: 'resolved', runTimeMinutes: snapshot.runTimeMinutes });
  }

  const status: GatePrepAssessment['status'] = snapshot.isProgressionBlocked
    ? 'progression_blocked'
    : missingCategories.length > 0
    ? 'underprepared'
    : recommendedMissing
    ? 'close'
    : 'ready';

  return {
    gateId: snapshot.gateId,
    status,
    progressionBlockReason: snapshot.isProgressionBlocked ? snapshot.progressionBlockReason : null,
    minimumChecklist,
    recommendedChecklist,
    missingCategories,
    biggestShortfall,
    topFixes: topFixes.slice(0, profile.maxMajorCorrectionCategories),
  };
}
