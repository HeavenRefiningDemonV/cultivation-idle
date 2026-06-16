import type {
  StatusBottleneckCharmGeometrySurface,
  StatusBottleneckSlipGeometrySurface,
  StatusMeridianOrganSurface,
  StatusObservatorySurfaceV1,
  StatusRootAstrolabeRootId,
  StatusRootLawBridgeSurface,
  StatusObservatoryVisualState,
  StatusStatBranchSurface,
  StatusStatConstellationLegendEntry,
} from './statusObservatoryTypes.js';
import type {
  StatusLedgerTone,
  StatusCurrentStateSurfaceV1,
  StatusNamedStatContributionState,
  StatusNamedStatNodeState,
} from './statusLedgerTypes.js';

export const STATUS_OBSERVATORY_INSTRUMENT_ROLES = [
  'lifeDecree',
  'vitalsRibbon',
  'rootLawInstrument',
  'meridianVessel',
  'statConstellation',
  'bottleneckCanopy',
  'buildPreparation',
  'workWheel',
  'ledgerRail',
  'drawers',
] as const;

export const STATUS_OBSERVATORY_FRAME_ATLAS = [
  {
    frame: 'A',
    fileName: '4f1e378f-0b34-45af-87d5-17d86f371e30.png',
    role: 'Path-Adaptive Stat Meridian Constellation',
    surfaceImplication: 'All 28 named stats stay visible as nodes with branch paths, weak-link flags, bridge sockets, and causal threads.',
  },
  {
    frame: 'B',
    fileName: '5a249286-e0bd-4573-9c5e-c7d753d9ad8a.png',
    role: 'Blocked Observatory with expanded diagnosis pressure',
    surfaceImplication: 'Blocked state keeps decree, vitals, root/law, vessel, canopy, lower support instruments, and inspector pressure.',
  },
  {
    frame: 'C',
    fileName: '7c6e9be4-357a-47ce-8f6f-db921afbcc90.png',
    role: 'Healthy Life Decree / No Major Blocker',
    surfaceImplication: 'Healthy state changes tones and route labels while preserving every primary instrument family.',
  },
  {
    frame: 'D',
    fileName: '89e5195a-9518-4da2-bbf3-da09b99fe265.png',
    role: 'Selected Stat Bead Lens / Weapon Intent Weak Link',
    surfaceImplication: 'A selected stat lens needs value, cap, effect, source, why-now text, route actions, and weak-link causality.',
  },
  {
    frame: 'E',
    fileName: '91a6f87d-4d37-44fc-b833-67534e78f55f.png',
    role: 'Gate Trial Failed / Post-Failure Diagnosis',
    surfaceImplication: 'Post-failure state needs failure edict, top fixes, safety progress, recent failure memory, and failure tone.',
  },
  {
    frame: 'F',
    fileName: '357bf750-4256-4062-a1ec-b9774dcb0466.png',
    role: 'Spirit Root Astrolabe Expanded Diagnostic',
    surfaceImplication: 'Root/law instrument needs astrolabe, Heart Law seal, bridge state, impact rows, route rows, and observation drawers.',
  },
  {
    frame: 'G',
    fileName: '477eb0e7-8ce1-4291-8ec6-357beb6f0418.png',
    role: 'Prestige Pressure / This Life Record',
    surfaceImplication: 'Prestige pressure is distinct from failure and needs a life-record decree, route to Prestige, and next-life promises.',
  },
  {
    frame: 'H',
    fileName: '52875ddb-50b8-4522-b100-0dc29808ac29.png',
    role: 'Bottleneck Talisman Canopy Inspector',
    surfaceImplication: 'Canopy needs central edict, talisman slips, selected inspector, route charms, safety seal, and causal threads.',
  },
  {
    frame: 'I',
    fileName: 'b17ccaec-f033-4892-ba6f-1fc5aa35f6b3.png',
    role: 'Dense Compact Default / Production Blueprint',
    surfaceImplication: 'Default topology keeps top decree/vitals, left root/law, center vessel, right canopy, bottom constellation/support.',
  },
  {
    frame: 'J',
    fileName: 'b70f98c7-d487-47aa-a24f-2e5579ebecb1.png',
    role: 'Meridian Vessel Compass Expanded Diagnostic',
    surfaceImplication: 'Vessel needs six organs, one focus lens, shared cause stamps, legend labels, and expanded detail rows.',
  },
] as const;

// Slip CENTER as a percentage of the canopy board. Two clean columns of three
// slips drape from the rail down each side of the central edict (the artifact
// hangs slips on cords either side of the bottleneck card). All six sit in the
// 0-52% band above the charm rail; rows centred at 13/29/45% with the 14% slip
// height keep a hairline gap between rows and never crowd the edict or charms.
export const STATUS_OBSERVATORY_CANOPY_SLIP_GEOMETRY = [
  { x: 12.5, y: 13, rotationDeg: -3, anchor: 'left' },
  { x: 87.5, y: 13, rotationDeg: 3, anchor: 'right' },
  { x: 12, y: 29, rotationDeg: -2, anchor: 'left' },
  { x: 88, y: 29, rotationDeg: 2, anchor: 'right' },
  { x: 13, y: 45, rotationDeg: 2, anchor: 'left' },
  { x: 87, y: 45, rotationDeg: -2, anchor: 'right' },
] as const satisfies readonly StatusBottleneckSlipGeometrySurface[];

export const STATUS_OBSERVATORY_CANOPY_CHARM_GEOMETRY = [
  { x: 10, y: 38 },
  { x: 30, y: 38 },
  { x: 50, y: 38 },
  { x: 70, y: 38 },
  { x: 90, y: 38 },
] as const satisfies readonly StatusBottleneckCharmGeometrySurface[];

export const STATUS_OBSERVATORY_CANOPY_VISUAL_STATE_LABELS = {
  blocked: 'Current Bottleneck',
  healthy: 'No major blocker',
  postFailure: 'Gate Trial failed',
  prestigePressure: 'Reincarnation recommended',
  contentCap: 'Content cap reached',
  unknown: 'Current Bottleneck',
} as const satisfies Record<StatusObservatoryVisualState, string>;

export interface StatusRootNotchPresentation {
  id: StatusRootAstrolabeRootId;
  label: string;
  shortLabel: string;
  angleDeg: number;
  tone: StatusLedgerTone;
}

export const STATUS_OBSERVATORY_ROOT_NOTCH_ORDER = [
  { id: 'wood', label: 'Wood Root', shortLabel: 'Wood', angleDeg: 0, tone: 'jade' },
  { id: 'fire', label: 'Fire Root', shortLabel: 'Fire', angleDeg: 25.714, tone: 'danger' },
  { id: 'earth', label: 'Earth Root', shortLabel: 'Earth', angleDeg: 51.429, tone: 'gold' },
  { id: 'metal', label: 'Metal Root', shortLabel: 'Metal', angleDeg: 77.143, tone: 'muted' },
  { id: 'water', label: 'Water Root', shortLabel: 'Water', angleDeg: 102.857, tone: 'jade' },
  { id: 'wind', label: 'Wind Root', shortLabel: 'Wind', angleDeg: 128.571, tone: 'info' },
  { id: 'lightning', label: 'Lightning Root', shortLabel: 'Storm', angleDeg: 154.286, tone: 'warning' },
  { id: 'ice', label: 'Ice Root', shortLabel: 'Ice', angleDeg: 180, tone: 'info' },
  { id: 'light', label: 'Light Root', shortLabel: 'Light', angleDeg: 205.714, tone: 'gold' },
  { id: 'shadow', label: 'Shadow Root', shortLabel: 'Shade', angleDeg: 231.429, tone: 'muted' },
  { id: 'soul', label: 'Soul Root', shortLabel: 'Soul', angleDeg: 257.143, tone: 'danger' },
  { id: 'void', label: 'Void Root', shortLabel: 'Void', angleDeg: 282.857, tone: 'jade' },
  { id: 'time', label: 'Time Root', shortLabel: 'Time', angleDeg: 308.571, tone: 'gold' },
  { id: 'astral', label: 'Astral Root', shortLabel: 'Astral', angleDeg: 334.286, tone: 'info' },
] as const satisfies readonly StatusRootNotchPresentation[];

export const STATUS_OBSERVATORY_HEART_LAW_CHAPTER_BEAD_COUNT = 9;

export const STATUS_OBSERVATORY_ROOT_BRIDGE_STATE_LABELS = {
  aligned: {
    label: 'Aligned bridge',
    detail: 'Clean jade-gold bridge; root and law reinforce one another.',
  },
  compatible: {
    label: 'Compatible bridge',
    detail: 'Continuous bridge with ordinary tension; fit is usable.',
  },
  strained: {
    label: 'Strained bridge',
    detail: 'Hairline stress marks show fit pressure without a full break.',
  },
  opposed: {
    label: 'Broken bridge',
    detail: 'Fractured cinnabar bridge; root and law work against each other.',
  },
  unknown: {
    label: 'Unknown bridge',
    detail: 'Muted bridge because root/law fit truth is unavailable.',
  },
} as const satisfies Record<StatusRootLawBridgeSurface['state'], { label: string; detail: string }>;

export const STATUS_OBSERVATORY_EXPECTED_BRANCHES = [
  {
    id: 'universal',
    title: 'Universal Spine',
    role: 'Shared Foundation For All Paths',
    expectedCount: 8,
  },
  {
    id: 'heaven',
    title: 'Heaven Branch',
    role: 'High Sky - Laws - Celestial Way',
    expectedCount: 7,
  },
  {
    id: 'earth',
    title: 'Earth Branch',
    role: 'Root - Body - Material Way',
    expectedCount: 6,
  },
  {
    id: 'martial',
    title: 'Martial Branch',
    role: 'Blade - Rhythm - Combat Way',
    expectedCount: 7,
  },
] as const satisfies readonly Omit<StatusStatBranchSurface, 'actualCount'>[];

export type StatusStatGeometryBranch = StatusStatBranchSurface['id'];

export interface StatusStatNodeGeometry {
  id: string;
  x: number;
  y: number;
  branch: StatusStatGeometryBranch;
  labelAnchor?: 'start' | 'middle' | 'end';
  labelDx?: number;
  labelDy?: number;
}

export const STATUS_OBSERVATORY_STAT_NODE_GEOMETRY = {
  dantian_depth: { id: 'dantian_depth', x: 50, y: 8, branch: 'universal', labelAnchor: 'middle', labelDy: -4 },
  meridian_throughput: { id: 'meridian_throughput', x: 50, y: 18, branch: 'universal', labelAnchor: 'middle', labelDy: -4 },
  qi_purity: { id: 'qi_purity', x: 50, y: 28, branch: 'universal', labelAnchor: 'middle', labelDy: -4 },
  body_integrity: { id: 'body_integrity', x: 50, y: 38, branch: 'universal', labelAnchor: 'middle', labelDy: -4 },
  mind_clarity: { id: 'mind_clarity', x: 50, y: 48, branch: 'universal', labelAnchor: 'middle', labelDy: -4 },
  dao_stability: { id: 'dao_stability', x: 50, y: 58, branch: 'universal', labelAnchor: 'middle', labelDy: -4 },
  spirit_sense: { id: 'spirit_sense', x: 50, y: 68, branch: 'universal', labelAnchor: 'middle', labelDy: -4 },
  medicine_familiarity: { id: 'medicine_familiarity', x: 50, y: 80, branch: 'universal', labelAnchor: 'middle', labelDy: 7 },
  dao_resonance: { id: 'dao_resonance', x: 28, y: 13, branch: 'heaven', labelAnchor: 'middle', labelDy: -5 },
  qi_control: { id: 'qi_control', x: 19, y: 21, branch: 'heaven', labelAnchor: 'end', labelDx: -3 },
  divine_sense: { id: 'divine_sense', x: 15, y: 34, branch: 'heaven', labelAnchor: 'end', labelDx: -3 },
  law_weaving: { id: 'law_weaving', x: 21, y: 46, branch: 'heaven', labelAnchor: 'end', labelDx: -3 },
  tribulation_insight: { id: 'tribulation_insight', x: 32, y: 54, branch: 'heaven', labelAnchor: 'middle', labelDy: 7 },
  star_rhythm: { id: 'star_rhythm', x: 42, y: 48, branch: 'heaven', labelAnchor: 'start', labelDx: 3 },
  artifact_attunement: { id: 'artifact_attunement', x: 41, y: 32, branch: 'heaven', labelAnchor: 'start', labelDx: 3 },
  body_tempering: { id: 'body_tempering', x: 13, y: 70, branch: 'earth', labelAnchor: 'end', labelDx: -3 },
  meridian_fortitude: { id: 'meridian_fortitude', x: 24, y: 63, branch: 'earth', labelAnchor: 'middle', labelDy: -5 },
  blood_essence: { id: 'blood_essence', x: 36, y: 67, branch: 'earth', labelAnchor: 'start', labelDx: 3 },
  rooted_guard: { id: 'rooted_guard', x: 22, y: 82, branch: 'earth', labelAnchor: 'end', labelDx: -3 },
  armor_harmony: { id: 'armor_harmony', x: 35, y: 87, branch: 'earth', labelAnchor: 'middle', labelDy: 7 },
  recovery_depth: { id: 'recovery_depth', x: 44, y: 78, branch: 'earth', labelAnchor: 'start', labelDx: 3 },
  weapon_intent: { id: 'weapon_intent', x: 67, y: 24, branch: 'martial', labelAnchor: 'start', labelDx: 3 },
  battle_rhythm: { id: 'battle_rhythm', x: 78, y: 30, branch: 'martial', labelAnchor: 'start', labelDx: 3 },
  flow_step: { id: 'flow_step', x: 86, y: 41, branch: 'martial', labelAnchor: 'start', labelDx: 3 },
  precision: { id: 'precision', x: 88, y: 53, branch: 'martial', labelAnchor: 'start', labelDx: 3 },
  counter_sense: { id: 'counter_sense', x: 79, y: 62, branch: 'martial', labelAnchor: 'start', labelDx: 3 },
  killing_momentum: { id: 'killing_momentum', x: 68, y: 67, branch: 'martial', labelAnchor: 'middle', labelDy: 7 },
  weapon_bond: { id: 'weapon_bond', x: 61, y: 76, branch: 'martial', labelAnchor: 'middle', labelDy: 7 },
} as const satisfies Record<string, StatusStatNodeGeometry>;

/* ============================================================
   Artifact COMPACT constellation geometry (700 x 210 space).

   The in-panel "Stat Meridian Constellation" compact view is a 1:1 port of the
   living-state-observatory artifact: a faint Heaven heptagon (top-left), a jade
   Spine column (center), a gold Martial constellation with one cinnabar weak
   node (right), and a flat Earth web (bottom-left). These coordinates live in
   the artifact's own 700x210 viewBox and are SEPARATE from
   STATUS_OBSERVATORY_STAT_NODE_GEOMETRY (which stays in the 0-100 box that the
   expanded overlay and the geometry-bounds contract require).

   Each of the 28 stats maps to a fixed artifact node id (1-28). Ids are assigned
   per branch in the canonical stat declaration order:
     Spine (Universal)  -> 1..8
     Martial            -> 9..15
     Earth              -> 16,17,18,19,20,28
     Heaven             -> 21,22,23,24,25,26,27
   STATE (lit/spine/weak/grey/socket) is still driven from the surface per node;
   only the POSITIONS are these fixed layout constants.
   ============================================================ */

export const STATUS_OBSERVATORY_STAT_COMPACT_VIEWBOX = { width: 700, height: 210 } as const;

/** stat id -> artifact node id (1-28). */
export const STATUS_OBSERVATORY_STAT_COMPACT_NODE_ID = {
  // Universal spine 1..8 (top -> bottom)
  dantian_depth: 1,
  meridian_throughput: 2,
  qi_purity: 3,
  body_integrity: 4,
  mind_clarity: 5,
  dao_stability: 6,
  spirit_sense: 7,
  medicine_familiarity: 8,
  // Martial 9..15
  weapon_intent: 9,
  battle_rhythm: 10,
  flow_step: 11,
  precision: 12,
  counter_sense: 13,
  killing_momentum: 14,
  weapon_bond: 15,
  // Earth 16,17,18,19,20,28
  body_tempering: 16,
  meridian_fortitude: 17,
  blood_essence: 18,
  rooted_guard: 19,
  armor_harmony: 20,
  recovery_depth: 28,
  // Heaven 21..27
  dao_resonance: 21,
  qi_control: 22,
  divine_sense: 23,
  law_weaving: 24,
  tribulation_insight: 25,
  star_rhythm: 26,
  artifact_attunement: 27,
} as const satisfies Record<string, number>;

/** artifact node id -> [x, y] in the 700x210 compact space. */
export const STATUS_OBSERVATORY_STAT_COMPACT_POSITIONS: Record<number, readonly [number, number]> = {
  // Spine (Universal): x=352, y = 22 + i*24
  1: [352, 22],
  2: [352, 46],
  3: [352, 70],
  4: [352, 94],
  5: [352, 118],
  6: [352, 142],
  7: [352, 166],
  8: [352, 190],
  // Martial explicit
  9: [470, 60],
  10: [540, 80],
  11: [600, 108],
  12: [640, 150],
  13: [592, 176],
  14: [520, 184],
  15: [470, 150],
  // Earth: place([16,17,18,19,20,28], cx=150, cy=168, rx=96, ry=30, start=0.2)
  16: [244.09, 173.96],
  17: [180.53, 196.44],
  18: [86.44, 190.48],
  19: [55.91, 162.04],
  20: [119.47, 139.56],
  28: [213.56, 145.52],
  // Heaven: place([21,22,23,24,25,26,27], cx=120, cy=66, rx=86, ry=46, start=-1.2)
  21: [151.16, 23.13],
  22: [202.1, 52.3],
  23: [191.21, 91.79],
  24: [126.7, 111.86],
  25: [57.15, 97.4],
  26: [34.92, 59.29],
  27: [76.76, 26.24],
} as const;

/**
 * Branch edges as artifact-id pairs (C_EDGES). Branch keys:
 *   U = Universal spine, H = Heaven, E = Earth, M = Martial.
 * Each pair draws a straight line between the two nodes' compact positions.
 */
export const STATUS_OBSERVATORY_STAT_COMPACT_EDGES = {
  U: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  H: [[21, 22], [22, 23], [23, 24], [24, 25], [25, 26], [26, 27], [27, 21]],
  E: [[16, 17], [17, 19], [19, 20], [20, 18], [18, 28], [16, 19]],
  M: [[9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [9, 15]],
} as const satisfies Record<'U' | 'H' | 'E' | 'M', ReadonlyArray<readonly [number, number]>>;

/** Maps a geometry/surface branch id to its compact-edge branch key. */
export const STATUS_OBSERVATORY_STAT_COMPACT_BRANCH_KEY = {
  universal: 'U',
  heaven: 'H',
  earth: 'E',
  martial: 'M',
} as const satisfies Record<StatusStatGeometryBranch, 'U' | 'H' | 'E' | 'M'>;

export const STATUS_OBSERVATORY_STAT_BRANCH_PATHS = {
  universal: 'M50 5 C50 18 50 32 50 46 C50 60 50 72 50 84',
  heaven: 'M50 28 C43 20 37 12 28 13 C18 15 12 25 15 35 C18 48 30 55 42 48 C48 44 49 36 41 32',
  earth: 'M50 62 C42 61 34 62 24 64 C15 67 11 73 13 80 C17 90 31 91 44 78 C39 75 35 70 36 67',
  martial: 'M58 38 C64 23 76 23 82 34 C91 48 88 60 78 64 C66 70 58 77 61 76 C67 73 70 68 68 67 C63 62 68 55 79 62 C89 58 91 47 86 41 C82 35 77 31 67 24',
} as const satisfies Record<StatusStatGeometryBranch, string>;

export interface StatusStatBridgeGeometry {
  id: string;
  x: number;
  y: number;
  label: string;
  detail: string;
  sourceSocketId?: string;
}

export const STATUS_OBSERVATORY_STAT_BRIDGE_GEOMETRY = {
  heaven_spine_bridge: {
    id: 'heaven_spine_bridge',
    x: 43,
    y: 30,
    label: 'Heaven / spine bridge',
    detail: 'Dormant dual-path possibility between the Heaven branch and the Universal Spine.',
  },
  earth_spine_bridge: {
    id: 'earth_spine_bridge',
    x: 42,
    y: 64,
    label: 'Earth / spine bridge',
    detail: 'Dormant dual-path possibility between the Earth branch and the Universal Spine.',
  },
  martial_spine_bridge: {
    id: 'martial_spine_bridge',
    x: 58,
    y: 37,
    label: 'Martial / spine bridge',
    detail: 'Dormant dual-path possibility between the Martial branch and the Universal Spine.',
  },
  hybrid_socket_left: {
    id: 'hybrid_socket_left',
    x: 43,
    y: 91,
    label: 'Dormant hybrid socket',
    detail: 'Future hybrid path development socket. It is not active content.',
    sourceSocketId: 'handling-bridge-sockets',
  },
  hybrid_socket_mid: {
    id: 'hybrid_socket_mid',
    x: 50,
    y: 91,
    label: 'Dormant hybrid socket',
    detail: 'Future hybrid path development socket. It is not active content.',
    sourceSocketId: 'handling-bridge-sockets',
  },
  hybrid_socket_right: {
    id: 'hybrid_socket_right',
    x: 57,
    y: 91,
    label: 'Dormant hybrid socket',
    detail: 'Future hybrid path development socket. It is not active content.',
    sourceSocketId: 'handling-bridge-sockets',
  },
} as const satisfies Record<string, StatusStatBridgeGeometry>;

export const STATUS_OBSERVATORY_STAT_PATH_LABELS = {
  universal: {
    label: 'Universal Spine',
    shortLabel: 'Universal',
    detail: 'Shared Foundation For All Paths',
  },
  heaven: {
    label: 'Heaven Branch',
    shortLabel: 'Heaven',
    detail: 'High Sky - Laws - Celestial Way',
  },
  earth: {
    label: 'Earth Branch',
    shortLabel: 'Earth',
    detail: 'Root - Body - Material Way',
  },
  martial: {
    label: 'Martial Branch',
    shortLabel: 'Martial',
    detail: 'Blade - Rhythm - Combat Way',
  },
} as const satisfies Record<StatusStatGeometryBranch, { label: string; shortLabel: string; detail: string }>;

export const STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS = {
  foundation: {
    label: 'Universal Foundation',
    detail: 'Always contributes through the central meridian spine.',
  },
  lit: {
    label: 'Current Path',
    detail: 'Current path, unlocked, and contributing now.',
  },
  lifeless: {
    label: 'Grey / Lifeless',
    detail: 'Other path and unlocked, but dormant for this life.',
  },
  unlit_socket: {
    label: 'Future Socket',
    detail: 'Current-path socket that opens later; not a failure.',
  },
  future: {
    label: 'Future Socket',
    detail: 'Future off-path socket, still visible for planning.',
  },
  inactive: {
    label: 'Inactive Socket',
    detail: 'Path is not selected; the stat remains visible but inactive.',
  },
} as const satisfies Record<StatusNamedStatNodeState, { label: string; detail: string }>;

export const STATUS_OBSERVATORY_STAT_CONTRIBUTION_LABELS = {
  foundation: 'Shared foundation',
  current_path: 'Contributes now',
  off_path: 'Other path dormant',
  future_current_path: 'Future current-path socket',
  future_off_path: 'Future other-path socket',
  unselected_path: 'Path not selected',
} as const satisfies Record<StatusNamedStatContributionState, string>;

export const STATUS_OBSERVATORY_STAT_LENS_STATE_LABELS = {
  foundation: 'Universal Foundation',
  lit: 'Current Path',
  lifeless: 'Other Path Dormant',
  unlit_socket: 'Future Socket',
  future: 'Future Socket',
  inactive: 'Inactive Socket',
} as const satisfies Record<StatusNamedStatNodeState, string>;

export const STATUS_OBSERVATORY_STAT_LEGEND = [
  {
    id: 'lit',
    label: 'Lit',
    detail: 'Current path, unlocked, and contributes now.',
    nodeState: 'lit',
  },
  {
    id: 'lifeless',
    label: 'Grey / lifeless',
    detail: 'Other path and unlocked, but not active for this life.',
    nodeState: 'lifeless',
  },
  {
    id: 'unlit-socket',
    label: 'Unlit socket',
    detail: 'Future realm or path stat, not a failure.',
    nodeState: 'unlit_socket',
  },
  {
    id: 'bridge-socket',
    label: 'Bridge socket',
    detail: 'Dormant dual-path possibility.',
    nodeState: 'bridge_socket',
  },
] as const satisfies readonly StatusStatConstellationLegendEntry[];

export const STATUS_OBSERVATORY_ORGAN_ORDER = [
  'cultivation',
  'daoHeart',
  'spiritRoot',
  'training',
  'buildPrep',
  'activeWork',
] as const satisfies readonly (keyof StatusCurrentStateSurfaceV1['blocks'])[];

export interface StatusMeridianOrganGeometry {
  x: number;
  y: number;
  lineTargetX: number;
  lineTargetY: number;
  /** Index into the artifact compass() mer[] spine meridian points (0-5). */
  src: 0 | 1 | 2 | 3 | 4 | 5;
  /** Artifact card top in the 838x560 panel (pos[].y: 60 / 206 / 352). */
  cardTop: number;
  anchor: 'left' | 'right' | 'top' | 'bottom' | 'center';
  side: 'left' | 'right';
  labelDx?: number;
  labelDy?: number;
}

// Ported to the artifact `compass` generator (838x560 panel below the banner):
// six 196px cards in two stacked columns (3 left @x=4 / 3 right @x=638) at the
// vertical thirds (tops 60/206/352), with qi threads converging on the central
// channel spine. x/y are card-CENTER percentages of the figure; lineTargetX is
// the spine (50) and lineTargetY is the artifact meridian point (mer[]) y%.
// Ported to the artifact `compass` generator (838x560 panel, cx=419). Cards sit at
// pos[] {x:4|638, y:60/206/352}, width 196 -> card-center x = (4+98)/838 = 12.2% (left)
// or (638+98)/838 = 87.8% (right); card-center y = (top+42)/560. Each qi thread runs
// from the spine meridian point mer[src] OUT to the card anchor (ax=200|638, ay=top+30).
// lineTargetX/Y echo the spine meridian point (mer[src] as % of 838x560) for any
// consumer that still reads the spine end.
export const STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY = {
  cultivation: { x: 12.2, y: 18.2, src: 1, cardTop: 60, lineTargetX: 50, lineTargetY: 18.6, anchor: 'left', side: 'left', labelDy: -2 },
  daoHeart: { x: 87.8, y: 18.2, src: 1, cardTop: 60, lineTargetX: 50, lineTargetY: 18.6, anchor: 'right', side: 'right', labelDy: -2 },
  spiritRoot: { x: 12.2, y: 44.3, src: 3, cardTop: 206, lineTargetX: 50, lineTargetY: 35.7, anchor: 'left', side: 'left' },
  training: { x: 87.8, y: 44.3, src: 3, cardTop: 206, lineTargetX: 50, lineTargetY: 35.7, anchor: 'right', side: 'right' },
  buildPrep: { x: 12.2, y: 70.4, src: 4, cardTop: 352, lineTargetX: 50, lineTargetY: 45.7, anchor: 'left', side: 'left', labelDy: 2 },
  activeWork: { x: 87.8, y: 70.4, src: 4, cardTop: 352, lineTargetX: 50, lineTargetY: 45.7, anchor: 'right', side: 'right', labelDy: 2 },
} as const satisfies Record<keyof StatusCurrentStateSurfaceV1['blocks'], StatusMeridianOrganGeometry>;

export const STATUS_OBSERVATORY_MERIDIAN_BODY_LINEWORK = [
  {
    id: 'seated-silhouette',
    d: 'M50 12 C45 15 43 22 44 30 C39 35 37 46 39 58 C41 68 43 76 36 84 M50 12 C55 15 57 22 56 30 C61 35 63 46 61 58 C59 68 57 76 64 84',
  },
  {
    id: 'central-channel',
    d: 'M50 21 C49 33 49 45 50 57 C51 68 51 78 50 89',
  },
  {
    id: 'shoulder-vessel',
    d: 'M35 34 C43 31 57 31 65 34',
  },
  {
    id: 'root-basin',
    d: 'M39 66 C45 72 55 72 61 66',
  },
  {
    id: 'aura-ring',
    d: 'M50 8 C68 16 76 32 74 50 C72 68 62 84 50 91 C38 84 28 68 26 50 C24 32 32 16 50 8',
  },
] as const;

export const STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS = {
  eyebrow: 'Focused Inspection',
  fallbackTitle: 'Selected organ',
  valueLabel: 'Value',
  consequenceLabel: 'Consequence',
  routeLabel: 'Route',
  sourcesLabel: 'Sources',
  drawerButtonLabel: 'Open vessel drawer',
  drawerCloseLabel: 'Close vessel drawer',
} as const;

export const STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS = {
  healthy: {
    label: 'Stable',
    detail: 'Functioning normally.',
    tone: 'success',
  },
  attention: {
    label: 'Needs Work',
    detail: 'Improvement required.',
    tone: 'warning',
  },
  danger: {
    label: 'At Risk',
    detail: 'Significant weakness.',
    tone: 'danger',
  },
  locked: {
    label: 'Locked',
    detail: 'Not yet unlocked.',
    tone: 'muted',
  },
  unknown: {
    label: 'Unknown',
    detail: 'Source state is unavailable.',
    tone: 'muted',
  },
} as const satisfies Record<
  StatusCurrentStateSurfaceV1['blocks'][keyof StatusCurrentStateSurfaceV1['blocks']]['state'],
  { label: string; detail: string; tone: StatusLedgerTone }
>;

export const STATUS_OBSERVATORY_MERIDIAN_SHARED_CAUSE_LABELS = {
  heart_law_parity: 'Heart Law parity',
  root_law_fit: 'Root / Law fit',
  gate_readiness: 'Gate readiness',
  expression_cap: 'Expression cap',
  foreground_gain: 'Foreground gain',
  breakthrough_risk: 'Breakthrough risk',
  training_fatigue: 'Training fatigue',
} as const;

export const STATUS_OBSERVATORY_MERIDIAN_INSPECTION_COPY = {
  overview: 'Observe the vessel and its six organs. Use the focus lens to inspect the root cause behind current bottlenecks.',
  inspectionMode: 'Reserved Lens',
  inspectionDetail: 'One organ in focus',
  howItWorks: 'Each organ reflects one core aspect of cultivation. Focus reveals the primary cause and the best route to resolve it.',
} as const;

export const STATUS_OBSERVATORY_ORGAN_LEGEND = [
  { state: 'healthy', label: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.healthy.label, detail: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.healthy.detail },
  { state: 'attention', label: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.attention.label, detail: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.attention.detail },
  { state: 'danger', label: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.danger.label, detail: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.danger.detail },
  { state: 'locked', label: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.locked.label, detail: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.locked.detail },
  { state: 'unknown', label: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.unknown.label, detail: STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.unknown.detail },
] as const;

export const STATUS_OBSERVATORY_VISUAL_STATE_LABELS = {
  blocked: 'Blocked Observatory',
  healthy: 'Healthy Observatory',
  postFailure: 'Gate Trial Failed',
  prestigePressure: 'Prestige Pressure',
  contentCap: 'Content Cap',
  unknown: 'Unknown State',
} as const satisfies Record<StatusObservatoryVisualState, string>;

/* ============================================================
   Whole-screen presentation resolver (Phase 0).

   Pure function: derives the global tonal/dominance/canopy/decree decisions
   every later phase consumes, from surface fields only. No store reads, no
   Date.now, no randomness. Lives here because this module is the established
   presentation-constants home (frame atlas, geometries, label maps).
   ============================================================ */

export type ObservatoryTone = 'inkJade' | 'jadeCalm' | 'cinnabarHeavy' | 'goldRitual' | 'mutedCap';

export type ObservatoryRegionId =
  | 'decree'
  | 'vitals'
  | 'rootLaw'
  | 'vessel'
  | 'canopy'
  | 'constellation'
  | 'scales'
  | 'jars'
  | 'wheel'
  | 'ledgers';

export type ObservatoryCanopyMode =
  | 'bottleneck'
  | 'maintenance'
  | 'failureDiagnosis'
  | 'reincarnationEdict'
  | 'capNotice';

export type ObservatoryDefaultFocus =
  | { kind: 'organ'; organId: StatusMeridianOrganSurface['id'] | null }
  | { kind: 'slip'; slipId: string | null }
  | { kind: 'none' };

export interface ObservatoryPresentation {
  /** exact input echoed back for traceability. */
  visualState: StatusObservatoryVisualState;
  /** global tonal key — drives a data-attribute the SCSS themes off. */
  tone: ObservatoryTone;
  /** which region carries visual dominance. */
  dominantRegion: ObservatoryRegionId;
  /** canopy behavioral mode for this state. */
  canopyMode: ObservatoryCanopyMode;
  /** which object should be focused by default on arrival. */
  defaultFocus: ObservatoryDefaultFocus;
  /** decree stamp overlay: null, or the failure / prestige seal. */
  decreeStamp: 'gateTrialFailed' | 'turningOfLife' | null;
  /** ids of vitals seals that must carry a warning seal. */
  vitalsWarningIds: string[];
  /** master FX switches for this state (primitives still self-gate on quality). */
  fx: {
    bridgeBroken: boolean;
    bodyGlowIntensity: 'full' | 'soft' | 'dim';
    scorchOverlay: boolean;
    ritualGold: boolean;
  };
}

function organStateSeverity(state: StatusMeridianOrganSurface['state']): number {
  if (state === 'danger') return 2;
  if (state === 'attention') return 1;
  return 0;
}

/** The at-risk organ with the lowest ordinal among the worst present tier. */
function lowestOrdinalWorstOrgan(
  organs: readonly StatusMeridianOrganSurface[],
): StatusMeridianOrganSurface['id'] | null {
  const atRisk = organs.filter((organ) => organStateSeverity(organ.state) > 0);
  if (atRisk.length === 0) return null;
  const worst = Math.max(...atRisk.map((organ) => organStateSeverity(organ.state)));
  const lowest = atRisk
    .filter((organ) => organStateSeverity(organ.state) === worst)
    .reduce((best, organ) => (organ.ordinal < best.ordinal ? organ : best));
  return lowest.id;
}

function organIdByOrdinal(
  organs: readonly StatusMeridianOrganSurface[],
  ordinal: StatusMeridianOrganSurface['ordinal'],
): StatusMeridianOrganSurface['id'] | null {
  return organs.find((organ) => organ.ordinal === ordinal)?.id ?? null;
}

function firstPriorityOneSlipId(
  slips: StatusObservatorySurfaceV1['bottleneckCanopy']['talismanSlips'],
): string | null {
  const priorityOne = slips.find((slip) => /priority\s*1/i.test(slip.priorityLabel ?? ''));
  if (priorityOne) return priorityOne.id;
  return slips[0]?.id ?? null;
}

function warningSealIds(seals: StatusObservatorySurfaceV1['vitalsRibbon']['seals']): string[] {
  return seals.filter((seal) => seal.tone === 'warning' || seal.tone === 'danger').map((seal) => seal.id);
}

/**
 * Turn a completed observatory surface into the whole-screen presentation
 * decision. Deterministic and total: every visual state, including 'unknown',
 * yields a complete, non-throwing result.
 */
export function resolveObservatoryPresentation(
  surface: StatusObservatorySurfaceV1,
): ObservatoryPresentation {
  const visualState = surface.meta.visualState;
  const organs = surface.meridianVessel.organs;
  const slips = surface.bottleneckCanopy.talismanSlips;
  const bridgeBroken = surface.rootLawInstrument.bridge.broken;
  const vitalsWarningIds = warningSealIds(surface.vitalsRibbon.seals);

  const shared = { visualState, vitalsWarningIds };

  switch (visualState) {
    case 'healthy':
      return {
        ...shared,
        tone: 'jadeCalm',
        dominantRegion: 'vessel',
        canopyMode: 'maintenance',
        defaultFocus: { kind: 'organ', organId: organIdByOrdinal(organs, 1) },
        decreeStamp: null,
        fx: { bridgeBroken, bodyGlowIntensity: 'full', scorchOverlay: false, ritualGold: false },
      };
    case 'postFailure':
      return {
        ...shared,
        tone: 'cinnabarHeavy',
        dominantRegion: 'canopy',
        canopyMode: 'failureDiagnosis',
        defaultFocus: { kind: 'slip', slipId: firstPriorityOneSlipId(slips) },
        decreeStamp: 'gateTrialFailed',
        fx: { bridgeBroken, bodyGlowIntensity: 'dim', scorchOverlay: true, ritualGold: false },
      };
    case 'prestigePressure':
      return {
        ...shared,
        tone: 'goldRitual',
        dominantRegion: 'canopy',
        canopyMode: 'reincarnationEdict',
        defaultFocus: { kind: 'organ', organId: organIdByOrdinal(organs, 6) },
        decreeStamp: 'turningOfLife',
        fx: { bridgeBroken, bodyGlowIntensity: 'full', scorchOverlay: false, ritualGold: true },
      };
    case 'contentCap':
      return {
        ...shared,
        tone: 'mutedCap',
        dominantRegion: 'vessel',
        canopyMode: 'capNotice',
        defaultFocus: { kind: 'none' },
        decreeStamp: null,
        fx: { bridgeBroken, bodyGlowIntensity: 'soft', scorchOverlay: false, ritualGold: false },
      };
    case 'blocked':
      return {
        ...shared,
        tone: 'inkJade',
        dominantRegion: 'canopy',
        canopyMode: 'bottleneck',
        defaultFocus: { kind: 'organ', organId: lowestOrdinalWorstOrgan(organs) },
        decreeStamp: null,
        fx: { bridgeBroken, bodyGlowIntensity: 'soft', scorchOverlay: false, ritualGold: false },
      };
    case 'unknown':
    default:
      return {
        ...shared,
        tone: 'inkJade',
        dominantRegion: 'vessel',
        canopyMode: 'maintenance',
        defaultFocus: { kind: 'none' },
        decreeStamp: null,
        fx: { bridgeBroken, bodyGlowIntensity: 'soft', scorchOverlay: false, ritualGold: false },
      };
  }
}
