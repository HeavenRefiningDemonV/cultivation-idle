import type { DaoOmenKind } from './daoOmenProjectionTypes.js';

export interface DaoOmenCopyEntry {
  title: string;
  detail: string;
  expandedDetail?: string;
}

export const DAO_OMEN_KIND_LIST = [
  'quiet',
  'life_setup',
  'threshold_unreached',
  'proof_missing',
  'reserve_thin',
  'gear_floor_strained',
  'doctrine_uncertain',
  'support_reserve_low',
  'currency_reserve_low',
  'source_drought',
  'attemptable',
  'risky_attempt',
  'reflection',
  'safety_net_ready',
  'breakthrough_ready',
  'reincarnation_viable',
  'content_cap',
] as const satisfies readonly DaoOmenKind[];

export const DAO_OMEN_DEFAULT_COPY: Record<DaoOmenKind, DaoOmenCopyEntry> = {
  quiet: {
    title: 'No pressure gathered',
    detail: 'No pressure has gathered.',
  },
  life_setup: {
    title: 'Doctrine anchor missing',
    detail: 'This life has no doctrine anchor.',
  },
  threshold_unreached: {
    title: 'Realm edge silent',
    detail: 'The gate remains silent until this realm reaches its edge.',
  },
  proof_missing: {
    title: 'Gate proof unsealed',
    detail: 'The gate proof has not been sealed.',
  },
  reserve_thin: {
    title: 'Survival reserve thin',
    detail: 'Survival reserve looks thin.',
  },
  gear_floor_strained: {
    title: 'Weapon floor pressured',
    detail: 'The weapon floor is under pressure.',
  },
  doctrine_uncertain: {
    title: 'Doctrine expression incomplete',
    detail: 'Doctrine expression looks incomplete.',
  },
  support_reserve_low: {
    title: 'Background support thin',
    detail: 'Background support looks thin.',
  },
  currency_reserve_low: {
    title: 'Mercy reserve low',
    detail: 'The mercy reserve is low.',
  },
  source_drought: {
    title: 'Source thread dry',
    detail: 'A needed source thread has run dry.',
  },
  attemptable: {
    title: 'Gate open',
    detail: 'The gate is open to an attempt.',
  },
  risky_attempt: {
    title: 'Gate open, proof thin',
    detail: 'The gate is open, but one proof feels thin.',
  },
  reflection: {
    title: 'Pattern repeated',
    detail: 'The same pattern has appeared again.',
  },
  safety_net_ready: {
    title: 'Mercy proof ready',
    detail: 'A mercy proof can now be sealed.',
  },
  breakthrough_ready: {
    title: 'Breakthrough proof sealed',
    detail: 'Qi and proof are sealed.',
  },
  reincarnation_viable: {
    title: 'Reincarnation viable',
    detail: 'This life can become permanent progress.',
  },
  content_cap: {
    title: 'Authored chapter complete',
    detail: 'The authored chapter is complete.',
  },
};

export const DAO_OMEN_FORBIDDEN_DEFAULT_COPY_PATTERNS = [
  'Open Apothecary',
  'Restock Apothecary',
  'Brew Medicine',
  'Stock Healing',
  'Open Forge',
  'Raise Forge',
  'Refine Weapon',
  'Temper Gear',
  'Tune Techniques',
  'Open Techniques',
  'Equip Iron Palm',
  'Change AI',
  'Cultivate Qi',
  'Go Cultivate',
  'Launch Expedition',
  'Run Ruins',
  'Farm Outskirts',
  'Go to Bounties',
  'Primary Route',
  'Best Next Action',
  'Biggest Shortfall',
  'Mandate points elsewhere',
  'Current Mandate Primary Route',
  'Mandate Chamber Primary Route',
  'route-led',
  'do this now',
  'must go',
] as const;

const FORBIDDEN_DEFAULT_COPY_REGEX = new RegExp(
  DAO_OMEN_FORBIDDEN_DEFAULT_COPY_PATTERNS.map(escapeRegExp).join('|'),
  'i',
);

export function getDaoOmenDefaultCopy(kind: DaoOmenKind): DaoOmenCopyEntry {
  return DAO_OMEN_DEFAULT_COPY[kind];
}

export function containsDaoOmenForbiddenDefaultCopy(text: string): boolean {
  return FORBIDDEN_DEFAULT_COPY_REGEX.test(text);
}

export function assertDaoOmenCopyBudget(entry: DaoOmenCopyEntry): boolean {
  return entry.title.length <= 40
    && entry.detail.length <= 130
    && !entry.title.includes('\n')
    && !entry.detail.includes('\n')
    && (entry.expandedDetail === undefined || entry.expandedDetail.length <= 240);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
