import { promises as fs } from 'node:fs';
import path from 'node:path';

const SOUND_IDS_PATH = path.resolve(process.cwd(), 'docs/audio/SOUND_IDS.txt');
const SOUND_IDS_OUTPUT = path.resolve(process.cwd(), 'src/services/audio/soundIds.ts');
const SOUND_CATALOG_OUTPUT = path.resolve(process.cwd(), 'src/services/audio/soundCatalog.ts');

const SOUND_CATEGORY_BY_PREFIX = [
  { prefix: 'ui_', category: 'ui', defaultVolume: 0.6 },
  { prefix: 'sfx_', category: 'sfx', defaultVolume: 0.8 },
  { prefix: 'amb_', category: 'amb', defaultVolume: 0.35, loop: true },
  { prefix: 'stg_', category: 'stg', defaultVolume: 0.85 },
] as const;

type SoundCategory = 'ui' | 'sfx' | 'amb' | 'stg';

type CatalogEntry = {
  id: string;
  category: SoundCategory;
  defaultVolume: number;
  loop?: boolean;
};

async function loadSoundIds(): Promise<string[]> {
  const raw = await fs.readFile(SOUND_IDS_PATH, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function buildCatalog(ids: string[]): CatalogEntry[] {
  return ids.map((id) => {
    const match = SOUND_CATEGORY_BY_PREFIX.find((entry) => id.startsWith(entry.prefix));
    if (!match) {
      throw new Error(`SoundId "${id}" does not match a known prefix.`);
    }
    return {
      id,
      category: match.category,
      defaultVolume: match.defaultVolume,
      loop: match.loop,
    };
  });
}

function formatSoundIds(ids: string[]): string {
  const lines = ids.map((id) => `  '${id}',`);
  return `export const SOUND_IDS = [\n${lines.join('\n')}\n] as const;\n\nexport type SoundId = (typeof SOUND_IDS)[number];\n\nexport function isSoundId(value: string): value is SoundId {\n  return (SOUND_IDS as readonly string[]).includes(value);\n}\n`;
}

function formatSoundCatalog(entries: CatalogEntry[]): string {
  const lines = entries.map((entry) => {
    const loopFragment = entry.loop ? `, loop: true` : '';
    return `  '${entry.id}': { id: '${entry.id}', category: '${entry.category}', defaultVolume: ${entry.defaultVolume}${loopFragment} },`;
  });
  return `import type { SoundId } from './soundIds';\n\nexport type SoundCategory = 'ui' | 'sfx' | 'amb' | 'stg';\n\nexport type SoundDef = {\n  id: SoundId;\n  category: SoundCategory;\n  loop?: boolean;\n  defaultVolume: number;\n};\n\nexport const SOUND_CATALOG: Record<SoundId, SoundDef> = {\n${lines.join('\n')}\n};\n`;
}

async function run() {
  const ids = await loadSoundIds();
  if (ids.length === 0) {
    throw new Error('No SoundIds found in docs/audio/SOUND_IDS.txt');
  }

  const catalog = buildCatalog(ids);
  await fs.mkdir(path.dirname(SOUND_IDS_OUTPUT), { recursive: true });
  await fs.writeFile(SOUND_IDS_OUTPUT, formatSoundIds(ids), 'utf8');
  await fs.writeFile(SOUND_CATALOG_OUTPUT, formatSoundCatalog(catalog), 'utf8');
  console.log(`[audio] Generated ${ids.length} sound ids and catalog entries.`);
}

run().catch((error) => {
  console.error('[audio] Failed to generate sound catalog:', error);
  process.exitCode = 1;
});
