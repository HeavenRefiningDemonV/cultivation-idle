import { contentUrl } from './contentPaths.js';
import { RUNTIME_CONTENT_DIR, RUNTIME_CONTENT_FILE_BY_KEY } from './runtimeContentManifest.js';
export class ContentLoadError extends Error {
    phase;
    fileName;
    url;
    causeText;
    constructor(args) {
        super(args.message);
        this.name = 'ContentLoadError';
        this.phase = args.phase;
        this.fileName = args.fileName ?? null;
        this.url = args.url ?? null;
        this.causeText = args.causeText;
    }
}
export async function fetchJson(url) {
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
    }
    catch (error) {
        throw new ContentLoadError({
            message: `[Content] Invalid JSON in ${url}`,
            phase: 'parse',
            url,
            causeText: error instanceof Error ? error.message : String(error),
        });
    }
}
async function loadFile(fileName) {
    const url = contentUrl(fileName);
    try {
        return await fetchJson(url);
    }
    catch (error) {
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
export async function loadAllContent() {
    const files = RUNTIME_CONTENT_FILE_BY_KEY;
    const entries = await Promise.all(Object.entries(files).map(async ([key, fileName]) => {
        const data = await loadFile(fileName);
        return [key, data];
    }));
    return Object.fromEntries(entries);
}
