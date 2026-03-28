import { nextSeed, randFloat } from '../utils/rng.js';
const BASE_AFFIX_POOL = [
    { id: 'boss_damage_pct', label: 'Bonus vs bosses', stat: 'atkPct', valuePct: 0.05 },
    { id: 'crit_chance_pct', label: 'Critical chance', stat: 'critPct', valuePct: 0.03 },
    { id: 'defense_pct', label: 'Guarded frame', stat: 'defPct', valuePct: 0.04 },
    { id: 'hp_pct', label: 'Sturdy frame', stat: 'hpPct', valuePct: 0.04 },
    { id: 'status_resist', label: 'Status resistance', stat: 'dodgePct', valuePct: 0.02 },
];
export function listTemperAffixes() {
    return BASE_AFFIX_POOL;
}
export function selectTemperAffix(seed, allowedIds) {
    const pool = allowedIds && allowedIds.length > 0
        ? BASE_AFFIX_POOL.filter((affix) => allowedIds.includes(affix.id))
        : BASE_AFFIX_POOL;
    const safePool = pool.length > 0 ? pool : BASE_AFFIX_POOL;
    let currentSeed = seed;
    const roll = randFloat(currentSeed);
    currentSeed = roll.seed ?? nextSeed(currentSeed);
    const index = Math.floor(roll.value * safePool.length) % safePool.length;
    return safePool[index];
}
