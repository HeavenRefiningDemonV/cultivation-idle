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

export function getSeatFixture(id: string): CultivationSeatSurfaceV1 | null {
  const factory = CULTIVATION_SEAT_FIXTURES[id];
  return factory ? factory() : null;
}
