import type {
  PrestigeReclaimResolvedRow,
  PrestigeReclaimResolvedState,
  PrestigeMemoryResolvedState,
} from '../../systems/prestige/prestigeMemoryResolver.js';

export type ReclaimMemorySurfaceRow = {
  id: string;
  domain: PrestigeReclaimResolvedRow['record']['domain'];
  state: PrestigeMemoryResolvedState;
  stateLabel: string;
  title: string;
  priorBestLabel: string;
  stopConditionLabel: string;
  playerReason: string;
  routeComparison: PrestigeReclaimResolvedRow['routeComparison'];
  inspector: {
    mechanicalEffectLabel: string;
    safetyLabel: string;
    rememberedLifeLabel: string;
  };
  actions: Array<{ label: string; kind: 'inspect' }>;
};

export type ReclaimMemorySurfaceV1 = {
  rootTestId: 'prestige-reclaim-memory-panel';
  title: 'Reclaim Memory';
  currentRouteLabel: string;
  summary: PrestigeReclaimResolvedState['summary'];
  rows: ReclaimMemorySurfaceRow[];
  emptyState: string | null;
  accessibility: {
    noHoverOnlyTruth: true;
    nonColorStateText: true;
    reducedMotionPreservesMeaning: true;
  };
};

const STATE_LABELS: Record<PrestigeMemoryResolvedState, string> = {
  active: 'Active Reclaim Memory',
  dormant: 'Dormant Memory',
  partial_component_only: 'Partial Component Memory',
  at_prior_best: 'Prior Best Reclaimed',
};

const DOMAIN_LABELS: Record<PrestigeReclaimResolvedRow['record']['domain'], string> = {
  path_training: 'Path Training',
  heart_law: 'Heart Law',
  spirit_root: 'Spirit Root',
  gate: 'Gate',
  composite_route: 'Full Route',
};

const formatMultiplier = (value: number): string => {
  const normalized = Math.max(1, value);
  return `${normalized.toFixed(2).replace(/0$/, '').replace(/\.0$/, '')}x`;
};

const buildMechanicalEffectLabel = (row: PrestigeReclaimResolvedRow): string => {
  if (row.state !== 'active') return 'No catch-up multiplier is active for this memory.';
  const floor = row.activeFloorValue > 0 ? `; floor ${Math.floor(row.activeFloorValue)}` : '';
  return `${formatMultiplier(row.activeMultiplier)} catch-up until ${row.priorBestLabel}${floor}.`;
};

export function buildReclaimMemorySurface(input: {
  resolved: PrestigeReclaimResolvedState;
  currentRouteLabel: string;
}): ReclaimMemorySurfaceV1 {
  return {
    rootTestId: 'prestige-reclaim-memory-panel',
    title: 'Reclaim Memory',
    currentRouteLabel: input.currentRouteLabel,
    summary: input.resolved.summary,
    rows: input.resolved.rows.map((row) => ({
      id: row.record.memoryId,
      domain: row.record.domain,
      state: row.state,
      stateLabel: STATE_LABELS[row.state],
      title: DOMAIN_LABELS[row.record.domain],
      priorBestLabel: row.priorBestLabel,
      stopConditionLabel: row.stopConditionLabel,
      playerReason: row.playerReason,
      routeComparison: row.routeComparison,
      inspector: {
        mechanicalEffectLabel: buildMechanicalEffectLabel(row),
        safetyLabel: 'Reclaim memory never weakens enemies, gates, trials, or combat resolution.',
        rememberedLifeLabel: `Remembered from ${row.record.lastLifeId}.`,
      },
      actions: [{ label: 'Inspect Memory', kind: 'inspect' }],
    })),
    emptyState: input.resolved.rows.length === 0
      ? 'No prior component memory is stored yet. Reincarnate after meaningful progress to seed Reclaim Memory.'
      : null,
    accessibility: {
      noHoverOnlyTruth: true,
      nonColorStateText: true,
      reducedMotionPreservesMeaning: true,
    },
  };
}
