import { buildDaoOmenProjectionV1 } from '../../systems/ui/daoMandate/buildDaoOmenProjectionV1.js';
import { createDaoOmenProjectionRawFixture } from '../../systems/ui/daoMandate/daoOmenProjectionFixtures.js';
import type {
  DaoCurrentOmenV1,
  DaoOmenProjectionV1,
  DaoPressureBadgeKind,
  DaoPressureBadgeV1,
  DaoProofSealV1,
  DaoReflectionV1,
  DaoSourceThreadV1,
} from '../../systems/ui/daoMandate/daoOmenProjectionTypes.js';
import type { DaoOmenProjectionFixtureState } from '../../systems/ui/daoMandate/daoOmenProjectionFixtures.js';

export interface DaoMandateComponentFixtures {
  quiet: { currentOmen: DaoCurrentOmenV1 };
  thresholdShort: { currentOmen: DaoCurrentOmenV1 };
  proofMissing: { currentOmen: DaoCurrentOmenV1 };
  survivalReserveThin: { currentOmen: DaoCurrentOmenV1 };
  forgeFloorStrained: { currentOmen: DaoCurrentOmenV1 };
  doctrineUncertain: { currentOmen: DaoCurrentOmenV1 };
  reflection: { currentOmen: DaoCurrentOmenV1 };
  safetyNetReady: { currentOmen: DaoCurrentOmenV1 };
  breakthroughReady: { currentOmen: DaoCurrentOmenV1 };
  contentCap: { currentOmen: DaoCurrentOmenV1 };
  proofSeals: DaoProofSealV1[];
  proofSealsOverflow: DaoProofSealV1[];
  pressureBadges: DaoPressureBadgeV1[];
  sourceThreads: DaoSourceThreadV1[];
  reflectionPlaque: DaoReflectionV1;
}

const FIXTURE_NOW = 1_777_104;

function projectionFor(state: DaoOmenProjectionFixtureState): DaoOmenProjectionV1 {
  return buildDaoOmenProjectionV1(createDaoOmenProjectionRawFixture(state), {
    includeDebug: false,
    now: FIXTURE_NOW,
  });
}

const quietOmen: DaoCurrentOmenV1 = {
  id: 'dao-component-fixture-quiet',
  kind: 'quiet',
  title: 'No pressure rises',
  detail: 'The life is steady; no urgent omen is visible.',
  severity: 'quiet',
  iconId: 'closed-scroll',
  tone: 'ink',
  allowDirectRoute: false,
  evidenceIds: [],
};

const thresholdShort = projectionFor('qi_short_before_realm_edge');
const proofMissing = projectionFor('gate_proof_missing_attemptable');
const survivalReserveThin = projectionFor('medicine_floor_short');
const forgeFloorStrained = projectionFor('forge_floor_shortfall');
const doctrineUncertain = projectionFor('doctrine_gap');
const reflection = projectionFor('repeated_underprepared_failure');
const safetyNetReady = projectionFor('safety_net_ready');
const breakthroughReady = projectionFor('breakthrough_ready');
const contentCap = projectionFor('content_cap_reached');

const pressureBadgeStates: DaoOmenProjectionFixtureState[] = [
  'medicine_floor_short',
  'forge_floor_shortfall',
  'doctrine_gap',
  'merit_reserve_low',
  'source_drought_herbs',
];

const pressureBadgeOrder: DaoPressureBadgeKind[] = ['survival', 'forge', 'doctrine', 'support', 'source'];

function collectPressureBadges(): DaoPressureBadgeV1[] {
  const byKind = new Map<DaoPressureBadgeKind, DaoPressureBadgeV1>();
  for (const state of pressureBadgeStates) {
    for (const badge of projectionFor(state).pressureBadges) {
      if (!byKind.has(badge.kind)) byKind.set(badge.kind, badge);
    }
  }

  return pressureBadgeOrder.flatMap((kind) => {
    const badge = byKind.get(kind);
    return badge ? [badge] : [];
  });
}

export const DAO_MANDATE_COMPONENT_FIXTURES: DaoMandateComponentFixtures = {
  quiet: { currentOmen: quietOmen },
  thresholdShort: { currentOmen: thresholdShort.currentOmen },
  proofMissing: { currentOmen: proofMissing.currentOmen },
  survivalReserveThin: { currentOmen: survivalReserveThin.currentOmen },
  forgeFloorStrained: { currentOmen: forgeFloorStrained.currentOmen },
  doctrineUncertain: { currentOmen: doctrineUncertain.currentOmen },
  reflection: { currentOmen: reflection.currentOmen },
  safetyNetReady: { currentOmen: safetyNetReady.currentOmen },
  breakthroughReady: { currentOmen: breakthroughReady.currentOmen },
  contentCap: { currentOmen: contentCap.currentOmen },
  proofSeals: [
    ...breakthroughReady.proofSeals.slice(0, 3),
    ...survivalReserveThin.proofSeals.filter((seal) => seal.kind === 'survival_reserve').slice(0, 1),
  ],
  proofSealsOverflow: [
    ...breakthroughReady.proofSeals,
    ...survivalReserveThin.proofSeals,
    ...forgeFloorStrained.proofSeals,
    ...doctrineUncertain.proofSeals,
    ...safetyNetReady.proofSeals,
    ...contentCap.proofSeals,
  ].slice(0, 8),
  pressureBadges: collectPressureBadges(),
  sourceThreads: [
    {
      id: 'dao-component-thread-survival-reserve',
      label: 'Survival reserve thread',
      missingThing: 'elixir reserve',
      sinkLabel: 'Gate pressure',
      evidenceLine: 'Reserve proof is thin while the gate pressure rises.',
      bestSource: {
        id: 'dao-component-thread-survival-reserve-best',
        label: 'Herb pouch',
        detail: 'Herbs can become short-term reserve when the owning room is inspected.',
        activityMode: 'passive',
      },
      fallbackSources: [{
        id: 'dao-component-thread-survival-reserve-fallback',
        label: 'Pinewind market',
        detail: 'Market stock may support reserve when source detail is opened.',
        activityMode: 'background',
      }],
      routeVisibility: 'drawer',
      ownerScreen: 'apothecary',
      evidenceIds: ['component-thread:survival-reserve'],
    },
    {
      id: 'dao-component-thread-forge-floor',
      label: 'Forge floor thread',
      missingThing: 'ore floor',
      sinkLabel: 'Weapon proof',
      evidenceLine: 'The weapon floor looks strained against the next proof seal.',
      bestSource: {
        id: 'dao-component-thread-forge-floor-best',
        label: 'Ore cache',
        detail: 'Ore provenance belongs behind the source drawer or local owner.',
        activityMode: 'passive',
      },
      fallbackSources: [{
        id: 'dao-component-thread-forge-floor-fallback',
        label: 'Ruins salvage',
        detail: 'Salvage provenance can be inspected without becoming a default command.',
        activityMode: 'active',
      }],
      routeVisibility: 'drawer',
      ownerScreen: 'forge',
      evidenceIds: ['component-thread:forge-floor'],
    },
  ],
  reflectionPlaque: reflection.reflections[0] ?? {
    id: 'dao-component-reflection-survival',
    kind: 'survival_pattern',
    label: 'Pattern reflected',
    detail: 'The last attempt broke at survival reserve.',
    tone: 'cinnabar',
    iconId: 'mirror-shard',
    evidenceIds: ['component-reflection:survival'],
  },
};
