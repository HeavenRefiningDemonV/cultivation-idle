import { contentUrl } from './contentPaths.js';
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
            throw new ContentLoadError({
                message: `[Content] ${fileName}: ${error.message}`,
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
    const files = {
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
    };
    const entries = await Promise.all(Object.entries(files).map(async ([key, fileName]) => {
        const data = await loadFile(fileName);
        return [key, data];
    }));
    return Object.fromEntries(entries);
}
