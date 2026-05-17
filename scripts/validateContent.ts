import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { LoadedContentRaw } from '../src/content/loaders.ts';
import { RUNTIME_CONTENT_FILE_BY_KEY } from '../src/content/runtimeContentManifest.ts';
import { validateLoadedContent } from '../src/content/validators.ts';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const FILES = RUNTIME_CONTENT_FILE_BY_KEY as Record<keyof LoadedContentRaw, string>;

async function readJson<T>(fileName: string): Promise<T> {
  const filePath = path.join(CONTENT_DIR, fileName);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function run(): Promise<void> {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => {
      const data = await readJson(fileName);
      return [key, data] as const;
    }),
  );

  const raw = Object.fromEntries(entries) as LoadedContentRaw;
  validateLoadedContent(raw);
  console.log('[ContentValidation] Content validation passed.');
}

run().catch((error) => {
  console.error('[ContentValidation] Content validation failed.');
  console.error(error);
  process.exit(1);
});
