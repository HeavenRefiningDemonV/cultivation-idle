import { promises as fs } from 'node:fs';
import path from 'node:path';

const SOUND_IDS_PATH = path.resolve(process.cwd(), 'docs/audio/SOUND_IDS.txt');
const AUDIO_DIR = path.resolve(process.cwd(), 'public/audio');
const SUPPORTED_EXTENSIONS = ['.ogg', '.mp3', '.wav'];

async function loadSoundIds(): Promise<Set<string>> {
  const raw = await fs.readFile(SOUND_IDS_PATH, 'utf8');
  const ids = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return new Set(ids);
}

function hasSupportedExtension(file: string): boolean {
  return SUPPORTED_EXTENSIONS.some((ext) => file.endsWith(ext));
}

function getBaseName(file: string): string {
  return file.replace(path.extname(file), '');
}

async function listAudioFiles(): Promise<string[]> {
  try {
    const entries = await fs.readdir(AUDIO_DIR, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function run() {
  const soundIds = await loadSoundIds();
  const files = (await listAudioFiles()).filter(hasSupportedExtension);

  const missing: string[] = [];
  for (const id of soundIds) {
    const hasExactFile = SUPPORTED_EXTENSIONS.some((ext) => files.includes(`${id}${ext}`));
    if (!hasExactFile) {
      missing.push(id);
    }
  }

  const extras: string[] = [];
  for (const file of files) {
    const baseName = getBaseName(file);
    const [rootId] = baseName.split('__');
    if (!soundIds.has(rootId)) {
      extras.push(file);
    }
  }

  if (missing.length > 0) {
    console.log(`[audio] Missing base files for ${missing.length} sound ids:`);
    missing.forEach((id) => console.log(`  - ${id}`));
  } else {
    console.log('[audio] All sound ids have base audio files.');
  }

  if (extras.length > 0) {
    console.log(`[audio] Extra audio files not in SOUND_IDS (${extras.length}):`);
    extras.forEach((file) => console.log(`  - ${file}`));
  } else {
    console.log('[audio] No extra audio files detected.');
  }
}

run().catch((error) => {
  console.error('[audio] Audio audit failed:', error);
  process.exitCode = 1;
});
