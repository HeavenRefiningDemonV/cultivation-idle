import { promises as fs } from 'node:fs';
import path from 'node:path';
import { adaptProgressionAuthoredContent, buildProgressionContract, } from '../../../src/systems/progression/contract/index.js';
import { RUNTIME_CONTENT_FILE_BY_KEY } from '../../../src/content/runtimeContentManifest.js';
const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const FILES = RUNTIME_CONTENT_FILE_BY_KEY;
const readJson = async (fileName) => JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'));
let cachedContext = null;
export const loadRawProgressionContent = async () => {
    const entries = await Promise.all(Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)]));
    return Object.fromEntries(entries);
};
export const loadProgressionFixtureContext = async () => {
    if (cachedContext)
        return cachedContext;
    const rawContent = await loadRawProgressionContent();
    cachedContext = {
        rawContent,
        contract: buildProgressionContract(adaptProgressionAuthoredContent(rawContent)),
    };
    return cachedContext;
};
