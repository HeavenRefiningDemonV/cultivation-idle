import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { HeartLawDef, HeartLawsConfig } from '../../src/content/index.js';
import { buildDaoHeartSanctuarySurface } from '../../src/features/daoHeartSanctuary/buildDaoHeartSanctuarySurface.js';
import type { DaoHeartSanctuarySurfaceV1 } from '../../src/features/daoHeartSanctuary/daoHeartSanctuaryTypes.js';
import type { SpiritRoot } from '../../src/types/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function source(relPath: string): Promise<string> {
  return fs.readFile(path.resolve(process.cwd(), relPath), 'utf8');
}

function getLaw(config: HeartLawsConfig, id: string): HeartLawDef {
  const law = config.heartLaws.find((entry) => entry.id === id);
  assert.ok(law, `expected Heart Law ${id}`);
  return law;
}

type Mp6FullSurface = DaoHeartSanctuarySurfaceV1 & {
  header?: {
    qiSpeedImpact: string;
    breakthroughRiskImpact: string;
    currentBonus: string;
    parityLabel: string;
  };
  centerMandala?: {
    chapterNodes: unknown[];
    verseRing: { masteryLabel: string };
    nextSeal: { label: string; state: string; detail: string };
    rootResonanceLine: string;
    turbulenceCracks: string;
    overlevelHaze: string | null;
  };
  rightRail?: {
    causeRows: Array<{
      id: string;
      label: string;
      severity: string;
      detail: string;
      actionLabel?: string;
      targetPracticeId?: string | null;
    }>;
  };
  rootFit?: {
    tier: string;
    label: string;
    summary: string;
  };
  rootVariantHint?: {
    label: string;
    practiceIds: string[];
    unlocked: boolean;
  } | null;
  branchChoices?: Array<{
    id: string;
    label: string;
    state: string;
    detail: string;
  }>;
  bottomActions: DaoHeartSanctuarySurfaceV1['bottomActions'] & {
    forecastWindows?: Array<{ minutes: 10 | 30 | 60; summary: string }>;
    foregroundConflictText?: string | null;
    offlineEligibilityText?: string;
  };
};

const FIRE_ROOT: SpiritRoot = { element: 'fire', grade: 4, purity: 92 };

test('MP6 Dao Heart Sanctuary builds a full destination surface with speed, risk, root fit, causes, and forecasts', async () => {
  const [heartLaws, practices] = await Promise.all([
    readJson<HeartLawsConfig>('heart_laws.json'),
    readJson<{ practices: Parameters<typeof buildDaoHeartSanctuarySurface>[0]['practices'] }>('dao_heart_practices.json'),
  ]);
  const heartLaw = getLaw(heartLaws, 'heart_quiet_breath_method');

  const surface = buildDaoHeartSanctuarySurface({
    selectedHeartLawId: heartLaw.id,
    heartLaw,
    practices: practices.practices,
    levelById: { [heartLaw.id]: 2 },
    xpById: { [heartLaw.id]: 42 },
    verseMasteryByLawId: { [heartLaw.id]: 48 },
    clarity: 44,
    turbulence: 30,
    activePracticeId: 'scripture_copying',
    cultivationEffectiveStage: 5,
    spiritRoot: FIRE_ROOT,
    currentRootResonance: 36,
    unlockedVariantIds: [],
    foregroundActivityType: 'path_training',
    prefersReducedMotion: false,
  } as Parameters<typeof buildDaoHeartSanctuarySurface>[0]);
  const full = surface as Mp6FullSurface;

  assert.match(full.header?.qiSpeedImpact ?? '', /-26%|0\.74x/);
  assert.match(full.header?.breakthroughRiskImpact ?? '', /\+18/);
  assert.match(full.header?.currentBonus ?? '', /Heart Law XP|root/i);
  assert.match(full.header?.parityLabel ?? '', /lags|lag/i);

  assert.ok((full.centerMandala?.chapterNodes.length ?? 0) >= 3);
  assert.match(full.centerMandala?.verseRing.masteryLabel ?? '', /48%/);
  assert.match(full.centerMandala?.nextSeal.label ?? '', /Seal|Chapter|Doctrine/i);
  assert.match(full.centerMandala?.rootResonanceLine ?? '', /36|Opposed|Strained|Resonance/i);
  assert.match(full.centerMandala?.turbulenceCracks ?? '', /turbulence|crack|steady|calm/i);

  assert.equal(full.rootFit?.tier, 'opposed');
  assert.match(full.rootVariantHint?.label ?? '', /Banked Ember/i);
  assert.deepEqual(full.rootVariantHint?.practiceIds, ['scripture_copying', 'breath_harmonization']);
  assert.ok(full.branchChoices?.some((choice) => /Doctrine Trial|chapter|seal/i.test(`${choice.label} ${choice.detail}`)));

  assert.ok(full.rightRail?.causeRows.some((row) => row.id === 'root-heart-fit' && row.targetPracticeId === 'scripture_copying'));
  assert.ok(full.rightRail?.causeRows.some((row) => row.id === 'mind-alignment' && /speed|risk|Heart Law/i.test(row.detail)));
  assert.deepEqual(full.bottomActions.forecastWindows?.map((row) => row.minutes), [10, 30, 60]);
  assert.match(full.bottomActions.foregroundConflictText ?? '', /Path Training|foreground/i);
  assert.match(full.bottomActions.offlineEligibilityText ?? '', /offline/i);

  const scripture = full.practices.find((practice) => practice.id === 'scripture_copying') as typeof full.practices[number] & {
    outputs?: { bestUse: string; rootMultiplierLabel: string; turbulencePerMinuteLabel: string };
    forecasts?: Array<{ minutes: 10 | 30 | 60; summary: string }>;
  };
  assert.match(scripture.outputs?.bestUse ?? '', /Root resonance/i);
  assert.match(scripture.outputs?.rootMultiplierLabel ?? '', /1\.20x/);
  assert.match(scripture.outputs?.turbulencePerMinuteLabel ?? '', /\+0\.03/);
  assert.deepEqual(scripture.forecasts?.map((row) => row.minutes), [10, 30, 60]);
});

test('MP6 Dao Heart Sanctuary source removes production debug pulse controls', async () => {
  const [viewSource, controllerSource] = await Promise.all([
    source('src/features/daoHeartSanctuary/DaoHeartSanctuaryView.tsx'),
    source('src/features/daoHeartSanctuary/useDaoHeartSanctuaryActionController.ts'),
  ]);

  assert.doesNotMatch(viewSource, /Advance 1 minute/i);
  assert.doesNotMatch(viewSource, /pulsePractice/);
  assert.doesNotMatch(controllerSource, /tickDaoHeartPractice/);
  assert.doesNotMatch(controllerSource, /pulsePractice/);
});
