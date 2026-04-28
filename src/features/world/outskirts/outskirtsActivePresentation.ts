import type {
  OutskirtsActiveChainBadge,
  OutskirtsCombatStage,
  OutskirtsEncounterStrip,
  OutskirtsMockupRuntimeSnapshot,
  OutskirtsSurfaceValueSource,
} from './types.js';

function toLevelLabel(input: string | null | undefined, fallback = 'Lv. 11'): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function formatOutskirtsElapsedClock(elapsedMs: number): string {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return '00:00:00';
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function resolveOutskirtsActiveBossLabel(input: {
  combatStage: OutskirtsCombatStage;
  killsToBoss: number;
  killsSinceBoss: number;
  explicitLabel?: string;
}): { label: string; tone: 'neutral' | 'warning' } {
  const explicit = input.explicitLabel?.trim();
  if (explicit) return { label: explicit, tone: 'neutral' };
  if (input.combatStage.enemy.isBoss) return { label: 'Boss fight', tone: 'warning' };
  const bossChip = input.combatStage.chips.find((chip) => chip.id === 'boss-countdown');
  if (bossChip?.label) return { label: bossChip.label, tone: bossChip.tone === 'warning' ? 'warning' : 'neutral' };
  const safeTarget = Number.isFinite(input.killsToBoss) ? Math.max(0, Math.round(input.killsToBoss)) : 0;
  const safeProgress = Number.isFinite(input.killsSinceBoss) ? Math.max(0, Math.round(input.killsSinceBoss)) : 0;
  const remaining = Math.max(0, safeTarget - safeProgress);
  if (remaining === 0) return { label: 'Boss ready', tone: 'warning' };
  return { label: `Boss in ${remaining}`, tone: 'neutral' };
}

export function buildOutskirtsActiveChainBadge(input: {
  snapshot: OutskirtsMockupRuntimeSnapshot;
  combatStage: OutskirtsCombatStage;
  source: OutskirtsSurfaceValueSource;
}): OutskirtsActiveChainBadge {
  if (!input.combatStage.active) {
    return {
      visible: false,
      title: '',
      bossLabel: '',
      bossTone: 'neutral',
      source: 'derived',
    };
  }

  const boss = resolveOutskirtsActiveBossLabel({
    combatStage: input.combatStage,
    killsToBoss: input.snapshot.killsToBoss,
    killsSinceBoss: input.snapshot.killsSinceBoss,
    explicitLabel: input.snapshot.activeChainBossLabel,
  });

  const fallbackTitle = input.snapshot.sourceMode === 'fixture'
    ? 'Quiet Glade Chain'
    : `${input.snapshot.outskirtsLabel || 'Outskirts'} Chain`;

  return {
    visible: true,
    title: input.snapshot.activeChainTitle?.trim() || fallbackTitle,
    bossLabel: boss.label,
    bossTone: boss.tone,
    source: input.source,
  };
}

export function buildOutskirtsActiveEncounterStrip(input: {
  snapshot: OutskirtsMockupRuntimeSnapshot;
  combatStage: OutskirtsCombatStage;
}): OutskirtsEncounterStrip {
  const currentEnemyName = input.combatStage.enemy.name.trim() || input.snapshot.selectedEncounterName || 'Unknown Foe';
  const currentEnemyLevel = toLevelLabel(input.combatStage.enemy.levelLabel, toLevelLabel(input.snapshot.selectedEncounterLevelLabel));
  const unknownLevel = currentEnemyLevel || 'Lv. 11';
  const fixtureActive = input.snapshot.sourceMode === 'fixture';
  const nodes: Array<{
    id: string;
    label: string;
    levelLabel: string;
    state: 'current' | 'future';
    selected: boolean;
    medallionVariant: 'wolf-jade' | 'unknown-parchment' | 'boss-gold';
    imageSrc?: string;
  }> = [
    { id: input.combatStage.enemy.id ?? 'active-current', label: currentEnemyName, levelLabel: currentEnemyLevel, state: 'current', selected: true, medallionVariant: 'wolf-jade' as const, imageSrc: undefined },
    { id: 'active-unknown-1', label: 'Unknown Foe', levelLabel: unknownLevel, state: 'future', selected: false, medallionVariant: 'unknown-parchment' as const },
    { id: 'active-unknown-2', label: 'Unknown Foe', levelLabel: unknownLevel, state: 'future', selected: false, medallionVariant: 'unknown-parchment' as const },
    { id: 'active-unknown-3', label: 'Unknown Foe', levelLabel: unknownLevel, state: 'future', selected: false, medallionVariant: 'unknown-parchment' as const },
    { id: 'active-unknown-4', label: 'Unknown Foe', levelLabel: unknownLevel, state: 'future', selected: false, medallionVariant: 'unknown-parchment' as const },
    { id: 'active-boss', label: 'Boss', levelLabel: 'Lv. 15', state: 'future', selected: false, medallionVariant: 'boss-gold' as const },
    { id: 'active-unknown-5', label: 'Unknown Foe', levelLabel: unknownLevel, state: 'future', selected: false, medallionVariant: 'unknown-parchment' as const },
  ];

  return {
    mode: 'active-chain',
    ariaLabel: 'Active Outskirts hunt chain',
    selectedEncounterId: nodes[0]?.id ?? input.snapshot.selectedEncounterId,
    leftArrow: { visible: true, enabled: false, ariaLabel: 'Previous active chain node', ornamentVariant: 'parchment' },
    rightArrow: { visible: true, enabled: false, ariaLabel: 'Next active chain node', ornamentVariant: 'parchment' },
    lane: { showConnector: true, connectorVariant: 'brush' },
    nodes: nodes.map((node, index) => ({
      id: node.id,
      label: node.label,
      levelLabel: node.levelLabel,
      state: node.state,
      artKey: index === 0 && fixtureActive ? 'outskirts/encounter/snarling-wolf' : undefined,
      imageSrc: index === 0 ? undefined : undefined,
      silhouetteImageSrc: undefined,
      medallionVariant: node.medallionVariant,
      isSelected: node.selected,
      isClickable: false,
      ariaLabel: `${node.label} ${node.levelLabel} ${node.state}${node.selected ? ' selected' : ''}`,
    })),
  };
}
