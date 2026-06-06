import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  adaptProgressionAuthoredContent,
  buildProgressionContract,
  type ProgressionAuthoredContent,
  type RawProgressionContentLike,
} from '../src/systems/progression/contract/index.js';
import { collectProgressionDiagnostics, renderProgressionContractReport } from '../src/systems/progression/diagnostics/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const FILES = {
  economy: 'economy.json',
  cities: 'cities.json',
  items: 'items.json',
  techniques: 'techniques.json',
  pavilions: 'pavilions.json',
  outskirts: 'outskirts.json',
  enemies: 'enemies.json',
  trials: 'trials.json',
  ruins: 'ruins.json',
  alchemy_recipes: 'alchemy_recipes.json',
  forge_blueprints: 'forge_blueprints.json',
  runes: 'runes.json',
  talisman_recipes: 'talisman_recipes.json',
  apothecary_shops: 'apothecary_shops.json',
  expeditions: 'expeditions.json',
  bounties: 'bounties.json',
  heart_laws: 'heart_laws.json',
  prestige_store: 'prestige_store.json',
  pavilion_records: 'pavilion_records.json',
  onboarding_milestones: 'onboarding_milestones.json',
};

const runtimeScanPaths = [
  'src/stores/gameStore.ts',
  'src/stores/prestigeStore.ts',
  'src/systems/offline.ts',
  'src/services/time/OfflineCatchup.ts',
  'src/systems/loot.ts',
  'src/constants/itemsDatabase.ts',
];

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadContent(): Promise<RawProgressionContentLike> {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as RawProgressionContentLike;
}

const toDiagnosticsShape = (content: ProgressionAuthoredContent) => ({
  economyRealms: content.economy.majorRealms.map((x) => x.id),
  cities: content.cities,
  trials: content.trials.map((trial) => ({
    id: trial.id,
    gateItemId: trial.gateItemId,
    fromMajorRealm:
      trial.eligibilityRule && typeof trial.eligibilityRule === 'object' ? trial.eligibilityRule.fromMajorRealm : undefined,
    toMajorRealm: trial.gatesToMajorRealm,
  })),
  items: content.items.items.map((x) => x.id),
});

async function run(): Promise<void> {
  const loaded = await loadContent();
  const authored = adaptProgressionAuthoredContent(loaded);
  const contract = buildProgressionContract(authored);

  const runtimeFileTextByPath: Record<string, string> = {};
  for (const runtimePath of runtimeScanPaths) {
    runtimeFileTextByPath[runtimePath] = await fs.readFile(path.resolve(process.cwd(), runtimePath), 'utf8');
  }

  const diagnostics = collectProgressionDiagnostics(contract, {
    authoredContent: toDiagnosticsShape(authored),
    runtimeFileTextByPath,
  });

  console.log(renderProgressionContractReport(contract, diagnostics));
}

run().catch((error) => {
  console.error('[ProgressionContractReport] Failed');
  console.error(error);
  process.exit(1);
});
