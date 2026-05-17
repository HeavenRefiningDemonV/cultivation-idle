import type { PrestigeUpgradeDef } from '../../../content/index.js';
import { REALMS } from '../../../constants/index.js';
import { buildPrestigeStarterSpendPlan } from '../../../systems/prestige/prestigeStarterSpendPlanner.js';
import type { SpiritRoot } from '../../../types/index.js';
import {
  PRESTIGE_LEDGER_FIXTURE_RECEIPT_ROWS,
  PRESTIGE_LEDGER_NEXT_LIFE_PREVIEW,
  PRESTIGE_LEDGER_PLACEHOLDER_RECOMMENDATIONS,
  PRESTIGE_LEDGER_REALM_THREAD,
  PRESTIGE_LEDGER_RECOMMENDATION_ALIASES,
  PRESTIGE_LEDGER_RESET_TABLETS,
} from './prestigeLedgerExactPresentation.js';
import type {
  PrestigeLedgerButtonSurface,
  PrestigeLedgerExactLiveInput,
  PrestigeLedgerExactSurfaceV1,
  PrestigeLedgerLifeThreadNode,
  PrestigeLedgerSealState,
  PrestigeRecommendedDecreeCard,
} from './prestigeLedgerExactTypes.js';

const QUALITY_NAMES: Record<number, string> = {
  1: 'Mortal',
  2: 'Common',
  3: 'Uncommon',
  4: 'Rare',
  5: 'Legendary',
};

const ROOT_TEST_ID = 'prestige-ledger-exact-page' as const;

const sharedShell = {
  topLevelTabPage: true,
  useExistingBottomNav: true,
  showLegacyVerticalStack: false,
  showFullDecreeTreeByDefault: false,
  singleDominantCta: true,
} as const;

const titleCase = (value: string): string =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');

const formatAp = (value: number): string => `+${Math.max(0, Math.floor(value))} AP`;

const formatInteger = (value: number): string => `${Math.max(0, Math.floor(value))}`;

const buildButton = (
  label: string,
  enabled: boolean,
  variant: PrestigeLedgerButtonSurface['variant'],
  reason?: string,
): PrestigeLedgerButtonSurface => ({
  label,
  enabled,
  variant: enabled ? variant : 'disabled',
  ariaLabel: label,
  reason,
});

const buildLifeThread = (currentRealmIndex: number): PrestigeLedgerLifeThreadNode[] =>
  PRESTIGE_LEDGER_REALM_THREAD.map((label, index) => ({
    label,
    state: index < currentRealmIndex ? 'reached' : index === currentRealmIndex ? 'current' : 'future',
  }));

const formatSpiritRoot = (root: SpiritRoot | null): string => {
  if (!root) return 'Not yet awakened';
  const element = titleCase(root.element);
  const grade = QUALITY_NAMES[root.grade] ?? `Grade ${root.grade}`;
  return `${element} · ${grade} · ${Math.round(root.purity)}% purity`;
};

const resolveSealState = (input: PrestigeLedgerExactLiveInput): PrestigeLedgerSealState => {
  if (!input.prestige.canPrestige) return 'locked';
  if (input.advisor.stateLabel === 'Recommended' || input.prestige.contentCapReached) return 'recommended';
  return 'viable';
};

const resolveVerdict = (state: PrestigeLedgerSealState): string => {
  if (state === 'locked') return 'TOO EARLY';
  if (state === 'viable') return 'VIABLE';
  if (state === 'complete') return 'COMPLETE';
  return 'RECOMMENDED';
};

const resolveStatusLine = (input: PrestigeLedgerExactLiveInput, sealState: PrestigeLedgerSealState): string => {
  if (sealState === 'locked') return 'Core Formation is required before the ledger can be sealed.';
  if (sealState === 'viable') return 'Reincarnation is available, though deeper milestones may improve value.';
  return 'Current life has reached a rational outer-loop handoff.';
};

const resolveAdvisorySentence = (input: PrestigeLedgerExactLiveInput, sealState: PrestigeLedgerSealState): string => {
  if (sealState === 'locked') return input.advisor.stateDetail;
  if (sealState === 'viable') return 'Continuing this life may improve long-term value before sealing it.';
  return 'Chapter exhausted; the next life will reclaim this ground faster.';
};

const currentWallFor = (input: PrestigeLedgerExactLiveInput): { value: string; emphasis?: 'warning' | 'normal' } => {
  if (input.advisor.stateLabel === 'Recommended' || input.prestige.contentCapReached) {
    return { value: 'Chapter exhausted', emphasis: 'warning' };
  }
  if (input.advisor.stateLabel === 'Too Early') {
    return { value: 'Core Formation required', emphasis: 'warning' };
  }
  return { value: 'Optional deeper push', emphasis: 'normal' };
};

const getRealmName = (realmIndex: number): string =>
  REALMS[Math.max(0, Math.min(REALMS.length - 1, Math.floor(realmIndex)))]?.name ?? 'Unknown Realm';

const getRealmSubstages = (realmIndex: number): number =>
  REALMS[Math.max(0, Math.min(REALMS.length - 1, Math.floor(realmIndex)))]?.substages ?? 9;

const formatHighestRealm = (input: PrestigeLedgerExactLiveInput): string => {
  const highestIndex = Math.max(input.prestige.highestRealmReached, input.game.realm.index);
  const substage = highestIndex === input.game.realm.index ? input.game.realm.substage : 1;
  return `${getRealmName(highestIndex)} ${Math.max(1, Math.floor(substage))}/${getRealmSubstages(highestIndex)}`;
};

const formatCitiesReached = (names: string[]): string => {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return 'No city record';
  if (clean.length <= 2) return clean.join(', ');
  return `${clean[0]}, ${clean[1]} +${clean.length - 2} more`;
};

const getUpgradeNextCost = (upgrade: PrestigeUpgradeDef, currentLevel: number): number | null => {
  if (currentLevel >= upgrade.maxLevel) return null;
  const nextLevel = currentLevel + 1;
  return upgrade.costs?.[nextLevel - 1] ?? upgrade.tiers?.[nextLevel - 1]?.cost ?? null;
};

const getNumericRecordValue = (value: unknown, key: string): number | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
};

const formatEffectLine = (upgrade: PrestigeUpgradeDef): string => {
  if (upgrade.id === 'ap_extra_technique_slot_1' || upgrade.id === 'ap_extra_technique_slot_2') {
    return 'Extra technique slot';
  }
  const perLevel = typeof upgrade.effectPerLevel === 'number'
    ? upgrade.effectPerLevel
    : getNumericRecordValue(upgrade.effectPerLevel, 'value') ?? getNumericRecordValue(upgrade.effect, 'value') ?? 0;
  const pct = Math.round(perLevel * 100);
  if (upgrade.id === 'ap_combat_mult' || upgrade.stat === 'combatMult') return `Combat power +${pct}%`;
  if (upgrade.id === 'ap_offline_efficiency') return `Offline efficiency +${pct}%`;
  if (upgrade.stat === 'idleQiMult') return `Idle Qi +${pct}%`;
  if (upgrade.id.includes('heartlaw')) return 'Heart Law unlock';
  if (upgrade.id.includes('mastery_retention')) return 'Mastery retention';
  return upgrade.description ?? 'Permanent decree effect';
};

const buildRecommendationCard = (args: {
  upgrade: PrestigeUpgradeDef;
  currentLevel: number;
  nextCost: number | null;
  affordance: PrestigeRecommendedDecreeCard['affordance'];
  reasonLine?: string;
}): PrestigeRecommendedDecreeCard => {
  const alias = PRESTIGE_LEDGER_RECOMMENDATION_ALIASES[args.upgrade.id];
  const isMaxed = args.currentLevel >= args.upgrade.maxLevel;
  const affordance = isMaxed ? 'owned' : args.affordance;
  return {
    id: args.upgrade.id,
    displayTitle: alias?.displayTitle ?? args.upgrade.name,
    actualUpgradeName: args.upgrade.name,
    costLabel: isMaxed ? 'Sealed' : args.nextCost === null ? 'Locked' : `${args.nextCost} AP`,
    effectLine: formatEffectLine(args.upgrade),
    whyLine: args.reasonLine ?? alias?.whyLine ?? 'Improves reclaim pacing in next life.',
    sealTone: alias?.sealTone ?? 'ink',
    affordance,
    button: affordance === 'info' ? undefined : buildButton('Inspect', true, 'secondary'),
  };
};

const buildLiveRecommendations = (input: PrestigeLedgerExactLiveInput): PrestigeRecommendedDecreeCard[] => {
  const planned = buildPrestigeStarterSpendPlan({
    apBudget: input.prestige.totalAP,
    purchasedLevels: input.prestige.purchasesById,
    visibleUpgrades: input.visibleUpgrades,
  }).orderedPlan.slice(0, 3);
  const visibleById = new Map(input.visibleUpgrades.map((upgrade) => [upgrade.id, upgrade]));
  const used = new Set<string>();

  const cards: PrestigeRecommendedDecreeCard[] = planned.flatMap((candidate) => {
    const upgrade = visibleById.get(candidate.id);
    if (!upgrade) return [];
    used.add(candidate.id);
    return buildRecommendationCard({
      upgrade,
      currentLevel: candidate.currentLevel,
      nextCost: candidate.nextCost,
      affordance: 'buy_now',
      reasonLine: candidate.reasonLine,
    });
  });

  const preferredOrder = ['ap_idle_qi_mult', 'ap_combat_mult', 'ap_extra_technique_slot_1'];
  const fallbackCandidates = [...input.visibleUpgrades].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.id);
    const bIndex = preferredOrder.indexOf(b.id);
    const normalizedA = aIndex === -1 ? 99 : aIndex;
    const normalizedB = bIndex === -1 ? 99 : bIndex;
    return normalizedA - normalizedB || a.id.localeCompare(b.id);
  });

  for (const upgrade of fallbackCandidates) {
    if (cards.length >= 3) break;
    if (used.has(upgrade.id)) continue;
    const currentLevel = input.prestige.purchasesById[upgrade.id] ?? 0;
    const nextCost = getUpgradeNextCost(upgrade, currentLevel);
    if (currentLevel >= upgrade.maxLevel && cards.some((card) => card.id === upgrade.id)) continue;
    cards.push(buildRecommendationCard({
      upgrade,
      currentLevel,
      nextCost,
      affordance: nextCost === null ? 'locked' : 'save_for_next',
      reasonLine: PRESTIGE_LEDGER_RECOMMENDATION_ALIASES[upgrade.id]?.whyLine,
    }));
    used.add(upgrade.id);
  }

  for (const placeholder of PRESTIGE_LEDGER_PLACEHOLDER_RECOMMENDATIONS) {
    if (cards.length >= 3) break;
    cards.push(placeholder);
  }

  return cards.slice(0, 3);
};

const buildResetTabletsFromPreview = (preview: PrestigeLedgerExactLiveInput['advisor']['resetPreview']) => [
  {
    title: 'Resets this life',
    tone: 'reset' as const,
    bullets: preview.resetsThisLife.slice(0, 4),
  },
  {
    title: 'Carries forward',
    tone: 'carry' as const,
    bullets: preview.carriesForward.slice(0, 4),
  },
  {
    title: 'Rebuilt next life',
    tone: 'rebuild' as const,
    bullets: (preview.rebuiltNextLife.length > 0 ? preview.rebuiltNextLife : ['New life-start flow']).slice(0, 4),
  },
];

export function createPrestigeLedgerExactMockupFixture(): PrestigeLedgerExactSurfaceV1 {
  return {
    meta: {
      mode: 'fixture',
      rootTestId: ROOT_TEST_ID,
      advisorState: 'Recommended',
      canPrestige: true,
      apGain: 21,
      contentCapReached: true,
      hasLastLifeSummary: false,
    },
    shell: sharedShell,
    header: {
      title: 'Prestige',
      subtitle: 'Reincarnation Ledger',
      sealText: 'Reincarnation ledger stamp',
      lifeThread: buildLifeThread(2),
      chips: [
        { label: 'AP Reserve', value: '0' },
        { label: 'Lifetime AP', value: '0' },
        { label: 'Lives', value: '0' },
      ],
    },
    currentLifeLedger: {
      title: 'Current Life Ledger',
      identityRows: [
        { label: 'Path:', value: 'Heaven' },
        { label: 'Spirit Root:', value: 'Earth · Uncommon · 93% purity' },
        { label: 'Heart Law:', value: 'Ember Thread Sutra' },
        { label: 'Highest Realm:', value: 'Core Formation 4/9' },
      ],
      progressRows: [
        { label: 'Gates resolved:', value: '3' },
        { label: 'Cities reached:', value: 'Pinewind Hamlet' },
        { label: 'Current wall:', value: 'Chapter exhausted', emphasis: 'warning' },
      ],
      apReceiptRows: [...PRESTIGE_LEDGER_FIXTURE_RECEIPT_ROWS],
      projectedGainLabel: 'Projected gain',
      projectedGainValue: '+21 AP',
      viewLifeSummaryButton: buildButton('View Life Summary', true, 'secondary'),
    },
    reincarnationDecree: {
      title: 'Reincarnation Decree',
      sealState: 'recommended',
      verdictLabel: 'RECOMMENDED',
      apValueLabel: '+21 AP',
      statusLine: 'Current life has reached a rational outer-loop handoff.',
      advisorySentence: 'Chapter exhausted; the next life will reclaim this ground faster.',
      primaryAction: buildButton('Review & Reincarnate', true, 'primary'),
      secondaryAction: buildButton('Open Decree Library', true, 'secondary'),
    },
    nextLifeRail: {
      previewBullets: [...PRESTIGE_LEDGER_NEXT_LIFE_PREVIEW],
      recommendedDecrees: [
        {
          id: 'ap_idle_qi_mult',
          displayTitle: 'Root Memory',
          actualUpgradeName: 'Idle Qi Multiplier',
          costLabel: '12 AP',
          effectLine: 'Idle Qi +10%',
          whyLine: 'Best first reclaim speed.',
          sealTone: 'jade',
          affordance: 'buy_now',
          button: buildButton('Inspect', true, 'secondary'),
        },
        {
          id: 'ap_combat_mult',
          displayTitle: 'Combat Memory',
          actualUpgradeName: 'Combat Power Multiplier',
          costLabel: '10 AP',
          effectLine: 'Combat power +8%',
          whyLine: 'Softens gate retries.',
          sealTone: 'gold',
          affordance: 'buy_now',
          button: buildButton('Inspect', true, 'secondary'),
        },
        {
          id: 'ap_extra_technique_slot_1',
          displayTitle: 'Technique Warrant',
          actualUpgradeName: 'Extra Technique Slot I',
          costLabel: '15 AP',
          effectLine: 'Extra technique slot',
          whyLine: 'Improves build flexibility.',
          sealTone: 'cinnabar',
          affordance: 'buy_now',
          button: buildButton('Inspect', true, 'secondary'),
        },
      ],
      openLibraryButton: buildButton('Open Full Decree Library', true, 'secondary'),
    },
    resetContract: {
      title: 'Reset Contract',
      tablets: PRESTIGE_LEDGER_RESET_TABLETS.map((tablet) => ({ ...tablet, bullets: [...tablet.bullets] })),
    },
  };
}

export function buildPrestigeLedgerExactSurfaceFromStores(input: PrestigeLedgerExactLiveInput): PrestigeLedgerExactSurfaceV1 {
  const highestIndex = Math.max(input.prestige.highestRealmReached, input.game.realm.index);
  const wall = currentWallFor(input);
  const sealState = resolveSealState(input);
  const canReview = input.prestige.canPrestige && input.prestige.apGain > 0;

  return {
    meta: {
      mode: input.mode,
      rootTestId: ROOT_TEST_ID,
      advisorState: input.advisor.stateLabel,
      canPrestige: input.prestige.canPrestige,
      apGain: input.prestige.apGain,
      contentCapReached: input.prestige.contentCapReached,
      hasLastLifeSummary: input.prestige.hasLastLifeSummary,
    },
    shell: sharedShell,
    header: {
      title: 'Prestige',
      subtitle: 'Reincarnation Ledger',
      sealText: 'Reincarnation ledger stamp',
      lifeThread: buildLifeThread(Math.max(0, Math.min(PRESTIGE_LEDGER_REALM_THREAD.length - 1, highestIndex))),
      chips: [
        { label: 'AP Reserve', value: formatInteger(input.prestige.totalAP) },
        { label: 'Lifetime AP', value: formatInteger(input.prestige.lifetimeAP) },
        { label: 'Lives', value: formatInteger(input.prestige.prestigeCount) },
      ],
    },
    currentLifeLedger: {
      title: 'Current Life Ledger',
      identityRows: [
        { label: 'Path:', value: input.game.selectedPath ? titleCase(input.game.selectedPath) : 'Unchosen' },
        { label: 'Spirit Root:', value: formatSpiritRoot(input.prestige.spiritRoot) },
        { label: 'Heart Law:', value: input.heartLawName ?? 'No Heart Law selected' },
        { label: 'Highest Realm:', value: formatHighestRealm(input) },
      ],
      progressRows: [
        { label: 'Gates resolved:', value: formatInteger(input.resolvedGateCount) },
        { label: 'Cities reached:', value: formatCitiesReached(input.cityNamesReached) },
        { label: 'Current wall:', value: wall.value, emphasis: wall.emphasis },
      ],
      apReceiptRows: input.prestige.breakdown.rows.map((row) => ({
        label: row.label,
        value: formatAp(row.value),
        hint: row.hint,
      })),
      projectedGainLabel: 'Projected gain',
      projectedGainValue: formatAp(input.prestige.apGain),
      viewLifeSummaryButton: buildButton('View Life Summary', true, 'secondary'),
    },
    reincarnationDecree: {
      title: 'Reincarnation Decree',
      sealState,
      verdictLabel: resolveVerdict(sealState),
      apValueLabel: formatAp(input.prestige.apGain),
      statusLine: resolveStatusLine(input, sealState),
      advisorySentence: resolveAdvisorySentence(input, sealState),
      primaryAction: buildButton(
        canReview ? 'Review & Reincarnate' : 'Reincarnation Locked',
        canReview,
        'primary',
        canReview ? undefined : input.advisor.stateDetail,
      ),
      secondaryAction: buildButton('Open Decree Library', true, 'secondary'),
    },
    nextLifeRail: {
      previewBullets: [...PRESTIGE_LEDGER_NEXT_LIFE_PREVIEW],
      recommendedDecrees: buildLiveRecommendations(input),
      openLibraryButton: buildButton('Open Full Decree Library', true, 'secondary'),
    },
    resetContract: {
      title: 'Reset Contract',
      tablets: buildResetTabletsFromPreview(input.advisor.resetPreview),
    },
    runCompassHint: input.runCompassHint ?? null,
    debug: {
      notes: [
        `Live recommendations drawn from ${input.visibleUpgrades.length} visible runtime prestige upgrades.`,
        `AP gain supplied by store/read-model input: ${input.prestige.apGain}.`,
      ],
    },
  };
}
