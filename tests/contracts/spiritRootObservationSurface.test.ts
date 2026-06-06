import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type {
  HeartLawDef,
  HeartLawsConfig,
  SpiritRootProgressionDef,
  SpiritRootProgressionsConfig,
} from '../../src/content/index.js';
import { buildSpiritRootObservationSurface } from '../../src/features/spiritRootObservation/index.js';
import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import type { SpiritRoot } from '../../src/types/index.js';

const CONTENT_ROOT = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_ROOT, fileName), 'utf8')) as T;
}

function getLaw(config: HeartLawsConfig, id: string): HeartLawDef {
  const law = config.heartLaws.find((entry) => entry.id === id);
  assert.ok(law, `expected Heart Law ${id}`);
  return law;
}

function getRoot(config: SpiritRootProgressionsConfig, elementId: string): SpiritRootProgressionDef {
  const root = config.roots.find((entry) => entry.elementId === elementId);
  assert.ok(root, `expected spirit root ${elementId}`);
  return root;
}

let laws: HeartLawsConfig;
let roots: SpiritRootProgressionsConfig;

test.before(async () => {
  laws = await readJson<HeartLawsConfig>('heart_laws.json');
  roots = await readJson<SpiritRootProgressionsConfig>('spirit_roots.json');
});

test('Spirit Root Observation is Status-owned and exposes all MP4 tabs', () => {
  const fireRoot: SpiritRoot = { grade: 4, element: 'fire', purity: 92 };
  const surface = buildSpiritRootObservationSurface({
    root: fireRoot,
    rootDef: getRoot(roots, 'fire'),
    heartLaw: getLaw(laws, 'heart_quiet_breath_method'),
    selectedHeartLawId: 'heart_quiet_breath_method',
    heartLawLevel: 9,
    currentRootResonance: 40,
    shape: 'single',
    unlockedVariantIds: [],
    activeTab: 'fit',
    daoHeartClarity: 44,
    verseMastery: 58,
    history: [
      { id: 'recent-fit', label: 'Recent Changes', detail: 'Quiet practice slowed Fire expression.', at: 123 },
    ],
  });

  assert.equal(surface.version, 'spirit-root-observation-v1');
  assert.equal(surface.owner, 'status');
  assert.equal(surface.route.openTarget.kind, 'status_observation');
  assert.equal(surface.route.openTarget.tab, 'fit');
  assert.equal(surface.route.returnAnchorId, 'status-ledger-root');
  assert.deepEqual(surface.tabs.map((tab) => tab.id), [
    'profile',
    'fit',
    'effects',
    'variants',
    'practice_routes',
    'history',
  ]);

  assert.equal(surface.profile.elementId, 'fire');
  assert.match(surface.profile.playstyleLabel, /Explosive/i);
  assert.equal(surface.fit.tier, 'opposed');
  assert.ok(surface.effects.rows.some((row) => /Heart Law XP/i.test(row.label) && /penalty/i.test(row.detail)));
  assert.ok(surface.variants.rows.some((row) => /Banked Ember/i.test(`${row.value ?? ''} ${row.detail}`)));
  assert.ok(surface.practiceRoutes.rows.some((row) => /Scripture Copying/i.test(`${row.value ?? ''} ${row.detail}`)));
  assert.ok(surface.vfxRows.some((row) => row.id === 'vfx-fire-volatility'));
  assert.equal(surface.progression.hardLocksMismatchRoutes, false);
});

test('Status Ledger carries a Spirit Root Observation route without adding a global nav target', async () => {
  const ledger = buildStatusDashboardSurface(123456789).statusLedger;

  assert.ok(ledger.spiritRootObservation, 'Status Ledger should carry observation payload.');
  assert.equal(ledger.spiritRootObservation.owner, 'status');
  assert.equal(ledger.hero.spiritRoot.observationAction?.target.kind, 'status_observation');
  assert.equal(ledger.identityDoctrine.spiritRoot.observationAction?.target.kind, 'status_observation');

  const bottomTabBar = await fs.readFile(path.resolve(process.cwd(), 'src/components/BottomTabBar.tsx'), 'utf8');
  assert.doesNotMatch(bottomTabBar, /['"]spiritRoot['"]|['"]spirit-root['"]/i);
});
