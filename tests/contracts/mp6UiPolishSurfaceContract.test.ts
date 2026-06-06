import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_FILE_BY_KEY,
  validateLoadedContent,
  type LoadedContentRaw,
} from '../../src/content/index.js';
import { buildDaoHeartSanctuarySurface } from '../../src/features/daoHeartSanctuary/buildDaoHeartSanctuarySurface.js';
import { buildTrainingHallSurface } from '../../src/features/trainingHall/buildTrainingHallSurface.js';
import {
  createDefaultTrainingSaveState,
  createTrainingRuntimeContent,
  type TrainingRuntimeContent,
} from '../../src/systems/training/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

async function source(relPath: string): Promise<string> {
  return fs.readFile(path.resolve(process.cwd(), relPath), 'utf8');
}

let rawContent: LoadedContentRaw;
let trainingContent: TrainingRuntimeContent;

test.before(async () => {
  rawContent = await loadRuntimeRawContent();
  validateLoadedContent(rawContent);
  trainingContent = createTrainingRuntimeContent(rawContent);
});

test('MP6 Training Hall surface exposes additive visual state and bounded local FX budget', () => {
  const surface = buildTrainingHallSurface({
    content: trainingContent,
    state: createDefaultTrainingSaveState(),
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    activeActivity: null,
    selectedIntensityId: 'steady',
    prefersReducedMotion: true,
  });

  assert.equal(surface.visual.surface, 'training-hall-mp6');
  assert.equal(surface.visual.fxBudget.maxParticles, 36);
  assert.equal(surface.visual.fxBudget.opacityOverTextMax, 0.18);
  assert.equal(surface.visual.motionMode, 'static');
  assert.equal(surface.visual.activityState, 'idle');
  assert.equal(surface.visual.pathTone, 'heaven');
  assert.ok(surface.visual.screenshotStates.includes('training-idle'));
  assert.ok(surface.visual.screenshotStates.includes('training-reduced-motion'));
});

test('MP6 Dao Heart Sanctuary surface exposes turbulence, seal, and bounded local FX state', () => {
  const firstLaw = rawContent.heart_laws.heartLaws[0];
  assert.ok(firstLaw);
  const surface = buildDaoHeartSanctuarySurface({
    selectedHeartLawId: firstLaw.id,
    heartLaw: firstLaw,
    practices: rawContent.dao_heart_practices.practices,
    levelById: { [firstLaw.id]: 4 },
    xpById: { [firstLaw.id]: 120 },
    verseMasteryByLawId: { [firstLaw.id]: 72 },
    clarity: 34,
    turbulence: 90,
    activePracticeId: 'inner_demon_debate',
    cultivationEffectiveStage: 12,
    prefersReducedMotion: true,
  });

  assert.equal(surface.visual.surface, 'dao-heart-sanctuary-mp6');
  assert.equal(surface.visual.fxBudget.maxParticles, 48);
  assert.equal(surface.visual.fxBudget.opacityOverTextMax, 0.18);
  assert.equal(surface.visual.motionMode, 'static');
  assert.equal(surface.visual.turbulenceBand, 'fractured');
  assert.equal(surface.visual.sealState, 'fractured');
  assert.equal(surface.visual.practiceState, 'active');
  assert.ok(surface.visual.screenshotStates.includes('dao-heart-high-turbulence'));
  assert.ok(surface.visual.screenshotStates.includes('dao-heart-reduced-motion'));
});

test('MP6 rendered source keeps reduced-motion and no-shift anchors on additive polish surfaces', async () => {
  const [
    trainingScreen,
    trainingCss,
    daoScreen,
    daoCss,
    cultivationScreen,
    gateScreen,
    gateCss,
    techniqueModal,
    techniqueCss,
  ] = await Promise.all([
    source('src/features/trainingHall/TrainingHallScreen.tsx'),
    source('src/features/trainingHall/TrainingHallScreen.scss'),
    source('src/features/daoHeartSanctuary/DaoHeartSanctuaryView.tsx'),
    source('src/features/daoHeartSanctuary/DaoHeartSanctuaryView.scss'),
    source('src/features/cultivation/exact/CultivationExactScreen.tsx'),
    source('src/features/world/gateTrialExact/GateTrialExactScreen.ts'),
    source('src/features/world/gateTrialExact/GateTrialExactScreen.scss'),
    source('src/components/modals/TechniqueDetailModal.tsx'),
    source('src/components/modals/TechniqueDetailModal.scss'),
  ]);

  assert.match(trainingScreen, /data-fx-particle-budget/);
  assert.match(trainingScreen, /training-hall-vfx-motes/);
  assert.match(trainingCss, /--training-hall-mote-opacity:\s*0\.18/);
  assert.match(trainingCss, /@media \(prefers-reduced-motion: reduce\)/);

  assert.match(daoScreen, /data-fx-particle-budget/);
  assert.match(daoScreen, /dao-heart-sanctuary-vfx-mote/);
  assert.match(daoCss, /--dao-heart-mote-opacity:\s*0\.18/);
  assert.match(daoCss, /@media \(prefers-reduced-motion: reduce\)/);

  assert.match(cultivationScreen, /data-row-id/);
  assert.match(cultivationScreen, /data-risk-band/);
  assert.match(cultivationScreen, /data-confirmation-required/);

  assert.match(gateScreen, /data-node-id/);
  assert.match(gateScreen, /data-status/);
  assert.match(gateCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(gateCss, /--gate-failure-shake-max:\s*3px/);
  assert.match(gateCss, /--gate-failure-shake-duration:\s*120ms/);

  assert.match(techniqueModal, /buildTechniqueScalingTooltipRows/);
  assert.match(techniqueModal, /aria-label="Training Hall scaling preview"/);
  assert.match(techniqueCss, /min-height:\s*72px/);
  assert.match(techniqueCss, /@media \(prefers-reduced-motion: reduce\)/);
});
