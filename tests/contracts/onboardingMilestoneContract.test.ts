import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const MILESTONE_FILE = path.join(CONTENT_DIR, 'onboarding_milestones.json');

const EXPECTED_IDS = [
  'M0_life_start',
  'M1_cultivation_only',
  'M2_status_unlock',
  'M3_world_outskirts',
  'M4_pavilion_satchel',
  'M5_techniques_loadout',
  'M6_apothecary_expedition',
  'M7_forge',
  'M8_ruins_bounties',
  'M9_gate_trial',
  'M10_foundation_graduation',
] as const;

const VALID_TABS = new Set(['cultivation', 'status', 'adventure', 'inventory', 'techniques', 'records', 'prestige', 'settings']);
const VALID_MODULES = new Set(['outskirts', 'ruins', 'gateTrial', 'trainingHall', 'manualPavilion', 'apothecary', 'forge', 'bounties', 'expeditions']);

type Milestone = {
  id: string;
  order: number;
  phase: string;
  unlocks: {
    tabs: string[];
    worldModules: string[];
    teaserWorldModules: string[];
    flags?: string[];
  };
  objective: {
    title: string;
    why: string;
    route: Record<string, unknown>;
    completion: Record<string, unknown>;
  };
  tutorialCard: {
    id: string;
    title: string;
    body: string;
    cta: string;
  };
  sourceSinkNote: string | null;
  replayId: string;
};

async function loadMilestones(): Promise<{ version: string; milestones: Milestone[] }> {
  return JSON.parse(await fs.readFile(MILESTONE_FILE, 'utf8')) as { version: string; milestones: Milestone[] };
}

test('onboarding milestone content declares exactly M0-M10 in order', async () => {
  const config = await loadMilestones();

  assert.equal(config.version, 'onboarding-v1');
  assert.equal(Array.isArray(config.milestones), true);
  assert.deepEqual(config.milestones.map((milestone) => milestone.id), [...EXPECTED_IDS]);
  assert.deepEqual(config.milestones.map((milestone) => milestone.order), EXPECTED_IDS.map((_id, idx) => idx));
});

test('onboarding milestone content exposes valid routes, tutorial cards, tabs, and modules', async () => {
  const config = await loadMilestones();

  for (const milestone of config.milestones) {
    assert.ok(milestone.objective?.title, `${milestone.id} missing objective title`);
    assert.ok(milestone.objective?.why, `${milestone.id} missing objective why`);
    assert.ok(milestone.objective?.route?.kind, `${milestone.id} missing route kind`);
    assert.ok(milestone.objective?.completion?.kind, `${milestone.id} missing completion kind`);
    assert.ok(milestone.tutorialCard?.id, `${milestone.id} missing tutorialCard id`);
    assert.ok(milestone.tutorialCard?.title, `${milestone.id} missing tutorialCard title`);
    assert.ok(milestone.tutorialCard?.body, `${milestone.id} missing tutorialCard body`);
    assert.ok(milestone.tutorialCard?.cta, `${milestone.id} missing tutorialCard cta`);
    assert.ok(milestone.replayId, `${milestone.id} missing replayId`);

    for (const tab of milestone.unlocks.tabs) {
      assert.equal(VALID_TABS.has(tab), true, `${milestone.id} has invalid tab ${tab}`);
    }
    for (const moduleKey of [...milestone.unlocks.worldModules, ...milestone.unlocks.teaserWorldModules]) {
      assert.equal(VALID_MODULES.has(moduleKey), true, `${milestone.id} has invalid world module ${moduleKey}`);
    }
  }
});

test('onboarding source and sink sequence preserves first-life curriculum rules', async () => {
  const config = await loadMilestones();
  const byId = Object.fromEntries(config.milestones.map((milestone) => [milestone.id, milestone]));

  assert.deepEqual(byId.M2_status_unlock.unlocks.worldModules, []);
  assert.equal(byId.M2_status_unlock.unlocks.tabs.includes('status'), true);
  assert.equal(byId.M2_status_unlock.unlocks.tabs.includes('adventure'), false);

  assert.equal(byId.M3_world_outskirts.unlocks.tabs.includes('adventure'), true);
  assert.equal(byId.M3_world_outskirts.unlocks.worldModules.includes('outskirts'), true);
  assert.equal(byId.M3_world_outskirts.unlocks.worldModules.includes('trainingHall'), true);
  assert.equal(byId.M3_world_outskirts.unlocks.teaserWorldModules.includes('manualPavilion'), true);

  assert.equal(byId.M4_pavilion_satchel.unlocks.worldModules.includes('manualPavilion'), true);
  assert.equal(byId.M4_pavilion_satchel.unlocks.tabs.includes('records'), true);

  assert.equal(byId.M5_techniques_loadout.unlocks.tabs.includes('techniques'), true);
  assert.equal(String(byId.M5_techniques_loadout.objective.why).toLowerCase().includes('loadout'), true);

  assert.equal(byId.M6_apothecary_expedition.unlocks.worldModules.includes('apothecary'), true);
  assert.equal(byId.M6_apothecary_expedition.unlocks.worldModules.includes('expeditions'), true);

  assert.equal(byId.M7_forge.unlocks.worldModules.includes('forge'), true);

  assert.equal(byId.M8_ruins_bounties.unlocks.worldModules.includes('ruins'), true);
  assert.equal(byId.M8_ruins_bounties.unlocks.worldModules.includes('bounties'), true);
  assert.equal(byId.M8_ruins_bounties.unlocks.teaserWorldModules.includes('gateTrial'), true);

  assert.equal(byId.M9_gate_trial.unlocks.worldModules.includes('gateTrial'), true);
  assert.equal(byId.M10_foundation_graduation.unlocks.flags?.includes('first_life_onboarding_complete'), true);

  for (const id of EXPECTED_IDS.slice(3, 10)) {
    assert.equal(typeof byId[id].sourceSinkNote, 'string', `${id} must explain source/sink timing`);
    assert.ok(byId[id].sourceSinkNote && byId[id].sourceSinkNote.length > 0, `${id} must explain source/sink timing`);
  }
});
