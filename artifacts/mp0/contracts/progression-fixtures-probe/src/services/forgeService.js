import { useEquipmentStore } from '../stores/equipmentStore.js';
import { useGameStore } from '../stores/gameStore.js';
import { selectTemperAffix } from '../content/temperAffixes.js';
import { randFloat, nextSeed } from '../utils/rng.js';
function cloneStats(stats) {
    return { ...stats };
}
function deriveToolBonus() {
    const tools = useEquipmentStore.getState().forgeToolTiers;
    const hammerBonus = Math.max(0, (tools.hammer - 1) * 0.5);
    const bellowsBonus = Math.max(0, (tools.bellows - 1) * 0.25);
    return hammerBonus + bellowsBonus;
}
export function applyRefineService(options) {
    const equipmentStore = useEquipmentStore.getState();
    const gameStore = useGameStore.getState();
    const before = cloneStats(gameStore.stats);
    const effect = options.blueprint.effect ?? {};
    const addLevel = typeof effect.addLevel === 'number' ? effect.addLevel : 1;
    const maxLevelCap = typeof effect.maxLevelCap === 'number' ? effect.maxLevelCap : undefined;
    const result = equipmentStore.applyRefineFromForge(options.slot, options.qty, { addLevel, maxLevelCap });
    gameStore.calculatePlayerStats();
    const after = cloneStats(gameStore.stats);
    return {
        type: 'refine',
        slot: options.slot,
        applied: result.ok ? result.applied : 0,
        capped: result.ok ? result.capped : false,
        success: result.ok,
        beforeStats: before,
        afterStats: after,
    };
}
export function applyTemperService(options) {
    const equipmentStore = useEquipmentStore.getState();
    const gameStore = useGameStore.getState();
    const before = cloneStats(gameStore.stats);
    const effect = options.blueprint.effect ?? {};
    const baseChance = typeof effect.baseProcChancePct === 'number' ? effect.baseProcChancePct : 25;
    const allowedAffixes = Array.isArray(effect.affixPool)
        ? effect.affixPool.filter((id) => typeof id === 'string')
        : undefined;
    let chancePct = baseChance + (options.bonusChancePct ?? 0) + deriveToolBonus();
    chancePct = Math.max(0, Math.min(100, chancePct));
    let currentSeed = options.seed;
    let success = false;
    let appliedAffix = null;
    for (let i = 0; i < Math.max(1, options.qty); i += 1) {
        const roll = randFloat(currentSeed);
        currentSeed = roll.seed ?? nextSeed(currentSeed);
        const rollValue = roll.value * 100;
        if (rollValue <= chancePct) {
            success = true;
            appliedAffix = selectTemperAffix(currentSeed, allowedAffixes);
            equipmentStore.applyTemperAffix(options.slot, appliedAffix);
            currentSeed = nextSeed(currentSeed);
            break;
        }
    }
    if (success) {
        gameStore.calculatePlayerStats();
    }
    const after = cloneStats(gameStore.stats);
    return {
        type: 'temper',
        slot: options.slot,
        success,
        affix: appliedAffix,
        beforeStats: before,
        afterStats: after,
        procChancePct: chancePct,
    };
}
