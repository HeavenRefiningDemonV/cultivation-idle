export type WorldCombatExactModuleKey =
  | 'outskirts'
  | 'gateTrial'
  | 'ruins';

export type WorldCombatExactOwnershipStatus =
  | 'exact-owner-complete'
  | 'legacy-preserved-for-future-cutover';

export type WorldCombatExactFutureShellMode =
  | 'screen-owned';

export type WorldCombatExactCurrentShellMode =
  | 'screen-owned'
  | 'combat-path-close-only';

export type WorldCombatExactInformationDensity =
  | 'light'
  | 'focused'
  | 'medium';

export type WorldCombatExactSceneMood =
  | 'open-field'
  | 'ritual-threshold'
  | 'sealed-ruin';

export type WorldCombatExactLayerId =
  | 'background'
  | 'hp'
  | 'actors'
  | 'effects'
  | 'chips'
  | 'log'
  | 'result';

export type WorldCombatExactRegionId =
  | 'pageRoot'
  | 'macroRibbon'
  | 'topTruthStrip'
  | 'areaPlaque'
  | 'leftRail'
  | 'centerStage'
  | 'rightRail'
  | 'identityBand'
  | 'progressStrip'
  | 'primaryCta'
  | 'summaryDock';

export interface WorldCombatExactRegionPattern {
  id: WorldCombatExactRegionId;
  sharedGrammar: string;
  moduleSpecificRule: string;
  mustNotDo: string[];
}

export interface WorldCombatExactVisualIdentity {
  sceneMood: WorldCombatExactSceneMood;
  informationDensity: WorldCombatExactInformationDensity;
  visualSummary: string;
  centerSceneRule: string;
  leftRailRule: string;
  rightRailRule: string;
  bottomActionRule: string;
  activeStateRule: string;
  resultRule: string;
  forbiddenVisualBorrowing: string[];
}

export interface WorldCombatExactPattern {
  moduleKey: WorldCombatExactModuleKey;
  displayName: string;
  currentOwnershipStatus: WorldCombatExactOwnershipStatus;
  currentOwnerFile: string;
  currentRootTestId: string | null;
  futureOwnerName: string;
  futureExactScreenName: string;
  futureRootTestId: string;
  currentShellMode: WorldCombatExactCurrentShellMode;
  futureShellMode: WorldCombatExactFutureShellMode;
  activeNoScreenSwapRequired: boolean;
  exactTheaterLayerIds: WorldCombatExactLayerId[];
  regions: WorldCombatExactRegionPattern[];
  visualIdentity: WorldCombatExactVisualIdentity;
  futurePacketSequence: string[];
  source: 'c10-pattern-registry';
}

const SHARED_REGION_PATTERNS: WorldCombatExactRegionPattern[] = [
  {
    id: 'pageRoot',
    sharedGrammar: 'Each mature combat-world module owns its own full exact page instead of rendering as a cramped generic combat panel.',
    moduleSpecificRule: 'The page root test id and page visual family are module-specific.',
    mustNotDo: [
      'Do not put active combat into a separate screen.',
      'Do not make all three modules share identical page chrome.',
      'Do not preserve a legacy active owner after module cutover.',
    ],
  },
  {
    id: 'macroRibbon',
    sharedGrammar: 'A quiet top macro ribbon may show wider journey position without becoming the main control surface.',
    moduleSpecificRule: 'The iconography, highlighted node, and route metaphor must match the module.',
    mustNotDo: [
      'Do not make the macro ribbon a combat log.',
      'Do not make it a dense navigation bar.',
    ],
  },
  {
    id: 'topTruthStrip',
    sharedGrammar: 'A compact top truth strip presents live readiness/state facts at a glance.',
    moduleSpecificRule: 'Facts differ per module: Outskirts emphasizes hunt safety/rewards; Gate Trial emphasizes readiness/fail-safe; Ruins emphasizes route/material/pity state.',
    mustNotDo: [
      'Do not use one universal seven-cell content model for all modules.',
      'Do not expose debug-style negative placeholder copy.',
    ],
  },
  {
    id: 'areaPlaque',
    sharedGrammar: 'A centered plaque or title band names the current module/route and communicates its purpose.',
    moduleSpecificRule: 'The copy, ornament, and subtitle must match the module fantasy.',
    mustNotDo: [
      'Do not use Outskirts copy in Gate Trial or Ruins.',
      'Do not use generic "Area: X" utility labels.',
    ],
  },
  {
    id: 'leftRail',
    sharedGrammar: 'The left rail carries setup, minimum requirements, or route context depending on module.',
    moduleSpecificRule: 'Outskirts uses setup; Gate Trial uses minimum checklist/readiness floor; Ruins uses route/run setup.',
    mustNotDo: [
      'Do not force the Outskirts setup card into Gate Trial.',
      'Do not force Gate Trial checklist into Outskirts.',
    ],
  },
  {
    id: 'centerStage',
    sharedGrammar: 'The center stage is the dominant scenic surface. During active combat, this exact center transforms in place into the active combat theater.',
    moduleSpecificRule: 'The center scene art and composition are module-specific.',
    mustNotDo: [
      'Do not navigate away on start.',
      'Do not render health bars outside the center scene after cutover.',
      'Do not shrink the scenic center into a generic combat shell.',
    ],
  },
  {
    id: 'rightRail',
    sharedGrammar: 'The right rail is a subordinate support/readout rail, never the main page owner.',
    moduleSpecificRule: 'Outskirts uses Expected Rewards; Gate Trial uses Recommended/Failsafe; Ruins uses Targeted Materials/Anchor/Pity.',
    mustNotDo: [
      'Do not put a full combat log in the right rail.',
      'Do not replace the center stage with right rail data.',
    ],
  },
  {
    id: 'identityBand',
    sharedGrammar: 'A quiet identity band below the center stage can summarize the active route/chain/threshold.',
    moduleSpecificRule: 'Outskirts uses chain badge; Gate Trial may use readiness/threshold seal; Ruins may use room-route marker.',
    mustNotDo: [
      'Do not show both planning identity and active identity at the same time.',
    ],
  },
  {
    id: 'progressStrip',
    sharedGrammar: 'A lower progression strip communicates sequence/state without becoming a dense control tray.',
    moduleSpecificRule: 'Outskirts uses encounter chain; Gate Trial uses attempt/readiness phase; Ruins uses room route.',
    mustNotDo: [
      'Do not let active strip selection change the current active fight.',
      'Do not create a manual action hotbar.',
    ],
  },
  {
    id: 'primaryCta',
    sharedGrammar: 'Each module has one dominant bottom CTA in planning and a stop/exit equivalent while active.',
    moduleSpecificRule: 'CTA label and tone are module-specific.',
    mustNotDo: [
      'Do not add duplicate primary controls.',
      'Do not hide the primary CTA below the fold.',
    ],
  },
  {
    id: 'summaryDock',
    sharedGrammar: 'A small subordinate summary dock may show live or grind statistics.',
    moduleSpecificRule: 'The dock contents must match the module role and stay smaller than the center scene.',
    mustNotDo: [
      'Do not turn summary dock into a combat log.',
      'Do not replace right rail with summary dock.',
    ],
  },
];

const SHARED_THEATER_LAYERS: WorldCombatExactLayerId[] = [
  'background',
  'hp',
  'actors',
  'effects',
  'chips',
  'log',
  'result',
];

export const WORLD_COMBAT_EXACT_PATTERN_REGISTRY: Record<
  WorldCombatExactModuleKey,
  WorldCombatExactPattern
> = {
  outskirts: {
    moduleKey: 'outskirts',
    displayName: 'Outskirts',
    currentOwnershipStatus: 'exact-owner-complete',
    currentOwnerFile: 'src/features/world/outskirts/OutskirtsScreenOwner.tsx',
    currentRootTestId: 'outskirts-exact-page',
    futureOwnerName: 'OutskirtsScreenOwner',
    futureExactScreenName: 'OutskirtsExactMockupScreen',
    futureRootTestId: 'outskirts-exact-page',
    currentShellMode: 'screen-owned',
    futureShellMode: 'screen-owned',
    activeNoScreenSwapRequired: true,
    exactTheaterLayerIds: [...SHARED_THEATER_LAYERS],
    regions: SHARED_REGION_PATTERNS,
    visualIdentity: {
      sceneMood: 'open-field',
      informationDensity: 'light',
      visualSummary: 'A broad calm field encounter page for safe baseline hunting, gold, common materials, and low-risk combat repetition.',
      centerSceneRule: 'The center is a wide open ink-wash field painting. Planning shows the scenic encounter; active mode turns the same painting into the combat theater.',
      leftRailRule: 'The left rail is Your Setup: loadout, AI, attack focus, offense/defense, medicine pouch, and equipment.',
      rightRailRule: 'The right rail is Expected Rewards: gold, common materials, tracked bounty, efficiency, auto-repeat, and inner-palace preview.',
      bottomActionRule: 'Planning uses Start Hunt. Active uses Stop Hunt. Both occupy the same bottom-center ornate gold CTA slot.',
      activeStateRule: 'Health bars, actors, floating hits, log slip, chips, and result transitions render inside the center painting.',
      resultRule: 'Victory/defeat/auto-repeat transitions appear as restrained result seals inside the painting, not as a result screen.',
      forbiddenVisualBorrowing: [
        'Do not use Gate Trial minimum/recommended checklist rails.',
        'Do not use Ruins room-route strip as the primary Outskirts progression strip.',
        'Do not make Outskirts feel like a dungeon or ritual gate.',
      ],
    },
    futurePacketSequence: [
      'Complete through C9.',
      'Use as proof pattern only.',
    ],
    source: 'c10-pattern-registry',
  },
  gateTrial: {
    moduleKey: 'gateTrial',
    displayName: 'Gate Trial',
    currentOwnershipStatus: 'legacy-preserved-for-future-cutover',
    currentOwnerFile: 'src/components/screens/world/buildings/GateTrialBuildingPanel.tsx',
    currentRootTestId: null,
    futureOwnerName: 'GateTrialScreenOwner',
    futureExactScreenName: 'GateTrialExactScreen',
    futureRootTestId: 'gate-trial-exact-page',
    currentShellMode: 'combat-path-close-only',
    futureShellMode: 'screen-owned',
    activeNoScreenSwapRequired: true,
    exactTheaterLayerIds: [...SHARED_THEATER_LAYERS],
    regions: SHARED_REGION_PATTERNS,
    visualIdentity: {
      sceneMood: 'ritual-threshold',
      informationDensity: 'focused',
      visualSummary: 'A ceremonial breakthrough-threshold page. Gate Trial is not a farm lane; it is a readiness validation ritual with minimum floor, recommended floor, fail-safe, and a single decisive attempt action.',
      centerSceneRule: 'The center should be a misty ritual gate or threshold shrine, with the gate as the main object. Planning shows viability/readiness and gate presence. Active mode transforms the same threshold scene into the combat theater.',
      leftRailRule: 'The left rail should carry Minimum Checklist or minimum floor: Qi, required catalyst/prep item if any, and hard eligibility facts.',
      rightRailRule: 'The right rail should carry Recommended preparation and Fail-Safe information, including support currency/purchase state where applicable.',
      bottomActionRule: 'Planning uses Attempt Gate or Challenge Gate. Active uses Stop Trial or Stop Attempt in the same dominant CTA slot. The CTA remains ceremonial parchment/gold/stone, not a red danger button.',
      activeStateRule: 'Health bars, actors, floating damage, log slip, readiness/attempt chips, and result seal must render inside the gate threshold scene after future cutover.',
      resultRule: 'Victory should feel like gate opened / breakthrough validated. Defeat should feel like the gate rejected the attempt and points to readiness fixes. No full result screen.',
      forbiddenVisualBorrowing: [
        'Do not copy Outskirts Expected Rewards rail.',
        'Do not use Outskirts encounter chain nodes.',
        'Do not use wolf/field hunting language.',
        'Do not make Gate Trial broad and relaxed; it should be focused and ceremonial.',
        'Do not make Gate Trial a loot-farming reward preview page.',
      ],
    },
    futurePacketSequence: [
      'G0 — Active-state contract and no-screen-swap guard for Gate Trial.',
      'G1 — Add Gate Trial active stage model.',
      'G2 — Build Gate Trial center-stage switcher.',
      'G3 — Health bars inside the Gate Trial threshold scene.',
      'G4 — Gate Trial actor layer and extracted combat motion.',
      'G5 — Gate Trial floating damage and log slip.',
      'G6 — Gate Trial readiness/attempt chips inside center scene.',
      'G7 — Gate Trial active frame: threshold badge, Stop Trial, live attempt summary.',
      'G8 — Gate Trial victory/defeat/fail-safe/auto-retry transitions.',
      'G9 — Remove legacy Gate Trial active ownership.',
    ],
    source: 'c10-pattern-registry',
  },
  ruins: {
    moduleKey: 'ruins',
    displayName: 'Ruins',
    currentOwnershipStatus: 'legacy-preserved-for-future-cutover',
    currentOwnerFile: 'src/components/screens/world/buildings/RuinsBuildingPanel.tsx',
    currentRootTestId: null,
    futureOwnerName: 'RuinsScreenOwner',
    futureExactScreenName: 'RuinsExactScreen',
    futureRootTestId: 'ruins-exact-page',
    currentShellMode: 'combat-path-close-only',
    futureShellMode: 'screen-owned',
    activeNoScreenSwapRequired: true,
    exactTheaterLayerIds: [...SHARED_THEATER_LAYERS],
    regions: SHARED_REGION_PATTERNS,
    visualIdentity: {
      sceneMood: 'sealed-ruin',
      informationDensity: 'medium',
      visualSummary: 'A chamber-route exploration page for targeted materials, deterministic relief, anchors, pity, boss room, treasure room, and medium-density routing information.',
      centerSceneRule: 'The center should be a broad sealed ruin/cavern chamber scene with a horizontal room route embedded across it. Planning shows route rooms, boss marker, treasure marker, and anchor context. Active mode transforms the current room area into the combat theater without leaving the page.',
      leftRailRule: 'The left rail may carry route setup, current run state, room modifiers, or chamber context. It should not become an Outskirts setup card unless future design explicitly calls for it.',
      rightRailRule: 'The right rail should carry Targeted Materials, Guaranteed Anchor, Auto-Repeat, Continue/Run action support, and Rare Pity. It should feel like a relic/material support rail, not an Expected Rewards card clone.',
      bottomActionRule: 'Planning uses Continue, Start Run, or Enter Ruins depending on run state. Active uses Stop Run in the same dominant bottom action slot. CTA is parchment/stone, not arcade-styled.',
      activeStateRule: 'Health bars, actors, floating damage, log slip, room/run chips, and result seal must render inside the ruin chamber scene after future cutover.',
      resultRule: 'Victory/defeat transitions should feel like a chamber clear or failed exploration seal. Auto-repeat should read as continuing deeper or returning to the next room, not as a hunt chain.',
      forbiddenVisualBorrowing: [
        'Do not copy Outskirts Expected Rewards rail.',
        'Do not copy Gate Trial minimum/recommended checklist language as the primary rail.',
        'Do not use wolf/field hunting language.',
        'Do not make Ruins a calm open field.',
        'Do not make Ruins a single boss threshold like Gate Trial.',
      ],
    },
    futurePacketSequence: [
      'R0 — Active-state contract and no-screen-swap guard for Ruins.',
      'R1 — Add Ruins run/chamber active stage model.',
      'R2 — Build Ruins center-stage switcher.',
      'R3 — Room route and health bars inside the Ruins center scene.',
      'R4 — Ruins actor layer and extracted combat motion.',
      'R5 — Ruins floating damage and log slip.',
      'R6 — Ruins room/material/pity chips inside center scene.',
      'R7 — Ruins active frame: room badge, Stop Run, live run summary.',
      'R8 — Ruins victory/defeat/auto-repeat/room-transition seals.',
      'R9 — Remove legacy Ruins active ownership.',
    ],
    source: 'c10-pattern-registry',
  },
};

export function getWorldCombatExactPattern(
  moduleKey: WorldCombatExactModuleKey,
): WorldCombatExactPattern {
  return WORLD_COMBAT_EXACT_PATTERN_REGISTRY[moduleKey];
}

export function listWorldCombatExactPatterns(): WorldCombatExactPattern[] {
  return Object.values(WORLD_COMBAT_EXACT_PATTERN_REGISTRY);
}
