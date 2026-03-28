function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return 0;
}
function normalizeItemEntries(value) {
    if (!value)
        return [];
    if (Array.isArray(value)) {
        return value
            .map((entry) => {
            if (!entry || typeof entry !== 'object')
                return null;
            const record = entry;
            const itemId = typeof record.itemId === 'string' ? record.itemId : typeof record.id === 'string' ? record.id : '';
            const qty = Math.max(0, toNumber(record.qty ?? record.amount ?? record.count));
            if (!itemId || qty <= 0)
                return null;
            return { itemId, qty };
        })
            .filter((entry) => Boolean(entry));
    }
    if (typeof value === 'object') {
        return Object.entries(value)
            .map(([itemId, qty]) => {
            const amount = Math.max(0, toNumber(qty));
            if (!itemId || amount <= 0)
                return null;
            return { itemId, qty: amount };
        })
            .filter((entry) => Boolean(entry));
    }
    return [];
}
function normalizeOutput(value) {
    if (!value)
        return undefined;
    if (Array.isArray(value)) {
        const items = normalizeItemEntries(value);
        return items[0];
    }
    if (typeof value === 'object') {
        const entries = normalizeItemEntries(value);
        return entries[0];
    }
    return undefined;
}
function sanitizeStepScript(raw) {
    if (!Array.isArray(raw))
        return undefined;
    return raw
        .map((entry) => {
        if (!entry || typeof entry !== 'object')
            return null;
        const record = entry;
        if (typeof record.id !== 'string' || typeof record.type !== 'string')
            return null;
        return record;
    })
        .filter((entry) => Boolean(entry));
}
function sanitizeHandsOnBonus(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const record = raw;
    const bonus = {};
    if (typeof record.qualityProcChancePct === 'number')
        bonus.qualityProcChancePct = record.qualityProcChancePct;
    if (typeof record.masteryMult === 'number')
        bonus.masteryMult = record.masteryMult;
    if (typeof record.timeReductionPct === 'number')
        bonus.timeReductionPct = record.timeReductionPct;
    if (typeof record.temperProcChancePct === 'number')
        bonus.temperProcChancePct = record.temperProcChancePct;
    return Object.keys(bonus).length > 0 ? bonus : undefined;
}
function readCostField(raw, key) {
    if (key in raw)
        return toNumber(raw[key]);
    const cost = raw.cost;
    if (cost && key in cost)
        return toNumber(cost[key]);
    const costs = raw.costs;
    if (costs && key in costs)
        return toNumber(costs[key]);
    return 0;
}
export function normalizeForgeBlueprint(rawBlueprint) {
    const raw = (rawBlueprint ?? {});
    const id = typeof raw.id === 'string' ? raw.id : '';
    const name = typeof raw.name === 'string' ? raw.name : undefined;
    const cityId = typeof raw.cityId === 'string'
        ? raw.cityId
        : typeof raw.unlockCityId === 'string'
            ? raw.unlockCityId
            : typeof raw.unlocksAtCityId === 'string'
                ? raw.unlocksAtCityId
                : undefined;
    const cityIndex = typeof raw.cityIndex === 'number' ? raw.cityIndex : toNumber(raw.tier);
    const service = typeof raw.service === 'string'
        ? raw.service
        : typeof raw.serviceType === 'string'
            ? raw.serviceType
            : undefined;
    const timeSec = toNumber(raw.timeSec ?? raw.durationSec ?? raw.time ?? raw.seconds);
    const costItems = normalizeItemEntries(raw.inputs ?? raw.in ?? raw.ingredients ?? raw.costItems ?? raw.cost?.items);
    const gold = Math.max(0, readCostField(raw, 'gold') ||
        readCostField(raw, 'gp') ||
        readCostField(raw, 'goldCost') ||
        readCostField(raw, 'costGold'));
    const spiritStones = Math.max(0, readCostField(raw, 'spiritStones') || readCostField(raw, 'ss') || readCostField(raw, 'ssCost'));
    const output = normalizeOutput(raw.outputs ?? raw.out ?? raw.output ?? raw.produces ?? raw.result);
    const assistedPrompts = Array.isArray(raw.assistedPrompts)
        ? raw.assistedPrompts
        : undefined;
    const stepScript = sanitizeStepScript(raw.stepScript);
    const handsOnBonus = sanitizeHandsOnBonus(raw.handsOnBonus);
    const effect = typeof raw.effect === 'object' && raw.effect ? raw.effect : undefined;
    const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : undefined;
    const type = service || raw.effect ? 'service' : 'craft';
    return {
        id,
        name,
        cityId,
        cityIndex: Number.isFinite(cityIndex) ? cityIndex : undefined,
        type,
        service,
        timeSec: Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0,
        costs: {
            gold: Number.isFinite(gold) ? gold : 0,
            spiritStones: Number.isFinite(spiritStones) ? spiritStones : 0,
            items: costItems,
        },
        output,
        tags,
        assistedPrompts,
        stepScript,
        handsOnBonus,
        effect,
    };
}
export function isRuneBlueprint(blueprint) {
    return blueprint.type === 'craft' && Boolean(blueprint.output?.itemId?.startsWith('rune_'));
}
export function isRefineBlueprint(blueprint) {
    return blueprint.type === 'service' && blueprint.service === 'refine';
}
export function isTemperBlueprint(blueprint) {
    return blueprint.type === 'service' && blueprint.service === 'temper';
}
export function listNormalizedForgeInputItems(blueprint) {
    return [...blueprint.costs.items];
}
export function blueprintUsesInputItem(blueprint, itemId) {
    return blueprint.costs.items.some((entry) => entry.itemId === itemId);
}
