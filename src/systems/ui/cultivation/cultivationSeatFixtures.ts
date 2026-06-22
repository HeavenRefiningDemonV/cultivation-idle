/**
 * M.II.3 — fixture states for the matrix (§14) and the contract tests. Pure data: a
 * `makeSeatRawFixture` factory + named cases covering path × foreground × peak/verdict, run
 * through the real builder so a test mounts a deterministic `CultivationSeatSurfaceV1` with no store.
 */
import type { CultivationSeatRawInput } from './cultivationSeatInput.js';
import { buildCultivationSeatSurface } from './cultivationSeatSurface.js';
import type { CultivationSeatSurfaceV1 } from './cultivationSeatTypes.js';

const FIXTURE_NOW = 1_725_000_000_000;

function baseRaw(): CultivationSeatRawInput {
  return {
    game: {
      realmIndex: 2, // Core Formation-ish (mid)
      substage: 3,
      substages: 9,
      qi: '12000000',
      qiPerSecond: '318.9',
      breakthroughRequirement: '61000000',
      selectedPath: 'heaven',
      focusMode: 'spirit',
    },
    cultivation: { stability: 60, stabilityCap: 100, chapter: 3, comprehension: 4, turbulence: 18, clarity: 42 },
    daoHeart: { turbulence: 18, fractured: false },
    breakthrough: { stability: null },
    treasures: { jing: 38, qi: 50, shen: 84, lead: 'shen' },
    prestige: { lifeMerit: 4820 },
    activity: { foregroundType: 'meditate', combatHeld: false },
    pity: { banked: 1, toGuarantee: 3 },
    gate: { itemRequired: false, itemSatisfied: true, resolution: 'none' },
    offline: { capHours: 12, efficiencyPct: 86 },
    ui: { reducedMotion: false, selectedScroll: null },
    content: { loaded: true },
  };
}

export function makeSeatRawFixture(overrides: Partial<CultivationSeatRawInput> = {}): CultivationSeatRawInput {
  const base = baseRaw();
  return {
    ...base,
    ...overrides,
    game: { ...base.game, ...(overrides.game ?? {}) },
    cultivation: { ...base.cultivation, ...(overrides.cultivation ?? {}) },
    daoHeart: { ...base.daoHeart, ...(overrides.daoHeart ?? {}) },
    breakthrough: { ...base.breakthrough, ...(overrides.breakthrough ?? {}) },
    treasures: { ...base.treasures, ...(overrides.treasures ?? {}) },
    prestige: { ...base.prestige, ...(overrides.prestige ?? {}) },
    activity: { ...base.activity, ...(overrides.activity ?? {}) },
    gate: { ...base.gate, ...(overrides.gate ?? {}) },
    offline: { ...base.offline, ...(overrides.offline ?? {}) },
    ui: { ...base.ui, ...(overrides.ui ?? {}) },
    content: { ...base.content, ...(overrides.content ?? {}) },
  };
}

export function makeSeatFixture(overrides: Partial<CultivationSeatRawInput> = {}, mode: CultivationSeatSurfaceV1['meta']['mode'] = 'fixture'): CultivationSeatSurfaceV1 {
  return buildCultivationSeatSurface({ raw: makeSeatRawFixture(overrides), mode, nowMs: FIXTURE_NOW });
}

/** The canonical named fixtures the matrix/tests reference. */
export const CULTIVATION_SEAT_FIXTURES: Record<string, () => CultivationSeatSurfaceV1> = {
  heavenSeclusion: () => makeSeatFixture({ game: { ...baseRaw().game, selectedPath: 'heaven' }, activity: { foregroundType: null, combatHeld: false } }),
  earthCultivating: () => makeSeatFixture({ game: { ...baseRaw().game, selectedPath: 'earth' }, activity: { foregroundType: 'meditate', combatHeld: false } }),
  martialCombatHeld: () => makeSeatFixture({ game: { ...baseRaw().game, selectedPath: 'martial' }, activity: { foregroundType: 'gauntlet', combatHeld: true } }),
  heavenPeakReady: () =>
    makeSeatFixture({
      game: { ...baseRaw().game, selectedPath: 'heaven', substage: 9, qi: '61000000', breakthroughRequirement: '61000000' },
      daoHeart: { turbulence: 12, fractured: false },
    }),
  earthPeakBlockedFractured: () =>
    makeSeatFixture({
      game: { ...baseRaw().game, selectedPath: 'earth', substage: 9, qi: '61000000', breakthroughRequirement: '61000000' },
      daoHeart: { turbulence: 92, fractured: true },
    }),
  noPathFallback: () => makeSeatFixture({ game: { ...baseRaw().game, selectedPath: null }, content: { loaded: false } }),
  reducedMotion: () => makeSeatFixture({ ui: { reducedMotion: true, selectedScroll: null } }),
};

// ── the §14.2 state matrix (pruned): path × realm × foreground × verdict × motion ──
const RG = (idx: number, sub: number, qi: string, req: string): Partial<CultivationSeatRawInput['game']> => ({ realmIndex: idx, substage: sub, qi, breakthroughRequirement: req });

export interface SeatMatrixCell {
  id: string;
  label: string;
  raw: Partial<CultivationSeatRawInput>;
}

function sceneCell(path: 'heaven' | 'earth' | 'martial', realmTag: 'R1' | 'R3' | 'R6', fg: 'seclusion' | 'cultivating' | 'held', reducedMotion = false): SeatMatrixCell {
  const game = realmTag === 'R1' ? RG(0, 3, '8000000', '24400000') : realmTag === 'R3' ? RG(2, 3, '12000000', '61000000') : RG(5, 4, '200000000', '500000000');
  const foregroundType = fg === 'cultivating' ? 'meditate' : fg === 'held' ? 'gauntlet' : null;
  return {
    id: `${path}-${realmTag.toLowerCase()}-${fg}${reducedMotion ? '-reduced' : ''}`,
    label: `${path} ${realmTag} ${fg}${reducedMotion ? ' (reduced)' : ''}`,
    raw: {
      game: { ...baseRaw().game, selectedPath: path, ...game },
      activity: { foregroundType, combatHeld: fg === 'held' },
      ui: { reducedMotion, selectedScroll: null },
    },
  };
}

function peakCell(path: 'heaven' | 'earth' | 'martial', verdict: 'ready' | 'notReady' | 'held', reducedMotion = false): SeatMatrixCell {
  const peakGame = verdict === 'notReady' ? RG(5, 9, '300000000', '500000000') : RG(5, 9, '500000000', '500000000');
  const turbulence = verdict === 'held' ? 92 : 12;
  return {
    id: `${path}-peak-${verdict}${reducedMotion ? '-reduced' : ''}`,
    label: `${path} Peak ${verdict}${reducedMotion ? ' (reduced)' : ''}`,
    raw: {
      game: { ...baseRaw().game, selectedPath: path, ...peakGame },
      daoHeart: { turbulence, fractured: verdict === 'held' },
      activity: { foregroundType: null, combatHeld: false },
      ui: { reducedMotion, selectedScroll: null },
    },
  };
}

const PATHS3: Array<'heaven' | 'earth' | 'martial'> = ['heaven', 'earth', 'martial'];

export const CULTIVATION_SEAT_MATRIX: SeatMatrixCell[] = [
  // per-path scene at R3 across the three foregrounds (full motion)
  ...PATHS3.flatMap((p) => (['seclusion', 'cultivating', 'held'] as const).map((fg) => sceneCell(p, 'R3', fg))),
  // realm-progression strip (R1 + R6, seclusion) — proves the scene evolves with realm
  ...PATHS3.flatMap((p) => (['R1', 'R6'] as const).map((r) => sceneCell(p, r, 'seclusion'))),
  // at-Peak gate verdicts (the three crossing states), per path
  ...PATHS3.flatMap((p) => (['ready', 'notReady', 'held'] as const).map((v) => peakCell(p, v))),
  // reduced-motion variants for the load-bearing states
  sceneCell('heaven', 'R3', 'cultivating', true),
  sceneCell('earth', 'R3', 'held', true),
  sceneCell('martial', 'R6', 'seclusion', true),
  peakCell('heaven', 'ready', true),
  // edge cells
  { id: 'edge-noPath', label: 'no path (fallback)', raw: { game: { ...baseRaw().game, selectedPath: null }, activity: { foregroundType: null, combatHeld: false }, content: { loaded: false } } },
  { id: 'edge-peak-noPity', label: 'Peak ready, pity null', raw: { game: { ...baseRaw().game, substage: 9, qi: '500000000', breakthroughRequirement: '500000000' }, pity: null } },
];

const MATRIX_BY_ID: Record<string, SeatMatrixCell> = Object.fromEntries(CULTIVATION_SEAT_MATRIX.map((c) => [c.id, c]));

export function getSeatFixture(id: string): CultivationSeatSurfaceV1 | null {
  const factory = CULTIVATION_SEAT_FIXTURES[id];
  if (factory) return factory();
  const cell = MATRIX_BY_ID[id];
  if (cell) return makeSeatFixture(cell.raw);
  return null;
}
