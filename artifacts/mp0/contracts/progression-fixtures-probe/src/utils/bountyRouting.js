import { getLiveExpeditionRoutePurpose } from '../systems/world/expeditionRouteContract.js';
import { normalizeCityModulesForLiveSlice } from '../systems/world/liveWorldSchema.js';
const LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES = {
    forge_claim: { counts: true, label: 'Forge claim' },
    apothecary_brew_claim: { counts: true, label: 'Apothecary Brew claim' },
    talisman_claim: { counts: false, label: 'Talisman claim' },
    shop_buy: { counts: false, label: 'Shop buy' },
    deferred_craft: { counts: false, label: 'Deferred craft module claim' },
};
function hasModule(cityModules, moduleKey) {
    return Array.isArray(cityModules) && cityModules.includes(moduleKey);
}
export function resolveBountyDestination(args) {
    const { cityId, bountyKind, cityModules } = args;
    const modules = normalizeCityModulesForLiveSlice(cityModules);
    if (bountyKind.startsWith('OUTSKIRTS_')) {
        return hasModule(modules, 'outskirts')
            ? { kind: 'module', moduleKey: 'outskirts', cityId }
            : { kind: 'unavailable', cityId, reason: 'Outskirts unavailable' };
    }
    if (bountyKind.startsWith('RUINS_')) {
        return hasModule(modules, 'ruins')
            ? { kind: 'module', moduleKey: 'ruins', cityId }
            : { kind: 'unavailable', cityId, reason: 'Ruins unavailable' };
    }
    if (bountyKind === 'EXPEDITION_COMPLETE') {
        return hasModule(modules, 'expeditions')
            ? { kind: 'module', moduleKey: 'expeditions', cityId }
            : { kind: 'unavailable', cityId, reason: 'Expeditions unavailable' };
    }
    if (bountyKind === 'CRAFT_COMPLETE') {
        const craftRouteSupportState = normalizeCraftBountyRouteSupportState(cityId, args.craftRouteSupportState);
        if (hasModule(modules, 'apothecary') && !hasModule(modules, 'forge')) {
            return { kind: 'module', moduleKey: 'apothecary', cityId, reason: 'Apothecary Brew is the only live craft support route here.' };
        }
        if (hasModule(modules, 'forge') && !hasModule(modules, 'apothecary')) {
            return { kind: 'module', moduleKey: 'forge', cityId, reason: 'Forge is the only live craft support route here.' };
        }
        if (hasModule(modules, 'apothecary') && craftRouteSupportState.apothecaryBelowFloor) {
            return { kind: 'module', moduleKey: 'apothecary', cityId, reason: 'Apothecary prep stock is below the live support floor.' };
        }
        if (hasModule(modules, 'forge') && craftRouteSupportState.forgeBelowFloor) {
            return { kind: 'module', moduleKey: 'forge', cityId, reason: 'Forge floor is below the next gate recommendation.' };
        }
        if (hasModule(modules, 'apothecary') && craftRouteSupportState.apothecaryQueueOrStockGap) {
            return { kind: 'module', moduleKey: 'apothecary', cityId, reason: 'Apothecary Brew has the live prep gap for this craft support bounty.' };
        }
        if (hasModule(modules, 'forge')) {
            return { kind: 'module', moduleKey: 'forge', cityId, reason: 'Forge remains the fallback craft support route.' };
        }
        if (hasModule(modules, 'apothecary')) {
            return { kind: 'module', moduleKey: 'apothecary', cityId, reason: 'Apothecary Brew remains the fallback craft support route.' };
        }
        return { kind: 'unavailable', cityId, reason: 'Forge or Apothecary unavailable' };
    }
    return { kind: 'unavailable', cityId, reason: 'Unknown bounty kind' };
}
export function bountyKindToLabel(kind) {
    switch (kind) {
        case 'OUTSKIRTS_KILL':
            return 'Outskirts Hunt';
        case 'OUTSKIRTS_BOSS_KILL':
            return 'Outskirts Boss';
        case 'RUINS_ROOM_CLEAR':
            return 'Ruins Room Clear';
        case 'RUINS_RUN_CLEAR':
            return 'Ruins Run';
        case 'CRAFT_COMPLETE':
            return 'Craft Support';
        case 'EXPEDITION_COMPLETE':
            return 'Expedition';
        default:
            return kind;
    }
}
export function bountyKindToProgressRule(kind) {
    switch (kind) {
        case 'OUTSKIRTS_KILL':
            return 'Defeat enemies in the outskirts.';
        case 'OUTSKIRTS_BOSS_KILL':
            return 'Defeat outskirts bosses.';
        case 'RUINS_ROOM_CLEAR':
            return 'Clear rooms in the ruins.';
        case 'RUINS_RUN_CLEAR':
            return 'Complete ruins runs.';
        case 'CRAFT_COMPLETE':
            return 'Claim completed forge or Apothecary Brew jobs.';
        case 'EXPEDITION_COMPLETE':
            return 'Claim completed expeditions (1 per run).';
        default:
            return 'Progress the associated activity.';
    }
}
export function getBountyDestinationCtaLabel(destination) {
    if (!destination)
        return 'View Bounties';
    if (destination.kind === 'unavailable')
        return 'View Bounties';
    switch (destination.moduleKey) {
        case 'outskirts':
            return 'Open Outskirts';
        case 'ruins':
            return 'Open Ruins';
        case 'forge':
            return 'Open Forge';
        case 'apothecary':
            return 'Open Apothecary';
        case 'expeditions':
            return 'Open Expeditions';
        case 'bounties':
            return 'View Bounties';
        default:
            return 'View Bounties';
    }
}
export function resolveExpeditionUseMaterialsDestinations(args) {
    const { cityId, expeditionTypeId, cityModules, recommendedModuleKey } = args;
    const modules = normalizeCityModulesForLiveSlice([...cityModules]);
    const canonicalModuleKey = getLiveExpeditionRoutePurpose(expeditionTypeId)?.moduleKey ?? null;
    const orderedCandidates = [recommendedModuleKey, canonicalModuleKey]
        .filter((moduleKey, index, values) => Boolean(moduleKey) && values.indexOf(moduleKey) === index);
    return orderedCandidates
        .filter((moduleKey) => hasModule(modules, moduleKey))
        .map((moduleKey) => ({ cityId, moduleKey }));
}
export function doesLiveCraftBountySourceCount(source) {
    return LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].counts;
}
export function getLiveCraftBountyCountedSources() {
    return Object.keys(LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES).filter((source) => LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].counts);
}
export function getLiveCraftBountyExcludedSources() {
    return Object.keys(LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES).filter((source) => !LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].counts);
}
export function getLiveCraftBountySourceLabel(source) {
    return LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].label;
}
export function getExpeditionBountyCreditCityId(run) {
    return run.cityId;
}
export function normalizeCraftBountyRouteSupportState(_cityId, override) {
    return {
        apothecaryBelowFloor: override?.apothecaryBelowFloor ?? false,
        forgeBelowFloor: override?.forgeBelowFloor ?? false,
        apothecaryQueueOrStockGap: override?.apothecaryQueueOrStockGap ?? false,
    };
}
