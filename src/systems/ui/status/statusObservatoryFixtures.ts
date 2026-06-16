import type { PathId } from '../../../content/types.js';
import { buildSpiritRootObservationSurface } from '../../../features/spiritRootObservation/index.js';
import type { SpiritRootObservationSurfaceV1 } from '../../../features/spiritRootObservation/index.js';
import { STATUS_OBSERVATORY_STAT_NODE_GEOMETRY } from './statusObservatoryPresentation.js';
import { buildStatusObservatorySurface } from './statusObservatorySurface.js';
import type {
  StatusCauseRowSurface,
  StatusCurrentStateBlockState,
  StatusCurrentStateBlockSurface,
  StatusCurrentStateSurfaceV1,
  StatusDoctrineTileSurface,
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerRequirementRow,
  StatusLedgerSurfaceV1,
  StatusLedgerTone,
  StatusNamedStatSourceEntry,
  StatusSpiritRootElement,
  StatusSpiritRootSurface,
} from './statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1, StatusObservatoryVisualState } from './statusObservatoryTypes.js';

export interface StatusObservatoryFixtureSeed {
  id: string;
  visualState: StatusObservatoryVisualState;
  currentPath: PathId;
  lifeDecree: {
    title: 'Life Decree' | 'Life Decree - This Life Record';
    realmStage: string;
    cityLabel: string;
    heartLawLabel: string;
    spiritRootLabel: string;
    nextMajorGoal: string;
    mainBottleneck: string;
    primaryRoute: string;
  };
  selectedOrganId: 'cultivation' | 'daoHeart' | 'spiritRoot' | 'training' | 'buildPrep' | 'activeWork';
  selectedStatId: string | null;
  canopy: {
    centralEdict: string;
    talismanTitles: readonly string[];
    routeCharms: readonly string[];
  };
  safety: {
    stateLabel: string;
    progressLabel: string;
  };
}

export const STATUS_OBSERVATORY_FIXTURE_SEEDS = [
  {
    id: 'blocked-realm-edge',
    visualState: 'blocked',
    currentPath: 'martial',
    lifeDecree: {
      title: 'Life Decree',
      realmStage: 'Qi Condensation Stage 1 / 9',
      cityLabel: 'Pinewind Hamlet',
      heartLawLabel: 'Ember Thread Sutra',
      spiritRootLabel: 'Void Root - Opposed',
      nextMajorGoal: 'Reach Foundation Establishment',
      mainBottleneck: 'Realm edge not reached',
      primaryRoute: 'Refine Weapon',
    },
    selectedOrganId: 'buildPrep',
    selectedStatId: 'weapon_intent',
    canopy: {
      centralEdict: 'Realm edge not reached',
      talismanTitles: ['Current State blocked', 'Root / Law opposed', 'Loadout / pouch warning', 'Heart Law clarity low'],
      routeCharms: ['Refine Weapon', 'Restock Healing', 'Upgrade Technique', 'Practice Dao Heart'],
    },
    safety: {
      stateLabel: 'Inactive / unavailable',
      progressLabel: '0 / threshold',
    },
  },
  {
    id: 'healthy-no-major-blocker',
    visualState: 'healthy',
    currentPath: 'martial',
    lifeDecree: {
      title: 'Life Decree',
      realmStage: 'Qi Condensation Stage 8 / 9',
      cityLabel: 'Pinewind Hamlet',
      heartLawLabel: 'Ember Thread Sutra',
      spiritRootLabel: 'Earth Root Compatible',
      nextMajorGoal: 'Reach Foundation Establishment',
      mainBottleneck: 'No major blocker',
      primaryRoute: 'Cultivate Qi',
    },
    selectedOrganId: 'cultivation',
    selectedStatId: null,
    canopy: {
      centralEdict: 'No major blocker',
      talismanTitles: ['Realm edge progress', 'Current state healthy', 'Loadout coverage ready'],
      routeCharms: ['Cultivate Qi', 'Maintain reserves', 'Review loadout'],
    },
    safety: {
      stateLabel: 'Not active / not needed',
      progressLabel: 'No safety route needed',
    },
  },
  {
    id: 'post-failure-preparation-floor',
    visualState: 'postFailure',
    currentPath: 'martial',
    lifeDecree: {
      title: 'Life Decree',
      realmStage: 'Qi Condensation Stage 9 / 9',
      cityLabel: 'Pinewind Hamlet',
      heartLawLabel: 'Ember Thread Sutra',
      spiritRootLabel: 'Void Root Opposed',
      nextMajorGoal: 'Breakthrough to Foundation Establishment',
      mainBottleneck: 'Preparation below floor',
      primaryRoute: 'Restock Healing',
    },
    selectedOrganId: 'buildPrep',
    selectedStatId: 'weapon_intent',
    canopy: {
      centralEdict: 'Gate Trial Failed - Preparation below floor',
      talismanTitles: ['Stock Healing', 'Forge Weapon +5', 'Upgrade Iron Palm'],
      routeCharms: ['Restock Healing', 'Forge Weapon', 'Upgrade Technique'],
    },
    safety: {
      stateLabel: 'Safety Net Progress',
      progressLabel: '2 / 5',
    },
  },
  {
    id: 'prestige-pressure-life-record',
    visualState: 'prestigePressure',
    currentPath: 'martial',
    lifeDecree: {
      title: 'Life Decree - This Life Record',
      realmStage: 'Void Tribulation Stage 6 / 9 Peak',
      cityLabel: 'Lotusford',
      heartLawLabel: 'Ember Thread Sutra Chapter 18',
      spiritRootLabel: 'Earth Root Compatible',
      nextMajorGoal: 'Consider Reincarnation',
      mainBottleneck: 'Current life efficiency falling',
      primaryRoute: 'Open Prestige',
    },
    selectedOrganId: 'activeWork',
    selectedStatId: null,
    canopy: {
      centralEdict: 'Reincarnation Recommended',
      talismanTitles: ['Next life reclaims ground faster', 'Merit and upgrades smooth early path', 'Permanent gains remain'],
      routeCharms: ['Open Prestige'],
    },
    safety: {
      stateLabel: 'Not applicable',
      progressLabel: 'Prestige route instead',
    },
  },
  {
    id: 'content-cap-endpoint',
    visualState: 'contentCap',
    currentPath: 'heaven',
    lifeDecree: {
      title: 'Life Decree',
      realmStage: 'Void Tribulation Stage 9 / 9',
      cityLabel: 'Ironpeak Bastion',
      heartLawLabel: 'Ember Thread Sutra Chapter 20',
      spiritRootLabel: 'Astral Root Compatible',
      nextMajorGoal: 'Await next chapter',
      mainBottleneck: 'Content cap reached',
      primaryRoute: 'Review Records',
    },
    selectedOrganId: 'activeWork',
    selectedStatId: null,
    canopy: {
      centralEdict: 'Content cap reached',
      talismanTitles: ['Current chapter complete', 'No fake task generated', 'Review current systems'],
      routeCharms: ['Review Records', 'Maintain reserves'],
    },
    safety: {
      stateLabel: 'Calm / not needed',
      progressLabel: 'Endpoint reached',
    },
  },
] as const satisfies readonly StatusObservatoryFixtureSeed[];

/* ============================================================
   Fixture-surface pipeline (Phase 0).

   Materializes a full, deterministic, store-free StatusObservatorySurfaceV1
   from a seed by authoring a StatusLedgerSurfaceV1 and running it through the
   pure `buildStatusObservatorySurface` builder — one fixture pipeline, no
   parallel surface assembly. The resulting `meta.mode` is forced to
   'fixture'. Consumed by the resolver contract test and the dev-only mount.
   ============================================================ */

type FixtureOrganId = keyof StatusCurrentStateSurfaceV1['blocks'];

/** Deterministic generated-at so screenshots/diffs never drift. */
const FIXTURE_GENERATED_AT = 1_700_000_000_000;

const FIXTURE_ORGAN_META: Record<FixtureOrganId, { title: string; icon: StatusLedgerFactRow['icon'] }> = {
  cultivation: { title: 'Cultivation Body', icon: 'inkSwirl' },
  daoHeart: { title: 'Mind / Dao Heart', icon: 'bookHeaven' },
  spiritRoot: { title: 'Spirit Root', icon: 'spiritGrass' },
  training: { title: 'Training Foundation', icon: 'jadeSword' },
  buildPrep: { title: 'Build / Prep', icon: 'prayerBeads' },
  activeWork: { title: 'Active Work', icon: 'hourglassProgress' },
};

const FIXTURE_ORGAN_STATES: Record<StatusObservatoryVisualState, Record<FixtureOrganId, StatusCurrentStateBlockState>> = {
  blocked: { cultivation: 'attention', daoHeart: 'attention', spiritRoot: 'attention', training: 'attention', buildPrep: 'danger', activeWork: 'attention' },
  healthy: { cultivation: 'healthy', daoHeart: 'healthy', spiritRoot: 'healthy', training: 'healthy', buildPrep: 'healthy', activeWork: 'healthy' },
  postFailure: { cultivation: 'healthy', daoHeart: 'attention', spiritRoot: 'attention', training: 'attention', buildPrep: 'danger', activeWork: 'healthy' },
  prestigePressure: { cultivation: 'healthy', daoHeart: 'healthy', spiritRoot: 'healthy', training: 'healthy', buildPrep: 'healthy', activeWork: 'attention' },
  contentCap: { cultivation: 'healthy', daoHeart: 'healthy', spiritRoot: 'healthy', training: 'healthy', buildPrep: 'healthy', activeWork: 'healthy' },
  unknown: { cultivation: 'unknown', daoHeart: 'unknown', spiritRoot: 'unknown', training: 'unknown', buildPrep: 'unknown', activeWork: 'unknown' },
};

const FIXTURE_ROOT_ELEMENT: Record<StatusObservatoryVisualState, StatusSpiritRootElement> = {
  blocked: 'void',
  healthy: 'earth',
  postFailure: 'void',
  prestigePressure: 'earth',
  contentCap: 'astral',
  unknown: 'wood',
};

function fixtureTitleCase(id: string): string {
  return id
    .split('_')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function fixtureAction(
  id: string,
  label: string,
  detail: string,
  tone: StatusLedgerTone = 'gold',
  primary = false,
  destinationLabel = '',
): StatusLedgerActionSurface {
  return {
    id,
    label,
    // Default the destination to "" so routeLabel()/focus-lens don't echo the
    // label as "X -> X" / "X / X" (both treat an empty destination as "none");
    // pass a distinct destinationLabel only when the route genuinely targets a
    // different screen (e.g. "Open Apothecary / Forge").
    destinationLabel,
    detail,
    target: { kind: 'none', reason: 'fixture-route-inert' },
    disabled: false,
    disabledReason: null,
    tone,
    primary,
    source: 'fallback',
  };
}

function fixtureFact(
  id: string,
  label: string,
  value: string | null,
  detail: string,
  tone: StatusLedgerTone,
  icon: StatusLedgerFactRow['icon'],
  action: StatusLedgerActionSurface | null = null,
): StatusLedgerFactRow {
  return { id, label, value, detail, tone, icon, sourceLabel: 'Fixture', action };
}

function fixtureTile(
  id: string,
  label: string,
  value: string,
  detail: string,
  icon: StatusLedgerFactRow['icon'],
  tone: StatusLedgerTone,
  accent?: StatusDoctrineTileSurface['accent'],
): StatusDoctrineTileSurface {
  return { id, label, value, detail, icon, tone, accent };
}

function fixtureCause(
  id: string,
  severity: StatusCauseRowSurface['severity'],
  label: string,
  value: string,
  consequence: string,
  detail: string,
  sourceSystem: string,
): StatusCauseRowSurface {
  return { id, severity, label, value, consequence, primaryFix: null, detail, sourceSystem };
}

function fixtureNamedStat(
  geometry: { id: string; branch: 'universal' | 'heaven' | 'earth' | 'martial' },
  currentPath: PathId,
  weakStatId: string | null,
): StatusNamedStatSourceEntry {
  const branch = geometry.branch;
  const isUniversal = branch === 'universal';
  const isCurrent = !isUniversal && branch === currentPath;
  const weakLink = geometry.id === weakStatId;
  const name = fixtureTitleCase(geometry.id);
  const tone: StatusLedgerTone = weakLink ? 'danger' : isUniversal || isCurrent ? 'jade' : 'muted';
  return {
    id: geometry.id,
    displayName: name,
    shortLabel: name,
    label: name,
    detail: `${name} stat node.`,
    path: branch,
    branchId: branch,
    category: isUniversal ? 'foundation' : 'path',
    tier: 'core',
    sourceSystems: ['cultivatorStats'],
    effectSummary: `${name} contributes to cultivation.`,
    currentRating: 30,
    cap: 100,
    capPct: 30,
    unlockRealmIndex: null,
    unlockRealmLabel: null,
    lockedReason: null,
    unlockState: isUniversal || isCurrent ? 'unlocked' : 'off_path_unlocked',
    nodeState: isUniversal ? 'foundation' : isCurrent ? 'lit' : 'lifeless',
    contributionState: isUniversal ? 'foundation' : isCurrent ? 'current_path' : 'off_path',
    visible: true,
    weakLink,
    weakReason: weakLink ? 'This stat is limiting current growth.' : null,
    tone,
    routeAction: null,
    detailRows: [],
  };
}

/**
 * Deep string transform over the observation surface. Used to neutralise
 * classifier-trigger keywords ('prestige') that the default observation text
 * hardcodes, so non-prestige fixtures classify correctly.
 */
function scrubObservationText<T>(value: T, replace: (input: string) => string): T {
  if (typeof value === 'string') return replace(value) as unknown as T;
  if (Array.isArray(value)) return value.map((entry) => scrubObservationText(entry, replace)) as unknown as T;
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      result[key] = scrubObservationText(entry, replace);
    }
    return result as T;
  }
  return value;
}

function buildFixtureLedger(seed: StatusObservatoryFixtureSeed): StatusLedgerSurfaceV1 {
  const visualState = seed.visualState;
  const opposed = /opposed/i.test(seed.lifeDecree.spiritRootLabel);
  const lowReserves = visualState === 'blocked' || visualState === 'postFailure';
  const organStates = FIXTURE_ORGAN_STATES[visualState];
  const rootElement = FIXTURE_ROOT_ELEMENT[visualState];

  const [realmName, ...stageRest] = seed.lifeDecree.realmStage.split(' Stage ');
  const stageText = stageRest.length > 0 ? `Stage ${stageRest.join(' Stage ')}` : seed.lifeDecree.realmStage;

  const pathTile = fixtureTile('path', 'Path', fixtureTitleCase(seed.currentPath), 'Combat and growth way.', 'jadeSword', 'jade', 'path');
  const heartLawTile = fixtureTile('heart-law', 'Heart Law', seed.lifeDecree.heartLawLabel, 'Chapter 1 / 18', 'bookHeaven', 'gold', 'heartLaw');
  const focusTile = fixtureTile('focus', 'Focus', 'Balanced', 'Life-defining stance.', 'inkSwirl', 'jade', 'focus');
  const breathTile = fixtureTile('breath', 'Breath', 'Balanced', 'Breath stance.', 'inkSwirl', 'jade', 'breath');
  const cityTile = fixtureTile('city', 'City', seed.lifeDecree.cityLabel, 'Current hub.', 'bookHeaven', 'jade', 'city');

  const spiritRoot: StatusSpiritRootSurface = {
    element: rootElement,
    // Element STEM only ("Void"/"Earth"); the astrolabe appends " Root" itself,
    // so storing "Void Root" here doubled it to "Void Root Root".
    elementLabel: fixtureTitleCase(rootElement),
    gradeLabel: 'Common',
    purityLabel: '66%',
    totalMultiplierLabel: opposed ? '-2.32x' : '+1.4x',
    resonanceLabel: 'Resonance 40%',
    icon: 'spiritGrass',
    tone: opposed ? 'danger' : 'jade',
    observationAction: fixtureAction('observe-spirit-root', 'Observe Spirit Root', 'Open the Spirit Root observation drawer.', 'gold'),
  };

  // Per-organ route labels (artifact slip / focus-lens routes) — replaces the old
  // generic "Open Route" placeholder so the slips, focus lens, and the Dao Heart
  // foot button all read realistically.
  const BLOCK_ROUTE: Record<FixtureOrganId, { id: string; label: string; detail: string }> = {
    cultivation: { id: 'route-cultivation', label: 'Open Cultivation', detail: 'Open the Cultivation screen.' },
    daoHeart: { id: 'route-dao-heart', label: 'Open Dao Heart Sanctuary', detail: 'Open the Dao Heart Sanctuary.' },
    spiritRoot: { id: 'route-observe-root', label: 'Observe Spirit Root', detail: 'Open the Spirit Root observation drawer.' },
    training: { id: 'route-training', label: 'Open Training Hall', detail: 'Open the Training Hall.' },
    buildPrep: { id: 'route-apothecary', label: 'Open Apothecary', detail: 'Open the Apothecary and Forge.' },
    activeWork: { id: 'route-active-work', label: 'Open Cultivation', detail: 'Open the current foreground work.' },
  };
  const blockRoute = (id: FixtureOrganId): StatusLedgerActionSurface =>
    fixtureAction(BLOCK_ROUTE[id].id, BLOCK_ROUTE[id].label, BLOCK_ROUTE[id].detail, 'gold');
  const consequenceFor = (state: StatusCurrentStateBlockState): string =>
    state === 'danger'
      ? 'Significant weakness; resolve before the gate.'
      : state === 'attention'
        ? 'Improvement required to keep pace.'
        : state === 'locked'
          ? 'Not yet unlocked.'
          : state === 'unknown'
            ? 'State source unavailable.'
            : 'Functioning normally.';
  const valueLabelFor: Record<FixtureOrganId, string> = {
    cultivation: stageText,
    daoHeart: 'Clarity steady',
    spiritRoot: seed.lifeDecree.spiritRootLabel,
    training: 'Path 11 / 16 avg.',
    buildPrep: organStates.buildPrep === 'healthy' ? 'Above minimum' : '0 below minimum',
    activeWork: visualState === 'prestigePressure' ? 'Low yield' : visualState === 'healthy' ? 'Cultivating Qi' : 'Idle',
  };
  const daoHeartDetail: StatusCauseRowSurface[] = [
    fixtureCause('clarity', 'info', 'Clarity', 'Stable', 'Clarity holds steady.', 'Dao Heart clarity row.', 'Dao Heart'),
    fixtureCause(
      'turbulence',
      organStates.daoHeart === 'healthy' ? 'healthy' : 'warning',
      'Turbulence',
      organStates.daoHeart === 'healthy' ? 'None' : 'Minor',
      'Turbulence pressure on the heart.',
      'Dao Heart turbulence row.',
      'Dao Heart',
    ),
  ];
  const makeBlock = (id: FixtureOrganId, detailRows: StatusCauseRowSurface[] = []): StatusCurrentStateBlockSurface => ({
    id,
    title: FIXTURE_ORGAN_META[id].title,
    valueLabel: valueLabelFor[id],
    state: organStates[id],
    consequence: consequenceFor(organStates[id]),
    route: blockRoute(id),
    detailRows,
    icon: FIXTURE_ORGAN_META[id].icon,
  });

  const sharedCauseRows: StatusCauseRowSurface[] = [
    fixtureCause('heart_law_parity', visualState === 'healthy' ? 'healthy' : 'warning', 'Heart Law parity', visualState === 'healthy' ? 'Strong' : 'Weak', 'Affects breakthrough stability.', 'Heart law parity row.', 'Heart Law'),
    fixtureCause('root_law_fit', opposed ? 'danger' : 'healthy', 'Root / Law fit', opposed ? 'Opposed' : 'Compatible', 'Affects expression and stability.', 'Root law fit row.', 'Spirit Root'),
    fixtureCause('gate_readiness', visualState === 'healthy' ? 'healthy' : 'warning', 'Gate readiness', visualState === 'healthy' ? 'Secure' : 'Not secure', 'Affects gate trial readiness.', 'Gate readiness row.', 'Readiness'),
  ];

  const currentState: StatusCurrentStateSurfaceV1 = {
    version: 'status-current-state-v1',
    rootTestId: 'status-current-state',
    summary: { label: 'Current State', detail: 'Fixture state snapshot.' },
    blocks: {
      cultivation: makeBlock('cultivation'),
      daoHeart: makeBlock('daoHeart', daoHeartDetail),
      spiritRoot: { ...makeBlock('spiritRoot'), observationRoute: 'status-root-observation' },
      training: makeBlock('training'),
      buildPrep: makeBlock('buildPrep'),
      activeWork: makeBlock('activeWork'),
    },
    nextBottleneck: {
      primary: fixtureAction('next-bottleneck-primary', seed.lifeDecree.primaryRoute, 'Recommended action for this bottleneck.', 'gold', true),
      secondary: [],
      detailRows: [],
    },
    sharedCauseRows,
    buffDebuffRows: [],
  };

  const reserveTone = (low: boolean): StatusLedgerTone => (low ? 'warning' : 'jade');
  const reserveRows: StatusLedgerFactRow[] = [
    fixtureFact('merit', 'Merit Reserve', lowReserves ? 'Low' : '12,540', 'Merit currency reserve.', reserveTone(lowReserves), 'artifactBundle'),
    fixtureFact('spirit-stones', 'Spirit Stones', '4,812', 'Spirit stone reserve.', 'jade', 'foundationPill'),
    fixtureFact('medicine', 'Medicine Pouch', lowReserves ? 'Low' : '78%', 'Medicine pouch fill.', reserveTone(lowReserves), 'herbBundle'),
    fixtureFact('pouch-fit', 'Pouch Fit', lowReserves ? 'Poor' : 'Good', 'Pouch fit quality.', reserveTone(lowReserves), 'prayerBeads'),
    fixtureFact('healing', 'Healing Reserve', lowReserves ? 'Low' : '72%', 'Healing reserve fill.', reserveTone(lowReserves), 'inkHeart'),
  ];

  // Per-state recent-changes ledger (artifact ledgers.changes, packet §11.10) —
  // each row a tone dot (danger=cinnabar / else gold) + text; count badge = length.
  const RECENT_ROW_DEFS: Record<StatusObservatoryVisualState, Array<{ id: string; label: string; bad?: boolean }>> = {
    blocked: [
      { id: 'rc-stability', label: 'Stability dropped to 0 / 100', bad: true },
      { id: 'rc-rootfit', label: 'Spirit root fit turned Opposed', bad: true },
      { id: 'rc-reserves', label: 'Reserves fell below safety floor', bad: true },
      { id: 'rc-proc', label: 'Hollow Step proc went idle' },
      { id: 'rc-weapon', label: 'Weapon floor not yet met' },
    ],
    healthy: [
      { id: 'rc-offline', label: 'Offline cultivation · +Qi 6.58M' },
      { id: 'rc-insight', label: 'Insight gained · Ember Thread Sutra' },
      { id: 'rc-technique', label: 'Technique learned · Iron Palm (Rk 2)' },
      { id: 'rc-forge', label: 'Forge complete · Gauntlets +3' },
      { id: 'rc-expedition', label: 'Expedition returned · 2 relics' },
    ],
    postFailure: [
      { id: 'rc-gatefail', label: 'Gate trial failed', bad: true },
      { id: 'rc-stability', label: 'Stability dropped to 0 / 100', bad: true },
      { id: 'rc-healing', label: 'Healing reserves exhausted', bad: true },
      { id: 'rc-safety', label: 'Safety Net progress +1 → 2 / 5' },
      { id: 'rc-weapon', label: 'Weapon floor still not met', bad: true },
    ],
    prestigePressure: [
      { id: 'rc-eff', label: 'Cultivation efficiency falling', bad: true },
      { id: 'rc-heartlaw', label: 'Heart Law mastered · 18 / 18' },
      { id: 'rc-tribulation', label: 'Tribulation peak reached' },
      { id: 'rc-pressure', label: 'Renewal pressure rising' },
      { id: 'rc-gains', label: 'Permanent gains accrued' },
    ],
    contentCap: [
      { id: 'rc-offline', label: 'Offline cultivation · +Qi 6.58M' },
      { id: 'rc-insight', label: 'Insight gained · Ember Thread Sutra' },
      { id: 'rc-technique', label: 'Technique learned · Iron Palm (Rk 2)' },
      { id: 'rc-forge', label: 'Forge complete · Gauntlets +3' },
      { id: 'rc-expedition', label: 'Expedition returned · 2 relics' },
    ],
    unknown: [{ id: 'rc-empty', label: 'No recent change recorded' }],
  };
  const recentRows: StatusLedgerFactRow[] = (RECENT_ROW_DEFS[visualState] ?? RECENT_ROW_DEFS.blocked).map((def) =>
    fixtureFact(def.id, def.label, def.bad ? 'Down' : 'Logged', def.label, def.bad ? 'danger' : 'gold', 'inkSwirl'),
  );

  // How-Calculated: the same five formula sources every state (artifact ledgers.calc).
  const calcRows: StatusLedgerFactRow[] = [
    fixtureFact('calc-qis', 'Qi / s', 'View formula', 'Qi-per-second formula sources.', 'jade', 'inkSwirl'),
    fixtureFact('calc-stability', 'Stability', 'View formula', 'Stability formula sources.', 'jade', 'inkSwirl'),
    fixtureFact('calc-combat', 'Combat Strength', 'View formula', 'Combat-strength formula sources.', 'jade', 'inkSwirl'),
    fixtureFact('calc-breakthrough', 'Breakthrough Chance', 'View formula', 'Breakthrough-chance formula sources.', 'jade', 'inkSwirl'),
    fixtureFact('calc-all', 'All sources', 'View formula', 'All contributing systems.', 'jade', 'inkSwirl'),
  ];

  const missionRows: StatusLedgerRequirementRow[] = lowReserves
    ? [
        {
          ...fixtureFact('req-healing', 'Healing reserve', 'Below floor', 'Restock healing before the gate.', 'danger', 'inkHeart', fixtureAction('route-restock-healing', 'Restock Healing', 'Open the Apothecary to restock healing.', 'gold')),
          kind: 'healing',
          gapLabel: 'Below floor',
          priorityLabel: 'Priority 1',
          sourceModuleLabel: 'Apothecary',
        },
        {
          ...fixtureFact('req-forge', 'Weapon floor', 'Not met', 'Refine the weapon to meet the floor.', 'warning', 'jadeSword', fixtureAction('route-forge-weapon', 'Forge Weapon', 'Open the Forge to meet the weapon floor.', 'gold')),
          kind: 'forge',
          gapLabel: 'Not met',
          priorityLabel: 'Priority 2',
          sourceModuleLabel: 'Forge',
        },
      ]
    : [];

  const routeCharmActions = seed.canopy.routeCharms.map((label, index) =>
    fixtureAction(`route-charm-${index}`, label, `Route to ${label}.`, 'gold', index === 0),
  );

  const rawObservation = buildSpiritRootObservationSurface({ root: null, heartLaw: null });
  const baseObservation: SpiritRootObservationSurfaceV1 =
    visualState === 'prestigePressure'
      ? rawObservation
      : scrubObservationText(rawObservation, (input) => input.replace(/prestige/gi, 'long-term').replace(/reincarnat\w*/gi, 'renewal'));
  // Drive the astrolabe/bridge/heart-seal fit fork from the state (the null-input
  // observation is always neutral, so opposed states rendered as compatible). The
  // live surface derives this from the real root/law pairing; fixtures mirror it.
  const observation: SpiritRootObservationSurfaceV1 = opposed
    ? {
        ...baseObservation,
        fit: {
          ...baseObservation.fit,
          tier: 'opposed',
          label: 'Opposed',
          effectiveExpression: 43,
          effects: { ...baseObservation.fit.effects, expressionCap: 100 },
        },
        progression: {
          ...baseObservation.progression,
          proc: { ...baseObservation.progression.proc, procName: 'Hollow Step', cooldownSec: 12 },
        },
      }
    : {
        ...baseObservation,
        fit: {
          ...baseObservation.fit,
          tier: 'compatible',
          label: 'Compatible',
          effectiveExpression: 86,
          effects: { ...baseObservation.fit.effects, expressionCap: 100 },
        },
        progression: {
          ...baseObservation.progression,
          proc: { ...baseObservation.progression.proc, procName: 'Compatible', cooldownSec: 18 },
        },
      };

  const mainBottleneckDetail =
    visualState === 'postFailure'
      ? `Gate Trial Failed. ${seed.lifeDecree.mainBottleneck} blocks the gate.`
      : `${seed.lifeDecree.mainBottleneck}. Primary cause for this life.`;

  return {
    meta: {
      rootTestId: 'status-ledger',
      mode: 'live',
      generatedAt: FIXTURE_GENERATED_AT,
      contentLoaded: true,
      schemaVersion: 'status-ledger-v1',
      debugNotes: ['fixture-ledger'],
    },
    hero: {
      realmName,
      stageText,
      pathLabel: fixtureTitleCase(seed.currentPath),
      heartLawLabel: seed.lifeDecree.heartLawLabel,
      spiritRootLabel: seed.lifeDecree.spiritRootLabel,
      cityLabel: seed.lifeDecree.cityLabel,
      focusLabel: 'Balanced',
      breathLabel: 'Balanced',
      nextMajorGoalLabel: seed.lifeDecree.nextMajorGoal,
      nextMajorGoalDetail: 'Next milestone for this life.',
      mainBottleneckLabel: seed.lifeDecree.mainBottleneck,
      mainBottleneckDetail,
      primaryAction: fixtureAction('hero-primary', seed.lifeDecree.primaryRoute, 'Primary recommended action.', 'gold', true),
      pathTile,
      heartLawTile,
      spiritRoot,
      focusTile,
      breathTile,
      cityTile,
    },
    currentState,
    spiritRootObservation: observation,
    metrics: [
      fixtureFact('qi', 'Qi', '4.31M', 'Current Qi.', 'jade', 'inkSwirl'),
      fixtureFact('qi-rate', 'Qi / s', '63.75 / s', 'Qi rate.', 'jade', 'inkSwirl'),
      fixtureFact('stability', 'Stability', lowReserves ? '0 / 100' : '82 / 100', 'Stability level.', lowReserves ? 'danger' : 'jade', 'inkShield'),
      fixtureFact('hp', 'HP', '278.88', 'Health.', 'jade', 'inkHeart'),
      fixtureFact('combat', 'Combat Strength', '345.36', 'Overall combat strength.', 'jade', 'jadeSword'),
      fixtureFact('attack', 'Attack', '34.86', 'Attack.', 'jade', 'jadeSword'),
      fixtureFact('defense', 'Defense', '11.62', 'Defense.', 'jade', 'inkShield'),
      fixtureFact('crit', 'Crit Rate', '20%', 'Critical rate.', 'jade', 'inkBolt'),
    ],
    milestone: {
      id: 'milestone',
      title: 'Milestone',
      detail: `Progress toward ${seed.lifeDecree.nextMajorGoal}.`,
      readinessLabel: 'Readiness 40%',
      tone: visualState === 'healthy' ? 'success' : 'gold',
      nodes: [],
      rows: [],
    },
    cultivationBase: {
      id: 'cultivation_base',
      title: 'Cultivation Base',
      rows: [
        fixtureFact('qi-progress', 'Qi Progress', '8 / 9', 'Qi progress toward the next stage.', 'jade', 'inkSwirl'),
        fixtureFact('insight', 'Insight Chance', '+38.6%', 'Breakthrough insight chance.', 'gold', 'inkSparkles'),
      ],
    },
    missionRequirements: {
      id: 'mission_requirements',
      title: 'Mission Requirements',
      rows: missionRows,
      emptyState: missionRows.length === 0 ? fixtureFact('mission-empty', 'Mission Requirements', 'All met', 'No outstanding gate requirements.', 'success', 'taskComplete') : null,
    },
    bestImprovements: {
      id: 'best_improvements',
      title: 'Best Improvements',
      primary: routeCharmActions[0] ?? null,
      rows: routeCharmActions,
      emptyState: routeCharmActions.length === 0 ? fixtureFact('best-empty', 'Best Improvements', 'Maintain', 'Keep cultivating.', 'success', 'taskComplete') : null,
    },
    safetyNet: {
      id: 'safety_net',
      title: 'Safety Net',
      rows: [
        fixtureFact('safety-state', 'Safety Net', seed.safety.stateLabel, 'Mercy seal availability.', visualState === 'postFailure' ? 'warning' : 'muted', 'inkShield'),
        fixtureFact('safety-progress', 'Progress', seed.safety.progressLabel, 'Mercy seal progress.', 'muted', 'inkShield'),
      ],
      action: null,
    },
    identityDoctrine: {
      id: 'identity_doctrine',
      title: 'Identity & Doctrine',
      rows: [],
      spiritRootElement: rootElement,
      spiritRootTone: opposed ? 'danger' : 'jade',
      spiritRoot,
      pathTile,
      heartLawTile,
      resonanceTile: fixtureTile('resonance', 'Resonance', '40%', 'Root resonance level.', 'inkSwirl', 'jade'),
      focusTile,
      breathTile,
      cityTile,
    },
    currentWork: {
      id: 'current_work',
      title: 'Current Work',
      activityTiles: [
        fixtureFact('foreground', 'Foreground', valueLabelFor.activeWork, 'Current foreground activity.', 'jade', 'hourglassProgress'),
      ],
      rows: [fixtureFact('expeditions', 'Expeditions', 'Idle', 'No expedition running.', 'muted', 'hourglassEmpty')],
    },
    buildPreparation: {
      id: 'build_preparation',
      title: 'Build & Preparation',
      build: {
        title: 'Build',
        headline: lowReserves ? 'Build floors unmet' : 'Build aligned',
        tone: lowReserves ? 'warning' : 'jade',
        icon: 'jadeSword',
        tiles: [],
        detailRows: [],
      },
      preparation: {
        title: 'Preparation',
        headline: lowReserves ? 'Reserves low' : 'Reserves stable',
        tone: lowReserves ? 'warning' : 'jade',
        icon: 'inkHeart',
        tiles: [],
        detailRows: [],
      },
      buildRows: [],
      reserveRows,
      topWarning: lowReserves ? fixtureFact('top-warning', 'Build readiness', 'Below floor', 'Weak reserves and weapon floor block gate readiness.', 'warning', 'inkWarning') : null,
    },
    recentChanges: {
      id: 'recent_changes',
      title: 'Recent Changes',
      rows: recentRows,
      emptyState: fixtureFact('recent-empty', 'Recent Changes', 'None', 'No recent change recorded.', 'muted', 'recordSlip'),
    },
    details: {
      id: 'details',
      title: 'How calculated',
      summary: 'Fixture-derived calculation breakdown.',
      rows: calcRows,
      closedByDefault: true,
    },
    namedStats: {
      title: 'Stat Meridian Constellation',
      currentPath: seed.currentPath,
      realmCap: 100,
      allStats: [],
      universal: [],
      heaven: [],
      earth: [],
      martial: [],
      weakLinks: [],
      bridgeSockets: [
        { id: 'hybrid_socket_left', label: 'Dormant hybrid socket', detail: 'Future hybrid path development socket. It is not active content.', state: 'dormant', sourceStatIds: [] },
        { id: 'hybrid_socket_mid', label: 'Dormant hybrid socket', detail: 'Future hybrid path development socket. It is not active content.', state: 'dormant', sourceStatIds: [] },
        { id: 'hybrid_socket_right', label: 'Dormant hybrid socket', detail: 'Future hybrid path development socket. It is not active content.', state: 'dormant', sourceStatIds: [] },
      ],
      debugNotes: [],
    },
  };
}

/** True when `value` names one of the fixture seeds (by id or visual state). */
export function isStatusObservatoryFixtureId(value: string): boolean {
  return STATUS_OBSERVATORY_FIXTURE_SEEDS.some((seed) => seed.id === value || seed.visualState === value);
}

/**
 * Materialise a full, deterministic StatusObservatorySurfaceV1 from a fixture
 * seed (matched by seed id or by visual-state name). Returns null for an
 * unknown id so callers can fall through to the live surface. `meta.mode` is
 * always 'fixture'.
 */
export function buildStatusObservatoryFixtureSurface(stateId: string): StatusObservatorySurfaceV1 | null {
  const seed = STATUS_OBSERVATORY_FIXTURE_SEEDS.find((entry) => entry.id === stateId || entry.visualState === stateId);
  if (!seed) return null;

  const ledger = buildFixtureLedger(seed);
  const allStats = Object.values(STATUS_OBSERVATORY_STAT_NODE_GEOMETRY).map((geometry) =>
    fixtureNamedStat(geometry, seed.currentPath, seed.selectedStatId),
  );
  ledger.namedStats.allStats = allStats;
  ledger.namedStats.universal = allStats.filter((stat) => stat.branchId === 'universal');
  ledger.namedStats.heaven = allStats.filter((stat) => stat.branchId === 'heaven');
  ledger.namedStats.earth = allStats.filter((stat) => stat.branchId === 'earth');
  ledger.namedStats.martial = allStats.filter((stat) => stat.branchId === 'martial');
  ledger.namedStats.weakLinks = allStats.filter((stat) => stat.weakLink);

  const surface = buildStatusObservatorySurface(ledger);
  return { ...surface, meta: { ...surface.meta, mode: 'fixture' } };
}
