import { getLiveExpeditionRoutePurpose } from '../systems/world/expeditionRouteContract.js';
import { normalizeTrialFailSafeDefinition } from './trialFailSafe.js';
import { validateForgeBlueprintStepScript } from './validation/validateForgeBlueprints.js';
import { inspectLiveCitySchema, LIVE_CITY_MODULE_ORDER, REQUIRED_CITY_REFS_FOR_LIVE_SLICE, } from '../systems/world/liveWorldSchema.js';
import { buildLiveCityPackageRegistry, formatCityPackageCoverageReport, formatLiveCityPackageCoverageIssue, inspectSemesterCityPackageCoverage, } from '../systems/world/cityPackageRegistry.js';
import { buildActivityRewardAuditReport, buildRewardParityAuditReport, buildLiveEconomyCatalog, buildLiveEconomyAuditReport, buildTargetedMaterialSinkAudit, buildEconomicPhaseSnapshotFromState, buildEconomicStockFloorSnapshot, getAllPrepBudgetRegistryEntries, getAllSpendOrderPolicies, getDeferredModuleLeakKeysForModuleRoleRegistry, getEconomicModuleRoleEntries, getExpeditionPurposeConsistencySummary, getLiveEconomyItemAuditById, getLiveReagentPathAuditByBlueprintId, getPacket36AMaterialSinkStatus, hasVisibleLiveReagentPath, getSinklessLiveMaterials, listKnownLiveEconomyBlockers, buildBestSourceIndex, resolveMissingMaterialRoutes, getAllProblemDestinationPolicies, buildAllPrepPackageFitReports, buildAllSupportReservePacingReports, buildAllPrepVsBypassEconomyReports, } from '../systems/economy/index.js';
import { SEMESTER_SLICE_CONTRACT } from '../systems/progression/contract/semesterSlice.js';
import { getPrepEconomyTargets } from '../systems/balance/prepEconomyTargets.js';
import { buildForgeLadderAudit, buildLiveForgeCatalog, DEFERRED_FORGE_BLUEPRINT_IDS, LEGACY_RUNE_BLUEPRINT_IDS, getLiveForgeFamily as getForgeBlueprintFamily, LIVE_REFINE_LADDER_IDS, LIVE_RUNE_CITY_PAIRS, LIVE_TEMPER_LADDER_IDS, } from '../systems/forge/index.js';
import { buildApothecaryCityBundle } from '../features/apothecary/apothecaryBundles.js';
import { evaluateGatePrepPackageCoverage } from '../features/apothecary/apothecaryPackageCoverage.js';
import { getGatePrepPackageForCity } from '../features/apothecary/gatePrepPackageCatalog.js';
import { buildMeritRoleAudit } from '../systems/economy/meritRoleAudit.js';
import { getAllGateFailureMeritPolicies } from '../systems/economy/gateFailureMeritPolicy.js';
import { getAllSupportBountyClaimExpectations, getAllSupportReserveTargets } from '../systems/economy/supportCurrencyTargets.js';
import { buildSupportEconomyReadModelFromState } from '../systems/economy/supportEconomyReadModel.js';
import { bountyKindToProgressRule, getExpeditionBountyCreditCityId, getLiveCraftBountyCountedSources, getLiveCraftBountyExcludedSources, resolveBountyDestination, } from '../utils/bountyRouting.js';
export function assert(condition, message) {
    if (!condition) {
        throw new Error(`[ContentValidation] ${message}`);
    }
}
export function isObject(x) {
    return typeof x === 'object' && x !== null && !Array.isArray(x);
}
export function assertObject(x, label) {
    assert(isObject(x), `${label} must be an object`);
}
export function assertArray(x, label) {
    assert(Array.isArray(x), `${label} must be an array`);
}
export function assertHasKey(obj, key, label) {
    assert(obj && key in obj, `${label} missing required key '${key}'`);
}
export function assertArrayItemsHaveId(arr, label) {
    arr.forEach((item, idx) => {
        assertObject(item, `${label}[${idx}]`);
        assert('id' in item && typeof item.id === 'string', `${label}[${idx}] missing string id`);
    });
}
export function assertUniqueIds(arr, label) {
    const seen = new Map();
    const dups = [];
    arr.forEach((item, idx) => {
        if (seen.has(item.id)) {
            dups.push(item.id);
        }
        else {
            seen.set(item.id, idx);
        }
    });
    if (dups.length > 0) {
        const preview = dups.slice(0, 5).join(', ');
        assert(false, `${label} contains duplicate ids: ${preview}`);
    }
}
const VALID_CURRENCY_KEYS = new Set([
    'gold',
    'spiritStones',
    'merit',
    // allow item-style currency ids too (future-proof)
    'cur_gold',
    'cur_spirit_stone',
    'cur_merit',
    'cur_ap',
]);
function isCurrencyKey(k) {
    return VALID_CURRENCY_KEYS.has(k);
}
function assertCostOrItemRefsExist(refs, label, itemsById, addErr) {
    if (refs == null)
        return;
    assertObject(refs, label);
    for (const [k, v] of Object.entries(refs)) {
        assert(typeof v === 'number' && Number.isFinite(v), `${label}.${k} must be a finite number`);
        if (isCurrencyKey(k))
            continue;
        if (!itemsById[k]) {
            addErr(`${label} references missing item '${k}'`);
        }
    }
}
export function extractCities(root) {
    if (Array.isArray(root)) {
        assertArrayItemsHaveId(root, 'cities.json cities');
        assertUniqueIds(root, 'cities.json cities');
        return root;
    }
    assert(isObject(root), 'cities.json must be an array of cities OR an object with { cities: [...] }');
    assertHasKey(root, 'cities', 'cities.json');
    const arr = root.cities;
    assertArray(arr, 'cities.json.cities');
    assertArrayItemsHaveId(arr, 'cities.json cities');
    assertUniqueIds(arr, 'cities.json cities');
    return arr;
}
function validateCities(config) {
    const cities = extractCities(config);
    cities.forEach((city, idx) => {
        assertObject(city, `cities[${idx}]`);
        assert(typeof city.id === 'string', `cities[${idx}].id must be a string`);
        assert(typeof city.index === 'number', `cities[${idx}].index must be a number`);
        assert(typeof city.name === 'string', `cities[${idx}].name must be a string`);
        assert(typeof city.unlockMajorRealm === 'string', `cities[${idx}].unlockMajorRealm must be a string`);
        assert(Array.isArray(city.modules), `cities[${idx}].modules must be an array`);
        city.modules.forEach((moduleKey, moduleIdx) => {
            assert(typeof moduleKey === 'string', `cities[${idx}].modules[${moduleIdx}] must be a string`);
        });
        assertObject(city.refs, `cities[${idx}].refs`);
        REQUIRED_CITY_REFS_FOR_LIVE_SLICE.forEach((key) => assertHasKey(city.refs, key, `cities[${idx}].refs`));
        const drift = inspectLiveCitySchema(city);
        assert(drift.duplicateModules.length === 0, `cities[${idx}] (${city.id}) has duplicate modules: ${drift.duplicateModules.join(', ')}`);
        assert(drift.missingLiveModules.length === 0, `cities[${idx}] (${city.id}) is missing live modules: ${drift.missingLiveModules.join(', ')}`);
        assert(drift.deferredModulesPresent.length === 0, `cities[${idx}] (${city.id}) includes deferred modules for this slice: ${drift.deferredModulesPresent.join(', ')}`);
        assert(drift.unknownModulesPresent.length === 0, `cities[${idx}] (${city.id}) includes unknown modules: ${drift.unknownModulesPresent.join(', ')}`);
        assert(drift.actualOrderMatchesCanonical, `cities[${idx}] (${city.id}) modules must exactly match live order: ${LIVE_CITY_MODULE_ORDER.join(', ')}`);
        assert(drift.missingRequiredRefs.length === 0, `cities[${idx}] (${city.id}) is missing required live refs: ${drift.missingRequiredRefs.join(', ')}`);
    });
    return cities;
}
function validateTechniques(config) {
    assertObject(config, 'techniques.json root');
    assertHasKey(config, 'techniques', 'techniques.json');
    assertArray(config.techniques, 'techniques.json.techniques');
    const techniques = config.techniques;
    techniques.forEach((tech, idx) => {
        assertObject(tech, `techniques[${idx}]`);
        assert(typeof tech.id === 'string', `techniques[${idx}].id must be a string`);
        assert(typeof tech.path === 'string', `techniques[${idx}].path must be a string`);
        assert(typeof tech.type === 'string', `techniques[${idx}].type must be a string`);
    });
    assertUniqueIds(techniques, 'techniques.json.techniques');
    return techniques;
}
function validateItems(config) {
    assertObject(config, 'items.json root');
    assertHasKey(config, 'items', 'items.json');
    assertArray(config.items, 'items.json.items');
    const items = config.items;
    items.forEach((item, idx) => {
        assertObject(item, `items[${idx}]`);
        assert(typeof item.id === 'string', `items[${idx}].id must be a string`);
        assert(typeof item.name === 'string', `items[${idx}].name must be a string`);
        assert(typeof item.category === 'string', `items[${idx}].category must be a string`);
    });
    assertUniqueIds(items, 'items.json.items');
    return items;
}
function validatePavilions(config) {
    assertObject(config, 'pavilions.json root');
    assertHasKey(config, 'pavilions', 'pavilions.json');
    assertArray(config.pavilions, 'pavilions.json.pavilions');
    const pavilions = config.pavilions;
    pavilions.forEach((pavilion, idx) => {
        assertObject(pavilion, `pavilions[${idx}]`);
        assert(typeof pavilion.id === 'string', `pavilions[${idx}].id must be a string`);
        assert(typeof pavilion.cityId === 'string', `pavilions[${idx}].cityId must be a string`);
        assertObject(pavilion.poolByPath, `pavilions[${idx}].poolByPath`);
        ['heaven', 'earth', 'martial'].forEach((path) => {
            const pool = pavilion.poolByPath?.[path] ?? [];
            assertArray(pool, `pavilions[${idx}].poolByPath.${path}`);
            pool.forEach((entry, poolIdx) => {
                const isString = typeof entry === 'string';
                const isObj = entry && typeof entry === 'object';
                const techId = isObj ? entry.techId : undefined;
                assert(isString || (isObj && typeof techId === 'string'), `pavilions[${idx}].poolByPath.${path}[${poolIdx}] must be string or {techId}`);
            });
        });
    });
    assertUniqueIds(pavilions, 'pavilions.json.pavilions');
    return pavilions;
}
function validateOutskirts(config) {
    assertObject(config, 'outskirts.json root');
    assertHasKey(config, 'outskirts', 'outskirts.json');
    assertArray(config.outskirts, 'outskirts.json.outskirts');
    const outskirts = config.outskirts;
    outskirts.forEach((outskirt, idx) => {
        assertObject(outskirt, `outskirts[${idx}]`);
        assert(typeof outskirt.id === 'string', `outskirts[${idx}].id must be a string`);
        assert(typeof outskirt.cityId === 'string', `outskirts[${idx}].cityId must be a string`);
        assert(typeof outskirt.killsToBoss === 'number', `outskirts[${idx}].killsToBoss must be a number`);
        assert(typeof outskirt.bossId === 'string', `outskirts[${idx}].bossId must be a string`);
        assertArray(outskirt.mobPool, `outskirts[${idx}].mobPool`);
    });
    assertUniqueIds(outskirts, 'outskirts.json.outskirts');
    return outskirts;
}
function validateEnemies(config) {
    assertObject(config, 'enemies.json root');
    assertHasKey(config, 'enemies', 'enemies.json');
    assertArray(config.enemies, 'enemies.json.enemies');
    const enemies = config.enemies;
    enemies.forEach((enemy, idx) => {
        assertObject(enemy, `enemies[${idx}]`);
        assert(typeof enemy.id === 'string', `enemies[${idx}].id must be a string`);
        assert(typeof enemy.name === 'string', `enemies[${idx}].name must be a string`);
    });
    assertUniqueIds(enemies, 'enemies.json.enemies');
    return enemies;
}
function validateTrials(config) {
    assertObject(config, 'trials.json root');
    assertHasKey(config, 'trials', 'trials.json');
    assertArray(config.trials, 'trials.json.trials');
    const trials = config.trials;
    trials.forEach((trial, idx) => {
        assertObject(trial, `trials[${idx}]`);
        assert(typeof trial.id === 'string', `trials[${idx}].id must be a string`);
        assert(typeof trial.cityId === 'string', `trials[${idx}].cityId must be a string`);
        assert(typeof trial.bossId === 'string', `trials[${idx}].bossId must be a string`);
        assert(typeof trial.gateItemId === 'string', `trials[${idx}].gateItemId must be a string`);
        if (trial.cityIndex !== undefined) {
            assert(typeof trial.cityIndex === 'number', `trials[${idx}].cityIndex must be a number if provided`);
        }
        if (trial.failSafe) {
            assertObject(trial.failSafe, `trials[${idx}].failSafe`);
            if (trial.failSafe.cost) {
                assertObject(trial.failSafe.cost, `trials[${idx}].failSafe.cost`);
                for (const [k, v] of Object.entries(trial.failSafe.cost)) {
                    if (v == null)
                        continue;
                    assert(typeof v === 'string' || typeof v === 'number', `trials[${idx}].failSafe.cost.${k} must be string or number`);
                    if (!isCurrencyKey(k)) {
                        console.warn(`[ContentValidation] trials[${idx}].failSafe.cost.${k} is not a recognized currency key`);
                    }
                    if (typeof v === 'number') {
                        trial.failSafe.cost[k] = v.toString();
                    }
                }
            }
            if (trial.failSafe.thresholdAttempts !== undefined) {
                assert(typeof trial.failSafe.thresholdAttempts === 'number', `trials[${idx}].failSafe.thresholdAttempts must be a number if provided`);
            }
        }
        if (trial.failSafePurchase) {
            assertObject(trial.failSafePurchase, `trials[${idx}].failSafePurchase`);
            if (trial.failSafePurchase.afterEligibleFails !== undefined) {
                assert(typeof trial.failSafePurchase.afterEligibleFails === 'number', `trials[${idx}].failSafePurchase.afterEligibleFails must be a number if provided`);
            }
            if (trial.failSafePurchase.costRef !== undefined) {
                assert(typeof trial.failSafePurchase.costRef === 'string', `trials[${idx}].failSafePurchase.costRef must be a string if provided`);
            }
            if (trial.failSafePurchase.enabled !== undefined) {
                assert(typeof trial.failSafePurchase.enabled === 'boolean', `trials[${idx}].failSafePurchase.enabled must be a boolean if provided`);
            }
        }
    });
    assertUniqueIds(trials, 'trials.json.trials');
    return trials;
}
function validateRuins(config) {
    assertObject(config, 'ruins.json root');
    assertHasKey(config, 'ruins', 'ruins.json');
    assertArray(config.ruins, 'ruins.json.ruins');
    const ruins = config.ruins;
    const scrubGateItems = (items, label) => {
        return items.filter((entry) => {
            if (typeof entry?.itemId !== 'string')
                return false;
            if (entry.itemId.startsWith('gate_')) {
                console.warn(`[ContentValidation] ${label} removed gate item ${entry.itemId}`);
                return false;
            }
            return true;
        });
    };
    ruins.forEach((ruin, idx) => {
        assertObject(ruin, `ruins[${idx}]`);
        assert(typeof ruin.id === 'string', `ruins[${idx}].id must be a string`);
        assert(typeof ruin.cityId === 'string', `ruins[${idx}].cityId must be a string`);
        assert(typeof ruin.roomCount === 'number', `ruins[${idx}].roomCount must be a number`);
        assertObject(ruin.roomPools, `ruins[${idx}].roomPools`);
        assertArray(ruin.roomPools.mobs, `ruins[${idx}].roomPools.mobs`);
        if (ruin.roomPools.miniBoss) {
            assertArray(ruin.roomPools.miniBoss, `ruins[${idx}].roomPools.miniBoss`);
        }
        if (ruin.roomPools.finalBoss) {
            assertArray(ruin.roomPools.finalBoss, `ruins[${idx}].roomPools.finalBoss`);
        }
        const validateDropTable = (table, label) => {
            assertObject(table, label);
            assert('rolls' in table && typeof table.rolls === 'number', `${label}.rolls must be a number`);
            assertArray(table.pool, `${label}.pool`);
            const poolList = Array.isArray(table.pool) ? table.pool : [];
            table.pool = scrubGateItems(poolList, `${label}.pool`);
            table.pool.forEach((entry, poolIdx) => {
                assert(typeof entry.itemId === 'string', `${label}.pool[${poolIdx}].itemId must be a string`);
                assert(typeof entry.weight === 'number', `${label}.pool[${poolIdx}].weight must be a number`);
                assert(typeof entry.qtyMin === 'number', `${label}.pool[${poolIdx}].qtyMin must be a number`);
                assert(typeof entry.qtyMax === 'number', `${label}.pool[${poolIdx}].qtyMax must be a number`);
            });
            const guaranteedList = Array.isArray(table.guaranteed) ? table.guaranteed : [];
            table.guaranteed = scrubGateItems(guaranteedList, `${label}.guaranteed`);
            table.guaranteed.forEach((entry, gIdx) => {
                assert(typeof entry.itemId === 'string', `${label}.guaranteed[${gIdx}].itemId must be a string`);
                assert(typeof entry.qty === 'number', `${label}.guaranteed[${gIdx}].qty must be a number`);
            });
        };
        assertObject(ruin.dropsPerRoom, `ruins[${idx}].dropsPerRoom`);
        validateDropTable(ruin.dropsPerRoom, `ruins[${idx}].dropsPerRoom`);
        assertObject(ruin.finalChestDrops, `ruins[${idx}].finalChestDrops`);
        validateDropTable(ruin.finalChestDrops, `ruins[${idx}].finalChestDrops`);
    });
    assertUniqueIds(ruins, 'ruins.json.ruins');
    return ruins;
}
function validateRunes(config) {
    assertObject(config, 'runes.json root');
    assertHasKey(config, 'runes', 'runes.json');
    assertArray(config.runes, 'runes.json.runes');
    const runes = config.runes;
    runes.forEach((rune, idx) => {
        assertObject(rune, `runes[${idx}]`);
        assert(typeof rune.id === 'string', `runes[${idx}].id must be a string`);
    });
    assertUniqueIds(runes, 'runes.json.runes');
    return runes;
}
function normalizeHeartLawAffinityRules(raw) {
    if (raw == null) {
        return null;
    }
    if (typeof raw !== 'object' || Array.isArray(raw)) {
        return {};
    }
    const record = raw;
    const normalized = {};
    if (record.matchBonusByTier && typeof record.matchBonusByTier === 'object' && !Array.isArray(record.matchBonusByTier)) {
        const normalizedMatchBonusByTier = {};
        Object.entries(record.matchBonusByTier).forEach(([key, value]) => {
            if (typeof value === 'number' && Number.isFinite(value)) {
                normalizedMatchBonusByTier[key] = value;
            }
        });
        if (Object.keys(normalizedMatchBonusByTier).length > 0) {
            normalized.matchBonusByTier = normalizedMatchBonusByTier;
        }
    }
    if (typeof record.mismatchPenalty === 'number' && Number.isFinite(record.mismatchPenalty)) {
        normalized.mismatchPenalty = record.mismatchPenalty;
    }
    if (typeof record.appliesTo === 'string') {
        const appliesTo = record.appliesTo.trim();
        if (appliesTo.length > 0) {
            normalized.appliesTo = appliesTo;
        }
    }
    return normalized;
}
function validateHeartLaws(config) {
    assertObject(config, 'heart_laws.json root');
    assertHasKey(config, 'heartLaws', 'heart_laws.json');
    assertArray(config.heartLaws, 'heart_laws.json.heartLaws');
    const laws = config.heartLaws;
    assertUniqueIds(laws, 'heart_laws.json.heartLaws');
    return {
        laws,
        affinityRules: normalizeHeartLawAffinityRules(config.affinityRules),
    };
}
function normalizePrereqs(raw, validIds, label) {
    if (!raw)
        return [];
    const entries = Array.isArray(raw) ? raw : [];
    const prereqs = [];
    entries.forEach((entry, idx) => {
        if (typeof entry === 'string') {
            if (!validIds.has(entry)) {
                throw new Error(`[ContentValidation] ${label}.prereq[${idx}] references unknown upgrade '${entry}'`);
            }
            prereqs.push({ upgradeId: entry, minLevel: 1 });
            return;
        }
        if (!entry || typeof entry !== 'object') {
            throw new Error(`[ContentValidation] ${label}.prereq[${idx}] must be a string or object`);
        }
        const record = entry;
        const upgradeId = record.upgradeId;
        const minLevel = record.minLevel;
        if (typeof upgradeId !== 'string' || !upgradeId) {
            throw new Error(`[ContentValidation] ${label}.prereq[${idx}].upgradeId must be a string`);
        }
        if (!validIds.has(upgradeId)) {
            throw new Error(`[ContentValidation] ${label}.prereq[${idx}] references unknown upgrade '${upgradeId}'`);
        }
        if (typeof minLevel !== 'number' || minLevel < 1) {
            throw new Error(`[ContentValidation] ${label}.prereq[${idx}].minLevel must be >= 1`);
        }
        prereqs.push({ upgradeId, minLevel });
    });
    return prereqs;
}
function normalizeCostCurve(raw, label) {
    if (!raw)
        return undefined;
    if (!isObject(raw)) {
        throw new Error(`[ContentValidation] ${label}.costCurve must be an object`);
    }
    const base = raw.base;
    const mult = raw.mult;
    const round = raw.round;
    if (typeof base !== 'number' || base <= 0) {
        throw new Error(`[ContentValidation] ${label}.costCurve.base must be > 0`);
    }
    if (typeof mult !== 'number' || mult < 1) {
        throw new Error(`[ContentValidation] ${label}.costCurve.mult must be >= 1`);
    }
    if (round !== undefined && typeof round !== 'number') {
        throw new Error(`[ContentValidation] ${label}.costCurve.round must be a number`);
    }
    return { base, mult, round };
}
function normalizeTiers(raw, label) {
    if (!raw)
        return undefined;
    assertArray(raw, `${label}.tiers`);
    return raw.map((tier, idx) => {
        if (!tier || typeof tier !== 'object') {
            throw new Error(`[ContentValidation] ${label}.tiers[${idx}] must be an object`);
        }
        if (typeof tier.cost !== 'number') {
            throw new Error(`[ContentValidation] ${label}.tiers[${idx}].cost must be a number`);
        }
        return { cost: tier.cost, effects: tier.effects };
    });
}
function resolveMaxLevel(raw, label) {
    const maxLevel = typeof raw.maxLevel === 'number'
        ? raw.maxLevel
        : typeof raw.levels === 'number'
            ? raw.levels
            : undefined;
    if (maxLevel === undefined) {
        throw new Error(`[ContentValidation] ${label} missing maxLevel/levels`);
    }
    if (maxLevel < 1) {
        throw new Error(`[ContentValidation] ${label}.maxLevel must be >= 1`);
    }
    return maxLevel;
}
function validatePrestige(config) {
    assertObject(config, 'prestige_store.json root');
    assertHasKey(config, 'upgrades', 'prestige_store.json');
    assertArray(config.upgrades, 'prestige_store.json.upgrades');
    const upgrades = config.upgrades;
    assertUniqueIds(upgrades, 'prestige_store.json.upgrades');
    const idSet = new Set(upgrades.map((upgrade) => String(upgrade.id)));
    const normalized = upgrades.map((upgrade, idx) => {
        assertObject(upgrade, `prestige_store.upgrades[${idx}]`);
        const label = `prestige_store.upgrades[${idx}]`;
        const id = upgrade.id;
        if (typeof id !== 'string' || !id) {
            throw new Error(`[ContentValidation] ${label}.id must be a string`);
        }
        if (typeof upgrade.name !== 'string') {
            throw new Error(`[ContentValidation] ${label}.name must be a string`);
        }
        if (typeof upgrade.type !== 'string') {
            throw new Error(`[ContentValidation] ${label}.type must be a string`);
        }
        const labelWithId = `${label} (id=${id})`;
        const maxLevel = resolveMaxLevel(upgrade, labelWithId);
        const costs = Array.isArray(upgrade.costs) ? upgrade.costs : undefined;
        if (costs && costs.length < maxLevel) {
            throw new Error(`[ContentValidation] ${label}.costs must have >= maxLevel entries`);
        }
        const tiers = normalizeTiers(upgrade.tiers, label);
        if (tiers && tiers.length < maxLevel) {
            throw new Error(`[ContentValidation] ${label}.tiers must have >= maxLevel entries`);
        }
        const costCurve = normalizeCostCurve(upgrade.costCurve, label);
        if (!costs && !tiers && !costCurve) {
            throw new Error(`[ContentValidation] ${label} must define costs, tiers, or costCurve`);
        }
        const prereq = normalizePrereqs(upgrade.prereq, idSet, label);
        const effect = upgrade.effect;
        if (effect !== undefined && !isObject(effect)) {
            throw new Error(`[ContentValidation] ${label}.effect must be an object if present`);
        }
        return {
            id,
            name: upgrade.name,
            description: upgrade.description,
            category: upgrade.category,
            type: upgrade.type,
            maxLevel,
            costs,
            tiers,
            costCurve,
            prereq,
            stat: upgrade.stat,
            effectPerLevel: upgrade.effectPerLevel,
            effect: effect,
            unlocks: Array.isArray(upgrade.unlocks) ? upgrade.unlocks : undefined,
            capAt: typeof upgrade.capAt === 'number' ? upgrade.capAt : undefined,
            minMult: typeof upgrade.minMult === 'number' ? upgrade.minMult : undefined,
            order: typeof upgrade.order === 'number' ? upgrade.order : undefined,
        };
    });
    return {
        version: config.version,
        currency: config.currency,
        upgrades: normalized,
    };
}
function validateAlchemy(config) {
    assertObject(config, 'alchemy_recipes.json root');
    assertHasKey(config, 'recipes', 'alchemy_recipes.json');
    assertArray(config.recipes, 'alchemy_recipes.json.recipes');
    return config.recipes;
}
function validateForge(config) {
    assertObject(config, 'forge_blueprints.json root');
    assertHasKey(config, 'blueprints', 'forge_blueprints.json');
    assertArray(config.blueprints, 'forge_blueprints.json.blueprints');
    return config.blueprints;
}
function validateTalismans(config) {
    assertObject(config, 'talisman_recipes.json root');
    assertHasKey(config, 'talismans', 'talisman_recipes.json');
    assertArray(config.talismans, 'talisman_recipes.json.talismans');
    return config.talismans;
}
function normalizePrice(buy, label, addErr) {
    if (!isObject(buy))
        return {};
    const price = {};
    Object.entries(buy).forEach(([key, value]) => {
        if (!isCurrencyKey(key)) {
            addErr(`${label} contains unknown currency '${key}'`);
            return;
        }
        if (typeof value !== 'number' && typeof value !== 'string') {
            addErr(`${label}.${key} must be a number or string`);
            return;
        }
        price[key] = value.toString();
    });
    return price;
}
function validateApothecary(config, addErr) {
    assertObject(config, 'apothecary_shops.json root');
    assertHasKey(config, 'shops', 'apothecary_shops.json');
    assertArray(config.shops, 'apothecary_shops.json.shops');
    const normalized = config.shops.map((shop, idx) => {
        assertObject(shop, `apothecary_shops.shops[${idx}]`);
        assert(typeof shop.id === 'string', `apothecary_shops.shops[${idx}].id must be a string`);
        assert(typeof shop.cityId === 'string', `apothecary_shops.shops[${idx}].cityId must be a string`);
        assertArray(shop.stock, `apothecary_shops.shops[${idx}].stock`);
        const stock = shop.stock.map((entry, stockIdx) => {
            assertObject(entry, `apothecary_shops.shops[${idx}].stock[${stockIdx}]`);
            assert(typeof entry.itemId === 'string', `apothecary_shops.shops[${idx}].stock[${stockIdx}].itemId must be a string`);
            const itemId = entry.itemId;
            const stockId = typeof entry.id === 'string' && entry.id.trim().length > 0
                ? entry.id
                : `${shop.id}:${itemId}`;
            const dailyLimit = entry.dailyLimit === null
                ? null
                : typeof entry.dailyLimit === 'number'
                    ? entry.dailyLimit
                    : undefined;
            const qty = typeof entry.qty === 'number' && Number.isFinite(entry.qty) ? entry.qty : undefined;
            const price = normalizePrice(entry.buy, `apothecary_shops.shops[${idx}].stock[${stockIdx}].buy`, addErr);
            return {
                id: stockId,
                itemId,
                qty,
                price,
                dailyLimit,
            };
        });
        assertUniqueIds(stock, `apothecary_shops.shops[${idx}].stock`);
        return {
            id: shop.id,
            cityId: shop.cityId,
            name: shop.name,
            stock,
        };
    });
    assertUniqueIds(normalized, 'apothecary_shops.shops');
    return normalized;
}
const EMPTY_EXPEDITIONS = {
    durations: [],
    types: [],
    cityYields: [],
};
function validateExpeditions(config) {
    const errors = [];
    if (!config || typeof config !== 'object') {
        console.warn('[ContentValidation] expeditions.json missing or invalid root.');
        return EMPTY_EXPEDITIONS;
    }
    const durations = Array.isArray(config.durations) ? config.durations : null;
    const types = Array.isArray(config.types) ? config.types : null;
    const cityYields = Array.isArray(config.cityYields) ? config.cityYields : null;
    if (!durations)
        errors.push('expeditions.json.durations must be an array');
    if (!types)
        errors.push('expeditions.json.types must be an array');
    if (!cityYields)
        errors.push('expeditions.json.cityYields must be an array');
    if (durations) {
        const ids = new Set();
        durations.forEach((duration, idx) => {
            if (!duration || typeof duration !== 'object') {
                errors.push(`durations[${idx}] must be an object`);
                return;
            }
            if (typeof duration.id !== 'string' || !duration.id.trim()) {
                errors.push(`durations[${idx}].id must be a string`);
            }
            else if (ids.has(duration.id)) {
                errors.push(`durations contains duplicate id ${duration.id}`);
            }
            else {
                ids.add(duration.id);
            }
            if (typeof duration.seconds !== 'number' || duration.seconds <= 0) {
                errors.push(`durations[${idx}].seconds must be > 0`);
            }
            if (!duration.label || typeof duration.label !== 'string') {
                duration.label = duration.id ?? `Duration ${idx + 1}`;
            }
            if (duration.variancePct !== undefined) {
                if (typeof duration.variancePct !== 'number' ||
                    !Number.isFinite(duration.variancePct) ||
                    duration.variancePct < 0 ||
                    duration.variancePct > 0.5) {
                    errors.push(`durations[${idx}].variancePct must be between 0 and 0.5`);
                }
            }
            if (duration.rareChance !== undefined) {
                if (typeof duration.rareChance !== 'number' ||
                    !Number.isFinite(duration.rareChance) ||
                    duration.rareChance < 0 ||
                    duration.rareChance > 1) {
                    errors.push(`durations[${idx}].rareChance must be between 0 and 1`);
                }
            }
        });
    }
    if (types) {
        const ids = new Set();
        types.forEach((entry, idx) => {
            if (!entry || typeof entry !== 'object') {
                errors.push(`types[${idx}] must be an object`);
                return;
            }
            if (typeof entry.id !== 'string' || !entry.id.trim()) {
                errors.push(`types[${idx}].id must be a string`);
            }
            else if (ids.has(entry.id)) {
                errors.push(`types contains duplicate id ${entry.id}`);
            }
            else {
                ids.add(entry.id);
            }
            if (!Array.isArray(entry.yieldTags) || entry.yieldTags.length === 0) {
                errors.push(`types[${idx}].yieldTags must be a non-empty array`);
            }
            if (entry.recommendedModuleKey !== undefined) {
                const allowed = ['apothecary', 'forge', 'manualPavilion'];
                if (!allowed.includes(entry.recommendedModuleKey)) {
                    errors.push(`types[${idx}].recommendedModuleKey must be one of ${allowed.join(', ')}`);
                }
            }
            const liveRoutePurpose = typeof entry.id === 'string' ? getLiveExpeditionRoutePurpose(entry.id) : null;
            if (liveRoutePurpose && entry.recommendedModuleKey !== liveRoutePurpose.moduleKey) {
                errors.push(`types[${idx}].recommendedModuleKey semester route-purpose drift for ${entry.id}: expected ${liveRoutePurpose.moduleKey}`);
            }
            if (entry.rareDrops !== undefined) {
                if (!Array.isArray(entry.rareDrops)) {
                    errors.push(`types[${idx}].rareDrops must be an array if provided`);
                }
                else {
                    entry.rareDrops.forEach((drop, dropIdx) => {
                        if (!drop || typeof drop !== 'object') {
                            errors.push(`types[${idx}].rareDrops[${dropIdx}] must be an object`);
                            return;
                        }
                        if (typeof drop.itemId !== 'string' || !drop.itemId.trim()) {
                            errors.push(`types[${idx}].rareDrops[${dropIdx}].itemId must be a string`);
                        }
                        if (typeof drop.qty !== 'number' || !Number.isFinite(drop.qty) || drop.qty <= 0) {
                            errors.push(`types[${idx}].rareDrops[${dropIdx}].qty must be a positive number`);
                        }
                        if (drop.weight !== undefined) {
                            if (typeof drop.weight !== 'number' || !Number.isFinite(drop.weight) || drop.weight < 0) {
                                errors.push(`types[${idx}].rareDrops[${dropIdx}].weight must be a non-negative number`);
                            }
                        }
                    });
                }
            }
        });
    }
    if (cityYields) {
        cityYields.forEach((entry, idx) => {
            if (!entry || typeof entry !== 'object') {
                errors.push(`cityYields[${idx}] must be an object`);
                return;
            }
            if (typeof entry.cityIndex !== 'number' || entry.cityIndex < 0) {
                errors.push(`cityYields[${idx}].cityIndex must be a non-negative number`);
            }
            if (!entry.yieldsByTag || typeof entry.yieldsByTag !== 'object') {
                errors.push(`cityYields[${idx}].yieldsByTag must be an object`);
            }
            else {
                Object.entries(entry.yieldsByTag).forEach(([tag, bundle]) => {
                    if (!bundle || typeof bundle !== 'object') {
                        errors.push(`cityYields[${idx}].yieldsByTag.${tag} must be an object`);
                        return;
                    }
                    const items = bundle.items;
                    if (items !== undefined && !Array.isArray(items)) {
                        if (items && typeof items === 'object') {
                            errors.push(`cityYields[${idx}].yieldsByTag.${tag}.items expected array but got map. Use Object.entries conversion.`);
                        }
                        else {
                            errors.push(`cityYields[${idx}].yieldsByTag.${tag}.items must be an array`);
                        }
                    }
                });
            }
        });
    }
    if (errors.length > 0) {
        throw new Error(`[ContentValidation] Expeditions content invalid: ${errors.join('; ')}`);
    }
    return {
        durations: durations ?? [],
        types: types ?? [],
        cityYields: cityYields ?? [],
    };
}
function validateBounties(config) {
    assertObject(config, 'bounties.json root');
    assertHasKey(config, 'version', 'bounties.json');
    assertHasKey(config, 'templates', 'bounties.json');
    assertArray(config.templates, 'bounties.json.templates');
    assertHasKey(config, 'rewardTiersByCityIndex', 'bounties.json');
    return config;
}
function buildIdMap(items) {
    return items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {});
}
function validateRecipeItems(record, items, label, addErr) {
    if (!record)
        return;
    Object.keys(record).forEach((itemId) => {
        if (!(itemId in items)) {
            addErr(`${label} references missing item '${itemId}'`);
        }
    });
}
function validateApothecaryGatePrepPackages(options) {
    const { content, addErr } = options;
    content.apothecary_shops.forEach((shop) => {
        const packageDef = getGatePrepPackageForCity(shop.cityId);
        if (!packageDef)
            return;
        const bundle = buildApothecaryCityBundle({
            content,
            shop,
            inventoryItems: {},
            purchasedTodayByStockId: {},
        });
        const coverage = evaluateGatePrepPackageCoverage({ content, shop, bundle, packageDef });
        if (!coverage) {
            addErr(`apothecary gate-prep package missing coverage for ${shop.cityId}`);
            return;
        }
        coverage.lineCoverage.forEach((line) => {
            if (!(line.itemId in buildIdMap(content.items))) {
                addErr(`gate prep package ${packageDef.transitionId} references missing item ${line.itemId}`);
            }
            if (!line.soldDirectly) {
                addErr(`gate prep package ${packageDef.transitionId} direct-core line ${line.itemId} is not sold by ${shop.id}`);
            }
            if (line.dailyLimitCapped && !line.visibleLiveBrew) {
                addErr(`gate prep package ${packageDef.transitionId} line ${line.itemId} exceeds live daily stock without brew support`);
            }
            if (line.exceedsSafeConvenienceShare && !line.visibleLiveBrew) {
                addErr(`gate prep package ${packageDef.transitionId} line ${line.itemId} exceeds 70% of daily limit without brew support`);
            }
        });
        coverage.supplementCoverage.forEach((lane) => {
            if (!lane.honest) {
                addErr(`gate prep package ${packageDef.transitionId} supplement lane ${lane.key} has no visible live support`);
            }
        });
        if (!coverage.honest) {
            addErr(`gate prep package ${packageDef.transitionId} is not economically honest for ${shop.cityId}`);
        }
    });
}
function validateSupportEconomyRuntimeTruth(options) {
    const { content, addErr } = options;
    const reserveTargets = getAllSupportReserveTargets();
    const expectedReserveTargets = [
        { gateIndex: 1, meritIdealReserve: 10, spiritStoneMinimumReserve: 0, spiritStoneIdealReserve: 0 },
        { gateIndex: 2, meritIdealReserve: 15, spiritStoneMinimumReserve: 3, spiritStoneIdealReserve: 5 },
        { gateIndex: 3, meritIdealReserve: 20, spiritStoneMinimumReserve: 8, spiritStoneIdealReserve: 15 },
        { gateIndex: 4, meritIdealReserve: 25, spiritStoneMinimumReserve: 20, spiritStoneIdealReserve: 40 },
        { gateIndex: 5, meritIdealReserve: 35, spiritStoneMinimumReserve: 50, spiritStoneIdealReserve: 100 },
    ];
    if (JSON.stringify(reserveTargets) != JSON.stringify(expectedReserveTargets)) {
        addErr('support reserve targets drifted away from Packet 3.8A');
    }
    const claimExpectations = getAllSupportBountyClaimExpectations();
    if (claimExpectations.length !== 5) {
        addErr(`support bounty claim expectations must cover all five city phases; found ${claimExpectations.length}`);
    }
    const failurePolicies = getAllGateFailureMeritPolicies();
    const expectedFailurePolicies = [
        { gateIndex: 1, eligibleDefeatMerit: 2, minimumMeritReserveLow: 4, minimumMeritReserveHigh: 6 },
        { gateIndex: 2, eligibleDefeatMerit: 3, minimumMeritReserveLow: 6, minimumMeritReserveHigh: 8 },
        { gateIndex: 3, eligibleDefeatMerit: 4, minimumMeritReserveLow: 8, minimumMeritReserveHigh: 10 },
        { gateIndex: 4, eligibleDefeatMerit: 5, minimumMeritReserveLow: 10, minimumMeritReserveHigh: 12 },
        { gateIndex: 5, eligibleDefeatMerit: 7, minimumMeritReserveLow: 14, minimumMeritReserveHigh: 16 },
    ];
    if (JSON.stringify(failurePolicies) !== JSON.stringify(expectedFailurePolicies)) {
        addErr('eligible gate-failure Merit policy drifted away from Packet 3.8A');
    }
    const meritAudit = buildMeritRoleAudit(content);
    if (meritAudit.violations.length > 0) {
        addErr(`visible live Merit sinks must be fail-safe only; found ${meritAudit.violations.map((entry) => entry.id).join(', ')}`);
    }
    const countedSources = getLiveCraftBountyCountedSources().slice().sort().join(',');
    if (countedSources !== ['apothecary_brew_claim', 'forge_claim'].sort().join(',')) {
        addErr(`CRAFT_COMPLETE counted sources drifted: ${countedSources}`);
    }
    const excludedSources = getLiveCraftBountyExcludedSources();
    ['talisman_claim', 'shop_buy', 'deferred_craft'].forEach((source) => {
        if (!excludedSources.includes(source)) {
            addErr(`CRAFT_COMPLETE must exclude ${source}`);
        }
    });
    if (!/forge or Apothecary Brew/i.test(bountyKindToProgressRule('CRAFT_COMPLETE'))) {
        addErr('CRAFT_COMPLETE progress rule must explicitly mention forge or Apothecary Brew claims');
    }
    const liveTemplateKinds = new Set(content.bounties.templates.map((template) => template.kind));
    if (liveTemplateKinds.has('TRIAL_CLEAR')) {
        addErr('live bounty templates must not include TRIAL_CLEAR');
    }
    const craftDestination = resolveBountyDestination({
        cityId: 'city_pinewind_hamlet',
        bountyKind: 'CRAFT_COMPLETE',
        cityModules: ['apothecary'],
        craftRouteSupportState: {
            apothecaryBelowFloor: true,
            forgeBelowFloor: false,
            apothecaryQueueOrStockGap: true,
        },
    });
    if (craftDestination.kind !== 'module' || craftDestination.moduleKey !== 'apothecary') {
        addErr('CRAFT_COMPLETE must remain routable through live Apothecary Brew support when Forge is absent');
    }
    const forgeDestination = resolveBountyDestination({
        cityId: 'city_stonecrag_town',
        bountyKind: 'CRAFT_COMPLETE',
        cityModules: ['apothecary', 'forge'],
        craftRouteSupportState: {
            apothecaryBelowFloor: false,
            forgeBelowFloor: true,
            apothecaryQueueOrStockGap: false,
        },
    });
    if (forgeDestination.kind !== 'module' || forgeDestination.moduleKey !== 'forge') {
        addErr('CRAFT_COMPLETE must remain routable through the live Forge floor when forge support is the honest need');
    }
    if (getExpeditionBountyCreditCityId({ cityId: 'city_stonecrag_town' }) !== 'city_stonecrag_town') {
        addErr('EXPEDITION_COMPLETE credit must remain pinned to expedition origin city');
    }
    const supportModel = buildSupportEconomyReadModelFromState({
        content,
        cityId: 'city_stonecrag_town',
        currencies: { merit: '7', spiritStones: '2', gold: '1000000' },
    });
    if (supportModel.meritMinimumReserveLow !== '6' || supportModel.meritMinimumReserveHigh !== '8') {
        addErr('support economy read model drifted away from the locked minimum Merit reserve band');
    }
    if (supportModel.expectedMeritAfterThreeEligibleDefeats !== '16') {
        addErr('support economy read model drifted away from the locked eligible-failure Merit projection');
    }
}
function validateEconomicRecommendationRuntimeTruth(options) {
    const { content, addErr } = options;
    const prepBudgets = getAllPrepBudgetRegistryEntries();
    if (prepBudgets.length !== 5) {
        addErr(`prep-budget registry must cover all five live transitions; found ${prepBudgets.length}`);
    }
    const expectedTransitions = [
        'qi_condensation_to_foundation',
        'foundation_to_core_formation',
        'core_formation_to_nascent_soul',
        'nascent_soul_to_soul_formation',
        'soul_formation_to_spirit_severing',
    ];
    if (prepBudgets.map((entry) => entry.transitionId).join(',') !== expectedTransitions.join(',')) {
        addErr('prep-budget registry drifted away from the canonical semester transition order');
    }
    const spendPolicies = getAllSpendOrderPolicies();
    if (spendPolicies.length !== 5) {
        addErr(`spend-order policy must expose five gate snapshots; found ${spendPolicies.length}`);
    }
    if (spendPolicies.some((entry) => entry.priorities.length !== 7)) {
        addErr('spend-order policy must preserve all seven priorities');
    }
    if (spendPolicies.some((entry) => entry.pavilionSpendCeilingBeforeResolve <= 0)) {
        addErr('spend-order policy must expose a pavilion spend ceiling for every gate');
    }
    if (spendPolicies.some((entry) => entry.spiritRootRerollSpendCeilingBeforeResolve <= 0)) {
        addErr('spend-order policy must expose a spirit-root reroll spend ceiling for every gate');
    }
    const moduleRoles = getEconomicModuleRoleEntries();
    if (moduleRoles.length !== 8) {
        addErr(`module-role registry must cover eight live economy-facing modules; found ${moduleRoles.length}`);
    }
    const deferredLeaks = getDeferredModuleLeakKeysForModuleRoleRegistry();
    if (deferredLeaks.length > 0) {
        addErr(`module-role registry must not include deferred modules: ${deferredLeaks.join(', ')}`);
    }
    const missingModuleRoles = ['outskirts', 'ruins', 'apothecary', 'forge', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial']
        .filter((moduleKey) => !moduleRoles.some((entry) => entry.moduleKey === moduleKey));
    if (missingModuleRoles.length > 0) {
        addErr(`module-role registry missing economy-facing modules: ${missingModuleRoles.join(', ')}`);
    }
    const expeditionConsistency = getExpeditionPurposeConsistencySummary();
    if (expeditionConsistency.missingModuleRoles.length > 0) {
        addErr(`module-role registry drifted away from expedition route purposes: ${expeditionConsistency.missingModuleRoles.join(', ')}`);
    }
    for (const cityId of SEMESTER_SLICE_CONTRACT.liveCityIds) {
        const city = content.cities.find((entry) => entry.id === cityId);
        if (!city)
            continue;
        const floorSnapshot = buildEconomicStockFloorSnapshot({ gateIndex: city.index + 1, cityId });
        if (!floorSnapshot.cultivationPrepItemId) {
            addErr(`economic stock-floor adapter must resolve a cultivation prep item for ${cityId}`);
        }
    }
    const prepTargets = getPrepEconomyTargets();
    if (prepTargets.isolatedRecoveryCategories.length !== 3) {
        addErr('prep-economy targets must expose all three isolated recovery categories');
    }
    if (Object.keys(prepTargets.recoveryWindowsByGate).length !== 5) {
        addErr('prep-economy recovery windows must cover all five gates');
    }
    const prepFit = buildAllPrepPackageFitReports(content);
    if (prepFit.some((entry) => !entry.honest)) {
        addErr(`prep package fit audit found non-honest packages: ${prepFit.filter((entry) => !entry.honest).map((entry) => entry.transitionId).join(', ')}`);
    }
    const bypassRatios = buildAllPrepVsBypassEconomyReports(content);
    if (bypassRatios.some((entry) => !entry.minimumRatioWithinBand || !entry.recommendedRatioWithinBand || !entry.emergencyOnly)) {
        addErr('prep-vs-bypass economics drifted outside the locked ratio bands or emergency-only policy');
    }
    const reservePacing = buildAllSupportReservePacingReports(content, { merit: 0, spiritStones: 0 });
    if (reservePacing.some((entry) => entry.failSafeThreshold !== 3)) {
        addErr('fail-safe threshold must remain locked at 3 eligible defeats');
    }
    if (reservePacing.some((entry) => !entry.verdicts.reserveGapRoutesToBountiesFirst)) {
        addErr('support reserve-gap routing must keep Bounties as the primary destination');
    }
    if (reservePacing.some((entry) => entry.blockers.length > 0)) {
        addErr(`support reserve pacing blockers detected: ${reservePacing.filter((entry) => entry.blockers.length > 0).map((entry) => `gate_${entry.gateIndex}`).join(', ')}`);
    }
    const phaseSnapshot = buildEconomicPhaseSnapshotFromState({
        content,
        currentCityId: 'city_stonecrag_town',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
        currentRealmIndex: 1,
        selectedPath: 'earth',
        trialProgressById: {},
    });
    if (phaseSnapshot.currentGateIndex !== 2) {
        addErr('economic phase resolver drifted away from the canonical Stonecrag gate index');
    }
    if (phaseSnapshot.nextUnresolvedGateTransition?.toRealmId === 'spirit_severing' && phaseSnapshot.currentGateIndex > 5) {
        addErr('economic phase resolver must not invent a fake gate 6 transition');
    }
}
function validateEconomicSourceRoutingTruth(options) {
    const { content, addErr } = options;
    const index = buildBestSourceIndex(content);
    if (index.scopeTargetIds.length === 0) {
        addErr('best-source index must cover a non-empty live-critical scope');
        return;
    }
    const missingPrimary = index.entries.filter((entry) => !entry.primarySource);
    if (missingPrimary.length > 0) {
        addErr(`best-source index missing primary source for: ${missingPrimary.map((entry) => entry.targetId).join(', ')}`);
    }
    const invalidRoutes = index.entries.flatMap((entry) => entry.sourceOptions.filter((option) => option.moduleKey === 'alchemy'));
    if (invalidRoutes.length > 0) {
        addErr('best-source index must not point at a separate live Alchemy room');
    }
    const deferredLeaks = index.entries.flatMap((entry) => entry.sourceOptions.filter((option) => !['outskirts', 'ruins', 'apothecary', 'forge', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'].includes(option.moduleKey)));
    if (deferredLeaks.length > 0) {
        addErr(`best-source index leaked non-live modules: ${deferredLeaks.map((entry) => entry.moduleKey).join(', ')}`);
    }
    const commonField = index.entriesByTargetId['mat_common_herb_bundle'];
    if (commonField?.primarySource?.sourceKind !== 'outskirts') {
        addErr('common shortages must route to Outskirts first');
    }
    const targeted = index.entriesByTargetId['mat_spirit_leaf'];
    if (targeted?.primarySource?.sourceKind !== 'ruins') {
        addErr('targeted local shortages must route to Ruins first');
    }
    const merit = index.entriesByTargetId['merit'];
    if (merit?.primarySource?.sourceKind !== 'bounties') {
        addErr('Merit reserve gaps must route to Bounties first');
    }
    const spiritStones = index.entriesByTargetId['spiritStones'];
    if (spiritStones?.primarySource?.sourceKind !== 'bounties') {
        addErr('Spirit-stone reserve gaps must route to Bounties first');
    }
    const expeditionMismatch = index.entries.flatMap((entry) => entry.sourceOptions.filter((option) => option.sourceKind === 'expeditions' && option.moduleKey !== 'expeditions'));
    if (expeditionMismatch.length > 0) {
        addErr('expedition-derived best-source entries must preserve expeditionRouteContract module truth');
    }
    const multiFallback = index.entries.flatMap((entry) => entry.sourceOptions.filter((option) => option.locality === 'one_prior_fallback' && option.cityId && content.cities.find((city) => city.id === option.cityId)?.index < 0));
    if (multiFallback.length > 0) {
        addErr('best-source index emitted an invalid backward fallback');
    }
    const sampleRoutes = [
        resolveMissingMaterialRoutes({
            content,
            targetId: 'cons_healing_pellet_t1',
            currentCityId: 'city_pinewind_hamlet',
            unlockedCityIds: ['city_pinewind_hamlet'],
            availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
            shortageQty: 1,
        }),
        resolveMissingMaterialRoutes({
            content,
            targetId: 'mat_spirit_steel_ore',
            currentCityId: 'city_ironpeak_bastion',
            unlockedCityIds: content.cities.map((city) => city.id),
            availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
        }),
    ];
    if (sampleRoutes.some((routes) => routes.some((route) => route.destinationModuleKey === 'alchemy'))) {
        addErr('route resolver must not point to a separate live Alchemy room');
    }
    if (sampleRoutes.some((routes) => routes.some((route) => (route.blockedReason ?? '').includes('multiple older cities')))) {
        addErr('route resolver must not require multiple prior-city fallback hops');
    }
    const missingPolicies = getAllProblemDestinationPolicies().filter((policy) => policy.primaryDestinations.length === 0 || policy.primaryModuleKeys.length === 0);
    if (missingPolicies.length > 0) {
        addErr(`problem destination policy missing primary destinations for: ${missingPolicies.map((policy) => policy.problemKind).join(', ')}`);
    }
}
export function validateLoadedContent(raw) {
    const errors = [];
    const addErr = (msg) => errors.push(`[ContentValidation] ${msg}`);
    // Basic shape validation
    const cities = validateCities(raw.cities);
    const techniques = validateTechniques(raw.techniques);
    const items = validateItems(raw.items);
    const pavilions = validatePavilions(raw.pavilions);
    const outskirts = validateOutskirts(raw.outskirts);
    const enemies = validateEnemies(raw.enemies);
    const trials = validateTrials(raw.trials);
    const ruins = validateRuins(raw.ruins);
    const runes = validateRunes(raw.runes);
    const { laws: heartLaws, affinityRules: heartLawAffinityRules } = validateHeartLaws(raw.heart_laws);
    const prestige = validatePrestige(raw.prestige_store);
    const alchemyRecipes = validateAlchemy(raw.alchemy_recipes);
    const forgeBlueprints = validateForge(raw.forge_blueprints);
    const talismanRecipes = validateTalismans(raw.talisman_recipes);
    const apothecaryShops = validateApothecary(raw.apothecary_shops, addErr);
    const expeditions = validateExpeditions(raw.expeditions);
    const bountyConfig = validateBounties(raw.bounties);
    const normalizedTrials = trials.map((trial) => normalizeTrialFailSafeDefinition(trial, raw.economy));
    // Build maps for cross references
    const cityMap = buildIdMap(cities);
    const itemMap = buildIdMap(items);
    const pavilionMap = buildIdMap(pavilions);
    const outskirtsMap = buildIdMap(outskirts);
    const enemyMap = buildIdMap(enemies);
    const trialMap = buildIdMap(normalizedTrials);
    const ruinMap = buildIdMap(ruins);
    const runeMap = buildIdMap(runes);
    const techniqueMap = buildIdMap(techniques);
    const apothecaryMap = buildIdMap(apothecaryShops);
    const lawMap = buildIdMap(heartLaws);
    const prestigeMap = buildIdMap(prestige.upgrades);
    const bountyTemplateMap = buildIdMap(bountyConfig.templates);
    buildLiveCityPackageRegistry({
        cities,
        outskirtsById: outskirtsMap,
        trialsById: trialMap,
        ruinsById: ruinMap,
        pavilionsById: pavilionMap,
        apothecaryById: apothecaryMap,
    }).coverageIssues.forEach((issue) => addErr(formatLiveCityPackageCoverageIssue(issue)));
    inspectSemesterCityPackageCoverage({
        cities,
        outskirtsById: outskirtsMap,
        trialsById: trialMap,
        ruinsById: ruinMap,
        pavilionsById: pavilionMap,
        apothecaryById: apothecaryMap,
        bounties: bountyConfig,
        expeditions,
    }).forEach((report) => {
        formatCityPackageCoverageReport(report).forEach(addErr);
    });
    apothecaryShops.forEach((shop, idx) => {
        if (!(shop.cityId in cityMap)) {
            addErr(`apothecary_shops.shops[${idx}] cityId does not exist`);
        }
        shop.stock.forEach((stockItem, stockIdx) => {
            if (!(stockItem.itemId in itemMap)) {
                addErr(`apothecary_shops.shops[${idx}].stock[${stockIdx}] missing item`);
            }
        });
    });
    validateApothecaryGatePrepPackages({
        content: {
            raw,
            economy: raw.economy,
            cities,
            items,
            techniques,
            pavilions,
            outskirts,
            enemies,
            trials: normalizedTrials,
            ruins,
            runes,
            talisman_recipes: talismanRecipes,
            alchemy_recipes: alchemyRecipes,
            forge_blueprints: forgeBlueprints,
            apothecary_shops: apothecaryShops,
            expeditions,
            bounties: bountyConfig,
            heart_laws: heartLaws,
            heart_law_affinity_rules: heartLawAffinityRules,
            prestige_store: prestige,
        },
        addErr,
    });
    validateSupportEconomyRuntimeTruth({
        content: {
            raw,
            economy: raw.economy,
            cities,
            items,
            techniques,
            pavilions,
            outskirts,
            enemies,
            trials: normalizedTrials,
            ruins,
            runes,
            talisman_recipes: talismanRecipes,
            alchemy_recipes: alchemyRecipes,
            forge_blueprints: forgeBlueprints,
            apothecary_shops: apothecaryShops,
            expeditions,
            bounties: bountyConfig,
            heart_laws: heartLaws,
            heart_law_affinity_rules: heartLawAffinityRules,
            prestige_store: prestige,
        },
        addErr,
    });
    validateEconomicRecommendationRuntimeTruth({
        content: {
            raw,
            economy: raw.economy,
            cities,
            items,
            techniques,
            pavilions,
            outskirts,
            enemies,
            trials: normalizedTrials,
            ruins,
            runes,
            talisman_recipes: talismanRecipes,
            alchemy_recipes: alchemyRecipes,
            forge_blueprints: forgeBlueprints,
            apothecary_shops: apothecaryShops,
            expeditions,
            bounties: bountyConfig,
            heart_laws: heartLaws,
            heart_law_affinity_rules: heartLawAffinityRules,
            prestige_store: prestige,
        },
        addErr,
    });
    validateEconomicSourceRoutingTruth({
        content: {
            raw,
            economy: raw.economy,
            cities,
            items,
            techniques,
            pavilions,
            outskirts,
            enemies,
            trials: normalizedTrials,
            ruins,
            runes,
            talisman_recipes: talismanRecipes,
            alchemy_recipes: alchemyRecipes,
            forge_blueprints: forgeBlueprints,
            apothecary_shops: apothecaryShops,
            expeditions,
            bounties: bountyConfig,
            heart_laws: heartLaws,
            heart_law_affinity_rules: heartLawAffinityRules,
            prestige_store: prestige,
        },
        addErr,
    });
    pavilions.forEach((pavilion, idx) => {
        if (!(pavilion.cityId in cityMap)) {
            addErr(`pavilions[${idx}].cityId does not exist in cities`);
        }
        ['heaven', 'earth', 'martial'].forEach((path) => {
            const pool = pavilion.poolByPath?.[path] ?? [];
            assertArray(pool, `pavilions[${idx}].poolByPath.${path}`);
            pool.forEach((entry, poolIdx) => {
                const techId = typeof entry === 'string'
                    ? entry
                    : entry && typeof entry === 'object'
                        ? entry.techId
                        : undefined;
                if (techId && !(techId in techniqueMap)) {
                    console.warn(`[ContentValidation] pavilions[${idx}].poolByPath.${path}[${poolIdx}] references unknown technique ${techId}. Will attempt to resolve dynamically.`);
                }
            });
        });
    });
    outskirts.forEach((outskirt, idx) => {
        if (!(outskirt.cityId in cityMap)) {
            addErr(`outskirts[${idx}].cityId missing in cities`);
        }
        if (!(outskirt.bossId in enemyMap)) {
            addErr(`outskirts[${idx}].bossId missing in enemies`);
        }
        outskirt.mobPool.forEach((mob, mobIdx) => {
            assert(typeof mob.enemyId === 'string', `outskirts[${idx}].mobPool[${mobIdx}].enemyId must be string`);
            if (!(mob.enemyId in enemyMap)) {
                addErr(`outskirts[${idx}].mobPool[${mobIdx}].enemyId missing in enemies`);
            }
        });
    });
    normalizedTrials.forEach((trial, idx) => {
        if (!(trial.cityId in cityMap)) {
            addErr(`trials[${idx}].cityId missing in cities`);
        }
        if (!(trial.bossId in enemyMap)) {
            addErr(`trials[${idx}].bossId missing in enemies`);
        }
        if (!(trial.gateItemId in itemMap)) {
            addErr(`trials[${idx}].gateItemId missing in items`);
        }
    });
    ruins.forEach((ruin, idx) => {
        if (!(ruin.cityId in cityMap)) {
            addErr(`ruins[${idx}].cityId missing in cities`);
        }
        const pools = ruin.roomPools;
        pools.mobs.forEach((mobId, mobIdx) => {
            if (!(mobId in enemyMap)) {
                addErr(`ruins[${idx}].roomPools.mobs[${mobIdx}] missing in enemies`);
            }
        });
        (pools.miniBoss ?? []).forEach((mobId, mobIdx) => {
            if (!(mobId in enemyMap)) {
                addErr(`ruins[${idx}].roomPools.miniBoss[${mobIdx}] missing in enemies`);
            }
        });
        (pools.finalBoss ?? []).forEach((mobId, mobIdx) => {
            if (!(mobId in enemyMap)) {
                addErr(`ruins[${idx}].roomPools.finalBoss[${mobIdx}] missing in enemies`);
            }
        });
        const validateDropTableItems = (table, label) => {
            table.pool.forEach((entry, poolIdx) => {
                if (!(entry.itemId in itemMap)) {
                    addErr(`${label}.pool[${poolIdx}] missing item in items`);
                }
            });
            (table.guaranteed ?? []).forEach((entry, gIdx) => {
                if (!(entry.itemId in itemMap)) {
                    addErr(`${label}.guaranteed[${gIdx}] missing item in items`);
                }
            });
        };
        validateDropTableItems(ruin.dropsPerRoom, `ruins[${idx}].dropsPerRoom`);
        validateDropTableItems(ruin.finalChestDrops, `ruins[${idx}].finalChestDrops`);
    });
    alchemyRecipes.forEach((recipe, idx) => {
        if (!(recipe.unlocksAtCityId in cityMap)) {
            addErr(`alchemy_recipes.recipes[${idx}].unlocksAtCityId missing in cities`);
        }
        validateRecipeItems(recipe.inputs, itemMap, `alchemy_recipes.recipes[${idx}].inputs`, addErr);
        validateRecipeItems(recipe.outputs, itemMap, `alchemy_recipes.recipes[${idx}].outputs`, addErr);
    });
    forgeBlueprints.forEach((blueprint, idx) => {
        if (!(blueprint.unlocksAtCityId in cityMap)) {
            addErr(`forge_blueprints.blueprints[${idx}].unlocksAtCityId missing in cities`);
        }
        validateRecipeItems(blueprint.inputs, itemMap, `forge_blueprints.blueprints[${idx}].inputs`, addErr);
        validateRecipeItems(blueprint.outputs, { ...itemMap, ...runeMap }, `forge_blueprints.blueprints[${idx}].outputs`, addErr);
        assertCostOrItemRefsExist(blueprint.cost, `forge_blueprints.blueprints[${idx}].cost`, itemMap, addErr);
        validateForgeBlueprintStepScript(blueprint, `forge_blueprints.blueprints[${idx}]`, addErr);
    });
    talismanRecipes.forEach((talisman, idx) => {
        if (!(talisman.unlocksAtCityId in cityMap)) {
            addErr(`talisman_recipes.talismans[${idx}].unlocksAtCityId missing in cities`);
        }
        validateRecipeItems(talisman.inputs, itemMap, `talisman_recipes.talismans[${idx}].inputs`, addErr);
        validateRecipeItems(talisman.outputs, itemMap, `talisman_recipes.talismans[${idx}].outputs`, addErr);
        assertCostOrItemRefsExist(talisman.cost, `talisman_recipes.talismans[${idx}].cost`, itemMap, addErr);
    });
    bountyConfig.templates.forEach((template, idx) => {
        assert(typeof template.id === 'string', `bounties.templates[${idx}].id must be a string`);
    });
    const rewardTierKeys = Object.keys(bountyConfig.rewardTiersByCityIndex ?? {});
    const rewardTierIndices = rewardTierKeys
        .map((key) => Number(key))
        .filter((idx) => Number.isFinite(idx));
    const maxCityIndex = Math.max(0, ...cities.map((city) => city.index));
    for (let idx = 0; idx <= maxCityIndex; idx += 1) {
        if (!rewardTierIndices.includes(idx)) {
            console.warn(`[ContentValidation] bounties.rewardTiersByCityIndex missing city index ${idx}`);
        }
    }
    // City pavilion sanity for first 5 cities
    cities
        .filter((city) => city.index <= 4)
        .forEach((city) => {
        const pavilion = pavilionMap[city.refs.pavilionId];
        assert(pavilion, `City ${city.id} missing pavilion ${city.refs.pavilionId}`);
        ['heaven', 'earth', 'martial'].forEach((path) => {
            assert(path in pavilion.poolByPath, `Pavilion ${pavilion.id} missing path ${path}`);
            assert(Array.isArray(pavilion.poolByPath[path]) && pavilion.poolByPath[path].length > 0, `Pavilion ${pavilion.id} path ${path} pool is empty`);
        });
    });
    const techniquesByPath = { heaven: 0, earth: 0, martial: 0 };
    techniques.forEach((tech) => {
        if (tech.path in techniquesByPath) {
            techniquesByPath[tech.path] += 1;
        }
    });
    console.warn('[ContentValidation] Technique counts by path:', `Heaven=${techniquesByPath.heaven}, Earth=${techniquesByPath.earth}, Martial=${techniquesByPath.martial}`);
    cities
        .filter((city) => city.index <= 4)
        .forEach((city) => {
        const pavilion = pavilionMap[city.refs.pavilionId];
        if (!pavilion)
            return;
        ['heaven', 'earth', 'martial'].forEach((path) => {
            const size = pavilion.poolByPath?.[path]?.length ?? 0;
            console.warn(`[ContentValidation] Pavilion pool size city=${city.index} (${city.id}) path=${path}: ${size}`);
        });
    });
    // Additional references for runes and heart laws to ensure maps used
    Object.keys(lawMap);
    Object.keys(prestigeMap);
    Object.keys(bountyTemplateMap);
    const liveEconomyCatalog = buildLiveEconomyCatalog({ items, alchemy_recipes: alchemyRecipes, forge_blueprints: forgeBlueprints, cities });
    const liveForgeCatalog = buildLiveForgeCatalog({ forge_blueprints: forgeBlueprints, cities });
    const forgeLadderAudit = buildForgeLadderAudit({ forge_blueprints: forgeBlueprints, cities });
    alchemyRecipes.forEach((recipe, idx) => {
        const status = liveEconomyCatalog.alchemyRecipeStatusById[recipe.id] ?? 'unknown';
        if (status !== 'visible_live')
            return;
        Object.keys(recipe.outputs ?? {}).forEach((itemId) => {
            const itemStatus = liveEconomyCatalog.itemStatusById[itemId] ?? 'unknown';
            if (itemStatus !== 'visible_live') {
                addErr(`alchemy_recipes.recipes[${idx}] visible live recipe outputs non-live item '${itemId}' (${itemStatus})`);
            }
        });
    });
    const visibleRuneOutputToBlueprintIds = new Map();
    forgeBlueprints.forEach((blueprint, idx) => {
        const status = liveEconomyCatalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown';
        if (status !== 'visible_live')
            return;
        Object.keys(blueprint.outputs ?? {}).forEach((itemId) => {
            const itemStatus = liveEconomyCatalog.itemStatusById[itemId] ?? 'unknown';
            if (itemStatus !== 'visible_live') {
                addErr(`forge_blueprints.blueprints[${idx}] visible live blueprint outputs non-live item '${itemId}' (${itemStatus})`);
            }
            if (itemId.startsWith('rune_')) {
                const list = visibleRuneOutputToBlueprintIds.get(itemId) ?? [];
                list.push(blueprint.id);
                visibleRuneOutputToBlueprintIds.set(itemId, list);
            }
        });
    });
    visibleRuneOutputToBlueprintIds.forEach((blueprintIds, itemId) => {
        const canonical = blueprintIds.filter((id) => id.startsWith('forge_rune_'));
        const legacy = blueprintIds.filter((id) => id.startsWith('rune_inscription_'));
        if (canonical.length > 0 && legacy.length > 0) {
            addErr(`visible rune family drift remains for '${itemId}': canonical=${canonical.join(', ')} legacy=${legacy.join(', ')}`);
        }
    });
    LIVE_REFINE_LADDER_IDS.forEach((id) => {
        if (!liveForgeCatalog.entriesById[id] || liveForgeCatalog.entriesById[id].status !== 'visible_live') {
            addErr(`live forge refine ladder missing visible tier '${id}'`);
        }
    });
    LIVE_TEMPER_LADDER_IDS.forEach((id) => {
        if (!liveForgeCatalog.entriesById[id] || liveForgeCatalog.entriesById[id].status !== 'visible_live') {
            addErr(`live forge temper ladder missing visible tier '${id}'`);
        }
    });
    Object.entries(LIVE_RUNE_CITY_PAIRS).forEach(([cityId, ids]) => {
        ids.forEach((id) => {
            if (!liveForgeCatalog.entriesById[id] || liveForgeCatalog.entriesById[id].status !== 'visible_live') {
                addErr(`live forge rune ladder missing '${id}' for city '${cityId}'`);
            }
        });
    });
    const visibleForgeFamilies = Array.from(new Set(Object.values(liveForgeCatalog.entriesById)
        .filter((entry) => entry.status === 'visible_live')
        .map((entry) => entry.familyLabel)));
    if (visibleForgeFamilies.some((label) => !['Refine', 'Temper', 'Runes'].includes(label))) {
        addErr(`live forge visibility leaked non-semester family: ${visibleForgeFamilies.join(', ')}`);
    }
    DEFERRED_FORGE_BLUEPRINT_IDS.forEach((id) => {
        if (liveForgeCatalog.entriesById[id]?.status === 'visible_live') {
            addErr(`deferred forge blueprint '${id}' leaked into live visibility`);
        }
    });
    LEGACY_RUNE_BLUEPRINT_IDS.forEach((id) => {
        if (liveForgeCatalog.entriesById[id]?.status === 'visible_live') {
            addErr(`legacy rune blueprint '${id}' leaked into live forge visibility`);
        }
    });
    if (!forgeLadderAudit.spiritDewSinkIds.includes('forge_temper_accessory_t1')) {
        addErr('spirit_dew no longer resolves to visible accessory temper t1 sink');
    }
    ['forge_temper_weapon_t2', 'forge_temper_accessory_t2', 'forge_temper_weapon_t3', 'forge_temper_accessory_t3'].forEach((id) => {
        if (!forgeLadderAudit.artifactShardSinkIds.includes(id)) {
            addErr(`artifact_shard missing visible temper sink '${id}'`);
        }
    });
    if (forgeLadderAudit.lateRefineArtifactShardCounts.forge_refine_uncommon_t3 !== 1)
        addErr('forge_refine_uncommon_t3 must consume 1 mat_artifact_shard');
    if (forgeLadderAudit.lateRefineArtifactShardCounts.forge_refine_rare_t4 !== 2)
        addErr('forge_refine_rare_t4 must consume 2 mat_artifact_shard');
    if (forgeLadderAudit.lateRefineArtifactShardCounts.forge_refine_legendary_t5 !== 4)
        addErr('forge_refine_legendary_t5 must consume 4 mat_artifact_shard');
    const visibleForgeByCity = cities.map((city) => ({
        cityId: city.id,
        count: Object.values(liveForgeCatalog.entriesById).filter((entry) => entry.cityId === city.id && entry.status === 'visible_live').length,
    }));
    visibleForgeByCity.forEach((entry) => {
        if (entry.count === 0)
            addErr(`city '${entry.cityId}' has no visible live forge pressure`);
    });
    const visibleForgeOutputToBlueprintIds = new Map();
    Object.values(liveForgeCatalog.entriesById).forEach((entry) => {
        if (entry.status !== 'visible_live')
            return;
        Object.keys(entry.blueprint.outputs ?? {}).forEach((itemId) => {
            const ids = visibleForgeOutputToBlueprintIds.get(itemId) ?? [];
            ids.push(entry.blueprintId);
            visibleForgeOutputToBlueprintIds.set(itemId, ids);
        });
    });
    visibleForgeOutputToBlueprintIds.forEach((ids, outputId) => {
        if (ids.length > 1)
            addErr(`visible forge output '${outputId}' is duplicated across blueprints: ${ids.join(', ')}`);
    });
    const liveEconomyReport = buildLiveEconomyAuditReport({
        raw,
        economy: raw.economy,
        cities,
        items,
        techniques,
        pavilions,
        outskirts,
        enemies,
        trials: normalizedTrials,
        ruins,
        alchemy_recipes: alchemyRecipes,
        forge_blueprints: forgeBlueprints,
        runes,
        talisman_recipes: talismanRecipes,
        apothecary_shops: apothecaryShops,
        expeditions,
        bounties: bountyConfig,
        heart_laws: heartLaws,
        heart_law_affinity_rules: heartLawAffinityRules,
        prestige_store: prestige,
    });
    const targetedMaterialAudit = buildTargetedMaterialSinkAudit({
        raw,
        economy: raw.economy,
        cities,
        items,
        techniques,
        pavilions,
        outskirts,
        enemies,
        trials: normalizedTrials,
        ruins,
        alchemy_recipes: alchemyRecipes,
        forge_blueprints: forgeBlueprints,
        runes,
        talisman_recipes: talismanRecipes,
        apothecary_shops: apothecaryShops,
        expeditions,
        bounties: bountyConfig,
        heart_laws: heartLaws,
        heart_law_affinity_rules: heartLawAffinityRules,
        prestige_store: prestige,
    });
    const expectedBlockerIds = listKnownLiveEconomyBlockers().map((entry) => entry.id).sort();
    const actualBlockerIds = liveEconomyReport.activeBlockerIds.slice().sort();
    if (expectedBlockerIds.length > 0 || actualBlockerIds.length > 0) {
        addErr(`Packet 3.1 blocker registry must be empty: expected=${expectedBlockerIds.join(', ')} actual=${actualBlockerIds.join(', ')}`);
    }
    const packet36AMaterialSinkStatus = getPacket36AMaterialSinkStatus(liveEconomyReport);
    if (!packet36AMaterialSinkStatus.mat_spirit_dew.hasVisibleLiveSink) {
        addErr('Packet 3.6A named blocker unresolved: mat_spirit_dew has no visible live sink');
    }
    if (!packet36AMaterialSinkStatus.mat_artifact_shard.hasVisibleLiveSink) {
        addErr('Packet 3.6A named blocker unresolved: mat_artifact_shard has no visible live sink');
    }
    getSinklessLiveMaterials(liveEconomyReport).forEach((entry) => {
        addErr(`live material '${entry.itemId}' has no visible live sink`);
    });
    liveEconomyReport.reagentPathAudits.forEach((entry) => {
        if (entry.missingDependencyIds.length === 0)
            return;
        addErr(`visible live reagent path missing for '${entry.blueprintId}': ${entry.missingDependencyIds.join(', ')}`);
    });
    const spiritDewAudit = getLiveEconomyItemAuditById(liveEconomyReport, 'mat_spirit_dew');
    if ((spiritDewAudit?.liveSinks.length ?? 0) === 0) {
        addErr('Packet 3.6A named blocker unresolved: mat_spirit_dew does not route into any visible live sink');
    }
    const artifactShardAudit = getLiveEconomyItemAuditById(liveEconomyReport, 'mat_artifact_shard');
    if ((artifactShardAudit?.liveSinks.length ?? 0) === 0) {
        addErr('Packet 3.6A named blocker unresolved: mat_artifact_shard does not route into any visible live sink');
    }
    const quenchingOilRecipe = alchemyRecipes.filter((recipe) => recipe.id === 'alc_reagent_quenching_oil_t2');
    if (quenchingOilRecipe.length !== 1) {
        addErr(`Packet 3.6A requires exactly one alc_reagent_quenching_oil_t2 recipe, found ${quenchingOilRecipe.length}`);
    }
    else {
        const [recipe] = quenchingOilRecipe;
        if ((liveEconomyCatalog.alchemyRecipeStatusById[recipe.id] ?? 'unknown') !== 'visible_live') {
            addErr('Packet 3.6A requires alc_reagent_quenching_oil_t2 to remain visible_live');
        }
        if ((recipe.timeSec ?? 0) !== 240) {
            addErr('Packet 3.6A requires alc_reagent_quenching_oil_t2 to run at 240 seconds');
        }
        const inputIds = Object.keys(recipe.inputs ?? {}).sort();
        if (inputIds.join(',') !== ['mat_furnace_cinder', 'mat_thunder_sand'].join(',')) {
            addErr(`Packet 3.6A requires alc_reagent_quenching_oil_t2 to use only mat_furnace_cinder and mat_thunder_sand; found ${inputIds.join(', ')}`);
        }
    }
    if (!hasVisibleLiveReagentPath(liveEconomyReport, 'forge_refine_legendary_t5', 'reagent_quenching_oil_t2')) {
        addErr('Packet 3.6A named blocker unresolved: forge_refine_legendary_t5 lacks a visible live reagent_quenching_oil_t2 path');
    }
    const legendaryPathAudit = getLiveReagentPathAuditByBlueprintId(liveEconomyReport, 'forge_refine_legendary_t5');
    if ((legendaryPathAudit?.missingDependencyIds ?? []).includes('reagent_quenching_oil_t2')) {
        addErr('Packet 3.6A named blocker unresolved: forge_refine_legendary_t5 still reports missing reagent_quenching_oil_t2');
    }
    targetedMaterialAudit.entries.forEach((entry) => {
        if (!entry.hasVisibleLiveSink) {
            addErr(`Packet 3.6 targeted material '${entry.materialId}' has no visible live sink`);
        }
        if (entry.onlyHiddenOrDeferred) {
            addErr(`Packet 3.6 targeted material '${entry.materialId}' resolves only to hidden/deferred sink paths: ${entry.hiddenOrDeferredSinkIds.join(', ')}`);
        }
        if (entry.onlyDuplicateNoisy) {
            addErr(`Packet 3.6 targeted material '${entry.materialId}' resolves only to duplicate-noisy visible outputs`);
        }
    });
    forgeBlueprints.forEach((blueprint) => {
        const family = getForgeBlueprintFamily(blueprint);
        const status = liveEconomyCatalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown';
        if (family === 'hidden-other' && LEGACY_RUNE_BLUEPRINT_IDS.includes(blueprint.id) && status === 'visible_live') {
            addErr(`legacy rune blueprint '${blueprint.id}' is still visible live`);
        }
    });
    const activityRewardAudit = buildActivityRewardAuditReport({
        economy: raw.economy,
        outskirts,
        ruins,
    });
    activityRewardAudit.cities.forEach((cityAudit) => {
        if (cityAudit.outskirts.goldPosture !== 'primary') {
            addErr(`outskirts '${cityAudit.outskirts.cityId}' lost its gold-engine posture`);
        }
        if (cityAudit.outskirts.commonFieldHits.length < Math.min(3, cityAudit.outskirts.commonPool.length)) {
            addErr(`outskirts '${cityAudit.outskirts.cityId}' no longer reads as common-field-first`);
        }
        if (cityAudit.outskirts.targetedLeakageInCommon.length > 0) {
            addErr(`outskirts '${cityAudit.outskirts.cityId}' common pool leaks targeted/anchor materials: ${cityAudit.outskirts.targetedLeakageInCommon.join(', ')}`);
        }
        if (cityAudit.outskirts.anchorLeakage.length > 0) {
            addErr(`outskirts '${cityAudit.outskirts.cityId}' includes deterministic ruin anchor items: ${cityAudit.outskirts.anchorLeakage.join(', ')}`);
        }
        if (cityAudit.outskirts.targetedRareSpikes.length === 0) {
            addErr(`outskirts '${cityAudit.outskirts.cityId}' lost all intentional local rare spikes`);
        }
        if (cityAudit.ruins.goldPosture !== 'secondary') {
            addErr(`ruins '${cityAudit.ruins.cityId}' lost its secondary gold posture`);
        }
        if (!cityAudit.ruins.hasDeterministicAnchor) {
            addErr(`ruins '${cityAudit.ruins.cityId}' missing deterministic anchor '${cityAudit.ruins.deterministicAnchorItemId}'`);
        }
        if (cityAudit.ruins.leadMaterialsInRooms.length === 0) {
            addErr(`ruins '${cityAudit.ruins.cityId}' room drops lost local targeted-material identity`);
        }
        if (cityAudit.ruins.targetedMaterialsInChest.length === 0) {
            addErr(`ruins '${cityAudit.ruins.cityId}' final chest lost targeted-material identity`);
        }
        if (!cityAudit.ruins.rarePityConfigured) {
            addErr(`ruins '${cityAudit.ruins.cityId}' boss chest pity is not configured`);
        }
    });
    const rewardParityAudit = buildRewardParityAuditReport({
        economy: raw.economy,
        outskirts,
        ruins,
    });
    rewardParityAudit.cities.forEach((cityAudit) => {
        cityAudit.rules.forEach((rule) => {
            if (!rule.passed) {
                addErr(`reward parity drift for '${cityAudit.cityId}' (${rule.ruleId}): ${rule.detail}`);
            }
        });
    });
    if (errors.length > 0) {
        const body = errors
            .slice(0, 100)
            .map((e) => `- ${e}`)
            .join('\n');
        throw new Error(`[ContentValidation] ${errors.length} issue(s) found:\n${body}`);
    }
    return {
        raw,
        economy: raw.economy,
        cities,
        items,
        techniques,
        pavilions,
        outskirts,
        enemies,
        trials: normalizedTrials,
        ruins,
        alchemy_recipes: alchemyRecipes,
        forge_blueprints: forgeBlueprints,
        runes,
        talisman_recipes: talismanRecipes,
        apothecary_shops: apothecaryShops,
        expeditions,
        bounties: bountyConfig,
        heart_laws: heartLaws,
        heart_law_affinity_rules: heartLawAffinityRules,
        prestige_store: prestige,
    };
}
