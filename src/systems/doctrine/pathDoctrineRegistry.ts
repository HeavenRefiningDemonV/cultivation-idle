import { PATH_MODIFIERS } from '../../constants/index.js';
import type { CultivationPath, PathModifiers } from '../../types/index.js';
import type {
  PathDoctrineCoreIdentity,
  PathDoctrineProfile,
} from './pathDoctrineTypes.js';

type PathDoctrineSemanticAuthoring = {
  readonly label: string;
  readonly summary: string;
  readonly coreIdentity: PathDoctrineCoreIdentity;
  readonly playIdentityKeywords: readonly string[];
  readonly doctrineBudget: PathDoctrineProfile['doctrineBudget'];
  readonly prepBias: readonly string[];
  readonly forgeBias: readonly string[];
  readonly buildBiasSummary: readonly string[];
  readonly recommendedAiByPhase: {
    early: PathDoctrineProfile['recommendedAiByPhase']['early'];
    boss: PathDoctrineProfile['recommendedAiByPhase']['boss'];
  };
  readonly commonFailureModes: readonly string[];
  readonly objectiveLine: string;
};

const PATH_DOCTRINE_SEMANTICS: Readonly<Record<CultivationPath, PathDoctrineSemanticAuthoring>> = Object.freeze({
  heaven: Object.freeze({
    label: 'Heaven',
    summary:
      'Refined technique-forward cultivation with strong burst windows and qi tempo, but lower forgiveness when survival prep is greedy.',
    coreIdentity: 'precision_pressure',
    playIdentityKeywords: Object.freeze(['scripture', 'flow', 'precision', 'timed-burst-setup', 'calm-control']),
    doctrineBudget: Object.freeze([
      Object.freeze({ label: 'Damage / Burst', weight: 35 }),
      Object.freeze({ label: 'Setup / Control', weight: 25 }),
      Object.freeze({ label: 'Cultivation / Cycle', weight: 25 }),
      Object.freeze({ label: 'Survivability', weight: 15 }),
    ]) as PathDoctrineProfile['doctrineBudget'],
    prepBias: Object.freeze(['qi-elixir', 'focus', 'quiet-breath', 'windstep']),
    forgeBias: Object.freeze(['weapon-refine-first', 'precision-offense-temper', 'survival-patch-before-push']),
    buildBiasSummary: Object.freeze([
      '2 damage actives',
      '1 setup/control slot',
      '1 mobility/tempo or defensive flex',
      'Passives favor cycle/crit/control/technique efficiency',
    ]),
    recommendedAiByPhase: Object.freeze({
      early: Object.freeze(['balanced', 'farmer'] as const),
      boss: Object.freeze(['burst', 'balanced'] as const),
    }),
    commonFailureModes: Object.freeze([
      'underprepared-floor',
      'offense-greed-without-backstop',
      'missing-defensive-tempo-backstop',
    ]),
    objectiveLine: 'Build precise burst windows while protecting a thin survival floor.',
  }),
  earth: Object.freeze({
    label: 'Earth',
    summary:
      'Stable body-centered doctrine that converts durability into steady pressure; forgiving overall, but can stall without a finisher.',
    coreIdentity: 'durable_inevitability',
    playIdentityKeywords: Object.freeze(['body-cultivation', 'guard', 'steadiness', 'attrition', 'patient-inevitability']),
    doctrineBudget: Object.freeze([
      Object.freeze({ label: 'Durability / Sustain', weight: 40 }),
      Object.freeze({ label: 'Counter / Control', weight: 20 }),
      Object.freeze({ label: 'Raw Damage', weight: 20 }),
      Object.freeze({ label: 'Cultivation / Tempo', weight: 20 }),
    ]) as PathDoctrineProfile['doctrineBudget'],
    prepBias: Object.freeze(['ironblood', 'ward-salt', 'meridian-warmth']),
    forgeBias: Object.freeze([
      'weapon-floor-first-then-defense-floor',
      'defensive-temper-early',
      'balanced-refine-over-glass-cannon',
    ]),
    buildBiasSummary: Object.freeze([
      '1 strike slot',
      '1 guard/shield/counter backstop',
      '1 sustain or single-target finisher',
      'Passives favor HP/DEF/regen/stability',
    ]),
    recommendedAiByPhase: Object.freeze({
      early: Object.freeze(['balanced', 'survivor'] as const),
      boss: Object.freeze(['survivor', 'balanced'] as const),
    }),
    commonFailureModes: Object.freeze([
      'stalling-without-finisher',
      'underforged-floor',
      'overdefended-no-pressure',
    ]),
    objectiveLine: 'Turn durability into inevitability and avoid stalling without a finisher.',
  }),
  martial: Object.freeze({
    label: 'Martial',
    summary:
      'Aggressive combat-shaped doctrine with the strongest kill-window feel; wins through tempo chains, loses when sustain discipline breaks.',
    coreIdentity: 'tempo_kill_window',
    playIdentityKeywords: Object.freeze(['will', 'conflict', 'edge', 'execution', 'pressure']),
    doctrineBudget: Object.freeze([
      Object.freeze({ label: 'Burst / Kill Window', weight: 45 }),
      Object.freeze({ label: 'Tempo / Mobility', weight: 20 }),
      Object.freeze({ label: 'Setup / Opener', weight: 15 }),
      Object.freeze({ label: 'Survivability', weight: 20 }),
    ]) as PathDoctrineProfile['doctrineBudget'],
    prepBias: Object.freeze(['windstep', 'focus', 'mastery-tonic', 'ironblood-fallback']),
    forgeBias: Object.freeze(['weapon-refine-first', 'offense-temper-first', 'survival-patch-if-sustain-collapses']),
    buildBiasSummary: Object.freeze([
      'opener/setup slot',
      'core strike slot',
      'execute/finisher slot',
      'mobility/tempo flex and passives favor ATK/crit/cooldown/tempo',
    ]),
    recommendedAiByPhase: Object.freeze({
      early: Object.freeze(['farmer', 'balanced'] as const),
      boss: Object.freeze(['burst', 'balanced'] as const),
    }),
    commonFailureModes: Object.freeze([
      'underdefended-burst-greed',
      'sustain-collapse',
      'wrong-ai-posture-for-boss',
    ]),
    objectiveLine: 'Chain tempo into kill windows without letting sustain collapse.',
  }),
});


function cloneDoctrineBudget(
  doctrineBudget: PathDoctrineProfile['doctrineBudget'],
): PathDoctrineProfile['doctrineBudget'] {
  return [
    { ...doctrineBudget[0] },
    { ...doctrineBudget[1] },
    { ...doctrineBudget[2] },
    { ...doctrineBudget[3] },
  ];
}

function clonePathModifierSignature(path: CultivationPath): PathModifiers {
  const modifierSignature = PATH_MODIFIERS[path];

  return {
    qiMultiplier: modifierSignature.qiMultiplier,
    hpMultiplier: modifierSignature.hpMultiplier,
    atkMultiplier: modifierSignature.atkMultiplier,
    defMultiplier: modifierSignature.defMultiplier,
    critBonus: modifierSignature.critBonus,
    dodgeBonus: modifierSignature.dodgeBonus,
  };
}

function freezePathDoctrineProfile(profile: PathDoctrineProfile): PathDoctrineProfile {
  Object.freeze(profile.modifierSignature);
  Object.freeze(profile.playIdentityKeywords);
  profile.doctrineBudget.forEach((entry) => Object.freeze(entry));
  Object.freeze(profile.doctrineBudget);
  Object.freeze(profile.prepBias);
  Object.freeze(profile.forgeBias);
  Object.freeze(profile.buildBias);
  Object.freeze(profile.buildBiasSummary);
  Object.freeze(profile.recommendedAiByPhase.early);
  Object.freeze(profile.recommendedAiByPhase.boss);
  Object.freeze(profile.recommendedAiByPhase);
  Object.freeze(profile.commonFailureModes);

  return Object.freeze(profile);
}

function buildPathDoctrineProfile(path: CultivationPath): PathDoctrineProfile {
  const semanticProfile = PATH_DOCTRINE_SEMANTICS[path];

  return freezePathDoctrineProfile({
    id: path,
    label: semanticProfile.label,
    summary: semanticProfile.summary,
    coreIdentity: semanticProfile.coreIdentity,
    modifierSignature: clonePathModifierSignature(path),
    playIdentityKeywords: [...semanticProfile.playIdentityKeywords],
    doctrineBudget: cloneDoctrineBudget(semanticProfile.doctrineBudget),
    prepBias: [...semanticProfile.prepBias],
    forgeBias: [...semanticProfile.forgeBias],
    buildBias: [...semanticProfile.buildBiasSummary],
    buildBiasSummary: [...semanticProfile.buildBiasSummary],
    recommendedAiByPhase: {
      early: [...semanticProfile.recommendedAiByPhase.early],
      boss: [...semanticProfile.recommendedAiByPhase.boss],
    },
    commonFailureModes: [...semanticProfile.commonFailureModes],
    objectiveLine: semanticProfile.objectiveLine,
  });
}

export const PATH_DOCTRINE_ORDER: readonly CultivationPath[] = Object.freeze([
  'heaven',
  'earth',
  'martial',
]);

export const PATH_DOCTRINE_REGISTRY: readonly PathDoctrineProfile[] = Object.freeze(
  PATH_DOCTRINE_ORDER.map((path) => buildPathDoctrineProfile(path)),
);

export const PATH_DOCTRINE_REGISTRY_BY_ID: Readonly<Record<CultivationPath, PathDoctrineProfile>> = Object.freeze(
  Object.fromEntries(
    PATH_DOCTRINE_REGISTRY.map((profile) => [profile.id, profile]),
  ) as Record<CultivationPath, PathDoctrineProfile>,
);

export function getAllPathDoctrineProfiles(): PathDoctrineProfile[] {
  return [...PATH_DOCTRINE_REGISTRY];
}

export function getPathDoctrineProfile(path: CultivationPath | null): PathDoctrineProfile | null {
  if (path === null) {
    return null;
  }

  return PATH_DOCTRINE_REGISTRY_BY_ID[path];
}

export function getPathDoctrineSummary(path: CultivationPath | null): string {
  if (path === null) {
    return 'No path selected.';
  }

  return getPathDoctrineProfile(path)?.summary ?? 'No path selected.';
}
