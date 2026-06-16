import type {
  AlchemyRecipesConfig,
  ApothecaryShopsConfig,
  BountiesConfig,
  CitiesPayload,
  CultivatorStatsConfig,
  DaoHeartPracticesConfig,
  EconomyConfig,
  EnemiesConfig,
  ExpeditionsConfig,
  ForgeBlueprintsConfig,
  HeartLawsConfig,
  ItemsConfig,
  OutskirtsConfig,
  PathMeridiansConfig,
  PavilionsConfig,
  PrestigeStoreConfig,
  PavilionRecordsConfig,
  RunesConfig,
  RuinsConfig,
  ReadinessCategoriesConfig,
  SpiritRootProgressionsConfig,
  TalismanRecipesConfig,
  TechniquesConfig,
  TrainingRegimensConfig,
  TrialsConfig,
} from './types.js';
import type { OnboardingMilestonesConfig } from '../systems/onboarding/onboardingTypes.js';
import { contentUrl } from './contentPaths.js';
import { RUNTIME_CONTENT_DIR, RUNTIME_CONTENT_FILE_BY_KEY, type RuntimeContentFileName } from './runtimeContentManifest.js';
import { PERF_LABELS, timeAsync } from '../services/performance/index.js';

export type ContentLoadFailurePhase = 'fetch' | 'parse' | 'load';

export class ContentLoadError extends Error {
  phase: ContentLoadFailurePhase;
  fileName: string | null;
  url: string | null;
  causeText?: string;

  constructor(args: { message: string; phase: ContentLoadFailurePhase; fileName?: string | null; url?: string | null; causeText?: string }) {
    super(args.message);
    this.name = 'ContentLoadError';
    this.phase = args.phase;
    this.fileName = args.fileName ?? null;
    this.url = args.url ?? null;
    this.causeText = args.causeText;
  }
}

export interface LoadedContentRaw {
  economy: EconomyConfig;
  cities: CitiesPayload;
  items: ItemsConfig;
  techniques: TechniquesConfig;
  pavilions: PavilionsConfig;
  outskirts: OutskirtsConfig;
  enemies: EnemiesConfig;
  trials: TrialsConfig;
  ruins: RuinsConfig;
  alchemy_recipes: AlchemyRecipesConfig;
  forge_blueprints: ForgeBlueprintsConfig;
  runes: RunesConfig;
  talisman_recipes: TalismanRecipesConfig;
  apothecary_shops: ApothecaryShopsConfig;
  expeditions: ExpeditionsConfig;
  bounties: BountiesConfig;
  heart_laws: HeartLawsConfig;
  prestige_store: PrestigeStoreConfig;
  pavilion_records: PavilionRecordsConfig;
  onboarding_milestones: OnboardingMilestonesConfig;
  cultivator_stats: CultivatorStatsConfig;
  training_regimens: TrainingRegimensConfig;
  dao_heart_practices: DaoHeartPracticesConfig;
  spirit_roots: SpiritRootProgressionsConfig;
  readiness_categories: ReadinessCategoriesConfig;
  path_meridians: PathMeridiansConfig;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: import.meta.env.DEV ? 'no-store' : undefined,
  });

  if (!res.ok) {
    throw new ContentLoadError({
      message: `[Content] Failed to fetch ${url} (HTTP ${res.status})`,
      phase: 'fetch',
      url,
    });
  }

  try {
    return await res.json();
  } catch (error) {
    throw new ContentLoadError({
      message: `[Content] Invalid JSON in ${url}`,
      phase: 'parse',
      url,
      causeText: error instanceof Error ? error.message : String(error),
    });
  }
}

async function loadFile<T>(fileName: string): Promise<T> {
  const url = contentUrl(fileName);
  try {
    return await timeAsync(`ci:content:loadFile:${fileName}`, () => fetchJson<T>(url));
  } catch (error) {
    if (error instanceof ContentLoadError) {
      const expectedRuntimePath = `/${RUNTIME_CONTENT_DIR}/${fileName}`;
      const message = error.phase === 'fetch'
        ? `[Content] Missing runtime content file: ${fileName}. Expected public runtime path: ${expectedRuntimePath}. Run \`npm run release:runtime-content-manifest\` before shipping. Original error: ${error.message}`
        : `[Content] ${fileName}: ${error.message}`;
      throw new ContentLoadError({
        message,
        phase: error.phase,
        fileName,
        url: error.url ?? url,
        causeText: error.causeText,
      });
    }
    throw new ContentLoadError({
      message: `[Content] ${fileName}: ${error instanceof Error ? error.message : String(error)}`,
      phase: 'load',
      fileName,
      url,
    });
  }
}

export async function loadAllContent(): Promise<LoadedContentRaw> {
  return await timeAsync(PERF_LABELS.contentLoadAll, async () => {
    const files = RUNTIME_CONTENT_FILE_BY_KEY as Record<keyof LoadedContentRaw, RuntimeContentFileName>;

    const entries = await Promise.all(
      Object.entries(files).map(async ([key, fileName]) => {
        const data = await loadFile(fileName);
        return [key, data] as const;
      }),
    );

    return Object.fromEntries(entries) as unknown as LoadedContentRaw;
  });
}
