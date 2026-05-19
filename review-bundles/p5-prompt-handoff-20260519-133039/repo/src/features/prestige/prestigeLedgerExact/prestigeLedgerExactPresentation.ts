import type { PrestigeRecommendedDecreeCard } from './prestigeLedgerExactTypes.js';

export const PRESTIGE_LEDGER_REALM_THREAD = [
  'Qi Condensation',
  'Foundation',
  'Core Formation',
  'Nascent Soul',
  'Soul Transformation',
  'Void Ascension',
] as const;

export const PRESTIGE_LEDGER_NEXT_LIFE_PREVIEW = [
  'Faster early Qi recovery',
  'First city baseline rebuilt',
  'Permanent edicts re-applied',
  'Earlier technique infrastructure',
] as const;

export const PRESTIGE_LEDGER_FIXTURE_RECEIPT_ROWS = [
  { label: 'Realm base', value: '+12 AP' },
  { label: 'Substage depth', value: '+3 AP' },
  { label: 'Gate bonus', value: '+6 AP' },
] as const;

export const PRESTIGE_LEDGER_RESET_TABLETS = [
  {
    title: 'Resets this life',
    tone: 'reset',
    bullets: ['Realm / Qi', 'Inventory', 'Combat and trials', 'Current activities'],
  },
  {
    title: 'Carries forward',
    tone: 'carry',
    bullets: ['AP and edicts', 'Lifetime AP', 'Prestige count', 'Settings'],
  },
  {
    title: 'Rebuilt next life',
    tone: 'rebuild',
    bullets: ['First city baseline', 'Edict-derived slots', 'Permanent unlocks', 'New life-start flow'],
  },
] as const;

export const PRESTIGE_LEDGER_RECOMMENDATION_ALIASES: Record<string, {
  displayTitle: string;
  sealTone: PrestigeRecommendedDecreeCard['sealTone'];
  whyLine: string;
}> = {
  ap_idle_qi_mult: {
    displayTitle: 'Root Memory',
    sealTone: 'jade',
    whyLine: 'Best first reclaim speed.',
  },
  ap_combat_mult: {
    displayTitle: 'Combat Memory',
    sealTone: 'gold',
    whyLine: 'Softens gate retries.',
  },
  ap_extra_technique_slot_1: {
    displayTitle: 'Technique Warrant',
    sealTone: 'cinnabar',
    whyLine: 'Improves build flexibility.',
  },
};

export const PRESTIGE_LEDGER_PLACEHOLDER_RECOMMENDATIONS: PrestigeRecommendedDecreeCard[] = [
  {
    id: 'save_ap_next_ritual',
    displayTitle: 'Save AP',
    costLabel: 'Next ritual',
    effectLine: 'Bank AP for stronger edicts',
    whyLine: 'No affordable decree is ready yet.',
    sealTone: 'ink',
    affordance: 'info',
  },
  {
    id: 'resolve_gate_trials',
    displayTitle: 'Resolve Gates',
    costLabel: 'Progress',
    effectLine: 'More AP receipt weight',
    whyLine: 'Gate outcomes improve future handoff value.',
    sealTone: 'jade',
    affordance: 'info',
  },
  {
    id: 'push_current_life',
    displayTitle: 'Push Current Life',
    costLabel: 'Later',
    effectLine: 'Improve reset timing',
    whyLine: 'Continuing may make the next decree affordable.',
    sealTone: 'gold',
    affordance: 'info',
  },
];
