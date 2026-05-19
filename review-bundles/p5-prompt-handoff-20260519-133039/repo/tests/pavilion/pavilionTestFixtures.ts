import fs from 'node:fs';
import path from 'node:path';

import type { PavilionRecordsManifest } from '../../src/features/pavilion/pavilionContentTypes.js';

export function loadPavilionManifestFixture(): PavilionRecordsManifest {
  const manifestPath = path.join(
    process.cwd(),
    'docs',
    'Pavilion',
    'Pavilion_of_Ten_Thousand_Records_Content_Manifest.json',
  );
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PavilionRecordsManifest;
}

export function createPavilionGeneratedContentFixture() {
  return {
    items: [
      { id: 'gate_foundation_pill', name: 'Gate Foundation Pill', category: 'catalyst' },
      { id: 'healing_pill_minor', name: 'Minor Healing Pill', category: 'consumable' },
      { id: 'mat_spirit_dew', name: 'Spirit Dew', category: 'material' },
    ],
    techniques: [
      { id: 'quiet_breath_method', name: 'Quiet Breath Method', path: 'heaven', type: 'passive', tags: ['breath'] },
    ],
    cities: [
      {
        id: 'city_pinewind_hamlet',
        name: 'Pinewind Hamlet',
        index: 0,
        unlockMajorRealm: 'qi_condensation',
        modules: ['outskirts', 'gateTrial', 'ruins', 'manualPavilion', 'apothecary', 'forge', 'bounties', 'expeditions'],
        refs: {
          outskirtsId: 'outskirts_pinewind',
          gateTrialId: 'trial_foundation_gate',
          ruinId: 'ruin_pinewind',
          pavilionId: 'pavilion_pinewind',
          apothecaryId: 'apothecary_pinewind',
          forgeId: 'forge_pinewind',
        },
      },
    ],
    trials: [
      {
        id: 'trial_foundation_gate',
        name: 'Foundation Gate',
        cityId: 'city_pinewind_hamlet',
        cityIndex: 0,
        bossId: 'enemy_gate_warden',
        gateItemId: 'gate_foundation_pill',
        gatesToMajorRealm: 'foundation_establishment',
      },
    ],
    ruins: [
      {
        id: 'ruin_pinewind',
        name: 'Pinewind Ruins',
        cityId: 'city_pinewind_hamlet',
        cityIndex: 0,
        roomCount: 3,
        roomPools: { mobs: ['enemy_wolf'] },
        dropsPerRoom: { rolls: 1, pool: [{ itemId: 'mat_spirit_dew', weight: 1, qtyMin: 1, qtyMax: 2 }] },
        finalChestDrops: { rolls: 1, pool: [{ itemId: 'mat_missing_archive', weight: 1, qtyMin: 1, qtyMax: 1 }] },
      },
    ],
    enemies: [
      { id: 'enemy_gate_warden', name: 'Gate Warden', tags: ['trial'] },
      { id: 'enemy_wolf', name: 'Pine Wolf', tags: ['outskirts'] },
    ],
    heart_laws: [
      { id: 'quiet_breath_method', name: 'Quiet Breath Method', tier: 'starter', archetype: 'Heaven' },
    ],
    alchemy_recipes: [
      {
        id: 'alc_minor_healing_pill',
        unlocksAtCityId: 'city_pinewind_hamlet',
        timeSec: 60,
        inputs: { mat_spirit_dew: 1 },
        outputs: { healing_pill_minor: 1 },
      },
    ],
    forge_blueprints: [
      {
        id: 'forge_refine_weapon_t1',
        unlocksAtCityId: 'city_pinewind_hamlet',
        timeSec: 90,
        inputs: { mat_spirit_dew: 1 },
        outputs: { weapon_training_sword: 1 },
      },
    ],
    runes: [{ id: 'rune_guard_t1', tier: 1 }],
    talisman_recipes: [
      {
        id: 'tal_guard_paper_t1',
        unlocksAtCityId: 'city_pinewind_hamlet',
        timeSec: 120,
        inputs: { mat_spirit_dew: 1 },
        outputs: { talisman_guard_paper_t1: 1 },
      },
    ],
    bounties: {
      version: 1,
      refreshCooldownSeconds: 3600,
      difficulties: ['easy', 'medium', 'hard'],
      rewardTiersByCityIndex: {},
      templates: [
        {
          id: 'bounty_gate_supplies',
          name: 'Gate Supplies',
          desc: 'Support the Foundation Gate preparation route.',
          kind: 'CRAFT_COMPLETE',
          targets: { easy: 1, medium: 2, hard: 3 },
          difficulties: ['easy'],
          minCityIndex: 0,
        },
      ],
    },
    expeditions: {
      durations: [{ id: 'short', label: 'Short', seconds: 900 }],
      types: [{ id: 'herb_gathering', name: 'Herb Gathering', yieldTags: ['herbs'] }],
      cityYields: [{ cityIndex: 0, yieldsByTag: { herbs: { items: [{ itemId: 'mat_spirit_dew', qty: 1 }] } } }],
    },
    prestige_store: {
      version: 'test',
      upgrades: [
        { id: 'prestige_memory_ink', name: 'Memory Ink', type: 'utility', maxLevel: 1, costs: [1] },
      ],
    },
    pavilions: [
      {
        id: 'pavilion_pinewind',
        cityId: 'city_pinewind_hamlet',
        cityIndex: 0,
        poolByPath: { heaven: ['quiet_breath_method'], earth: ['quiet_breath_method'], martial: ['quiet_breath_method'] },
      },
    ],
    outskirts: [
      {
        id: 'outskirts_pinewind',
        cityId: 'city_pinewind_hamlet',
        cityIndex: 0,
        name: 'Pinewind Outskirts',
        killsToBoss: 8,
        bossId: 'enemy_wolf',
        mobPool: [{ enemyId: 'enemy_wolf', weight: 1 }],
        matPools: { common: ['mat_spirit_dew'] },
      },
    ],
    apothecary_shops: [
      {
        id: 'apothecary_pinewind',
        cityId: 'city_pinewind_hamlet',
        name: 'Pinewind Apothecary',
        stock: [{ id: 'stock_healing', itemId: 'healing_pill_minor', qty: 1, buy: { gold: 25 } }],
      },
    ],
  };
}
