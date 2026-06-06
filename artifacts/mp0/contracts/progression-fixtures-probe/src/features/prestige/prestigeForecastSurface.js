import { REALMS } from '../../constants/index.js';
import { getPrestigeResetContractSurface } from '../../services/prestige/PrestigeResetContract.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { buildPrestigeProgressionSnapshot, calculatePrestigeApForecast, countResolvedSemesterGateTrials, extractLiveTrialIds, } from '../../systems/prestige/prestigeApReadModel.js';
import { buildPrestigeStarterSpendPlan } from '../../systems/prestige/prestigeStarterSpendPlanner.js';
import { getPrestigeRuntimeCatalog, getPrestigeNodeRuntimeStatus, } from '../../systems/prestige/runtime/prestigeRuntimeCatalog.js';
import { getPrestigeAdvisorSurface } from './prestigeAdvisorSurface.js';
const titleCase = (value) => value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
const formatDurationRange = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0)
        return 'unknown';
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60)
        return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
};
const formatPercent = (value) => `${Math.round(value * 100)}%`;
const buildForecastSnapshot = () => {
    const game = useGameStore.getState();
    const prestige = usePrestigeStore.getState();
    const trialProgressById = useTrialStore.getState().progressByTrialId;
    const content = useContentStore.getState().raw;
    const liveTrialIds = extractLiveTrialIds(content?.trials);
    const resolvedGateCount = countResolvedSemesterGateTrials({ progressByTrialId: trialProgressById, liveTrialIds });
    const snapshot = buildPrestigeProgressionSnapshot({
        currentRealmIndex: game.realm?.index ?? 0,
        currentSubstage: game.realm?.substage ?? 1,
        highestRealmReached: prestige.highestRealmReached,
        resolvedGateCount,
    });
    return calculatePrestigeApForecast(snapshot);
};
const mapAdvisorState = (atContentCap, label) => {
    if (label === 'Too Early')
        return 'too_early';
    if (atContentCap)
        return 'chapter_exhausted';
    if (label === 'Recommended')
        return 'recommended';
    return 'viable';
};
const buildAdvisorCopy = (state) => {
    if (state === 'too_early') {
        return {
            label: 'Too Early',
            detail: 'This life has not reached a strong reincarnation point. Push toward Core Formation or a resolved gate before sealing the ledger.',
        };
    }
    if (state === 'viable') {
        return {
            label: 'Viable',
            detail: 'Reincarnation is possible. Continuing may improve AP, but the next life would already reclaim old ground faster.',
        };
    }
    if (state === 'chapter_exhausted') {
        return {
            label: 'Chapter Exhausted',
            detail: 'You have reached the current authored climb. Reincarnation is the intended continuation.',
        };
    }
    return {
        label: 'Recommended',
        detail: 'This life has reached a rational handoff. Seal the ledger and begin a faster ascent.',
    };
};
const getNextCost = (costs, currentLevel) => {
    const cost = costs?.[currentLevel];
    return typeof cost === 'number' && Number.isFinite(cost) ? cost : null;
};
const runtimeHonestyFromStatus = (status) => {
    if (status === 'visible_live')
        return 'live';
    if (status === 'deferred')
        return 'deferred';
    if (status === 'hidden_unsupported')
        return 'unsupported_hidden';
    return 'unknown_blocked';
};
const buildRecommendedPurchases = (apBudget) => {
    const content = useContentStore.getState().raw;
    if (!content?.prestige_store)
        return [];
    const prestige = usePrestigeStore.getState();
    const effectiveApBudget = Math.max(0, Math.floor(apBudget ?? prestige.totalAP));
    const catalog = getPrestigeRuntimeCatalog(content);
    const visibleUpgrades = catalog.visibleLiveNodes.map((node) => node.upgrade);
    const plan = buildPrestigeStarterSpendPlan({
        apBudget: effectiveApBudget,
        purchasedLevels: prestige.purchasesById,
        visibleUpgrades,
    });
    return plan.orderedPlan.slice(0, 3).flatMap((candidate) => {
        const node = catalog.nodeById[candidate.id];
        if (!node || node.status !== 'visible_live')
            return [];
        const status = getPrestigeNodeRuntimeStatus(candidate.id, content);
        const cost = candidate.nextCost ?? getNextCost(node.upgrade.costs, candidate.currentLevel);
        if (cost === null)
            return [];
        return [{
                id: `recommend_${candidate.id}`,
                upgradeId: candidate.id,
                label: node.upgrade.name,
                cost,
                currentLevel: candidate.currentLevel,
                nextLevel: candidate.currentLevel + 1,
                affordance: cost <= effectiveApBudget ? 'buy_now' : 'save_for_next',
                reason: candidate.reasonLine,
                runtimeHonesty: runtimeHonestyFromStatus(status),
            }];
    });
};
const buildRetainedEffects = () => {
    const prestige = usePrestigeStore.getState();
    const content = useContentStore.getState().raw;
    const rows = [];
    const qiBonus = prestige.getQiMultiplier() - 1;
    if (qiBonus > 0) {
        rows.push({
            id: 'idle_qi_memory',
            label: `Idle Qi memory +${formatPercent(qiBonus)}`,
            detail: 'Purchased Qi decrees are consumed by the live cultivation multiplier.',
            sourceNodeId: 'ap_idle_qi_mult',
            runtimeConsumer: 'qi_multiplier',
            confidence: 'high',
        });
    }
    const combatBonus = prestige.getCombatMultiplier() - 1;
    if (combatBonus > 0) {
        rows.push({
            id: 'combat_memory',
            label: `Combat memory +${formatPercent(combatBonus)}`,
            detail: 'Purchased combat decrees are consumed by the live combat stat calculation.',
            sourceNodeId: 'ap_combat_mult',
            runtimeConsumer: 'combat_multiplier',
            confidence: 'high',
        });
    }
    const offlineBonus = prestige.getOfflineEfficiencyBonusAdditive();
    if (offlineBonus > 0) {
        rows.push({
            id: 'offline_memory',
            label: `Offline efficiency memory +${formatPercent(offlineBonus)}`,
            detail: 'Offline catchup consumes this additive bonus in the single catchup pipeline.',
            sourceNodeId: 'ap_offline_efficiency',
            runtimeConsumer: 'offline_efficiency',
            confidence: 'high',
        });
    }
    const hybrid = getPrestigeResetContractSurface({ purchasesById: prestige.purchasesById }).hybrid
        .find((line) => line.id === 'mastery_retention_active');
    if (hybrid) {
        rows.push({
            id: 'mastery_memory',
            label: hybrid.label,
            detail: hybrid.detail,
            sourceNodeId: Object.keys(prestige.purchasesById).find((id) => id.includes('mastery_retention')),
            runtimeConsumer: 'mastery_retention',
            confidence: 'high',
        });
    }
    const heartLawNode = content ? getPrestigeRuntimeCatalog(content).visibleLiveNodeIds.find((id) => id.startsWith('ap_unlock_heartlaw') && (prestige.purchasesById[id] ?? 0) > 0) : null;
    if (heartLawNode) {
        rows.push({
            id: 'heart_law_unlocks',
            label: 'Heart Law decree tiers unlocked',
            detail: 'Purchased tiers are recomputed by the prestige effect bridge after reset.',
            sourceNodeId: heartLawNode,
            runtimeConsumer: 'heart_law_unlock',
            confidence: 'medium',
        });
    }
    return rows;
};
const estimateReclaimSpeedup = () => {
    const prestige = usePrestigeStore.getState();
    const qi = Math.max(0, prestige.getQiMultiplier() - 1);
    const combat = Math.max(0, prestige.getCombatMultiplier() - 1);
    const offline = Math.max(0, prestige.getOfflineEfficiencyBonusAdditive());
    const hasMastery = Object.keys(prestige.purchasesById).some((id) => id.includes('mastery_retention'));
    const memory = prestige.prestigeRuns.length > 0 ? 0.08 : 0;
    return Math.min(0.45, qi * 0.65 + combat * 0.45 + offline * 0.12 + (hasMastery ? 0.1 : 0) + memory);
};
const buildReclaimForecast = () => {
    const prestige = usePrestigeStore.getState();
    const lastRun = prestige.prestigeRuns.at(-1);
    const speedup = estimateReclaimSpeedup();
    if (!lastRun || lastRun.timeSpent <= 0) {
        return [{
                id: 'foundation_reclaim_unknown',
                label: 'Early reclaim estimate',
                previous: 'No prior Foundation time recorded',
                expectedNext: speedup > 0 ? 'Faster than first life, exact time unmeasured' : 'No speed bonus measured yet',
                reason: 'Forecast uses current AP bonuses and target envelopes only.',
                confidence: 'low',
            }];
    }
    const low = lastRun.timeSpent * Math.max(0.45, 1 - speedup * 1.15);
    const high = lastRun.timeSpent * Math.max(0.55, 1 - speedup * 0.65);
    const realmName = REALMS[Math.max(0, Math.min(REALMS.length - 1, lastRun.realmReached))]?.name ?? 'prior milestone';
    return [
        {
            id: 'prior_realm_reclaim',
            label: `${realmName} reclaim`,
            previous: `Previous life: ${formatDurationRange(lastRun.timeSpent)}`,
            expectedNext: speedup > 0
                ? `${formatDurationRange(low)}-${formatDurationRange(high)}`
                : 'Similar pace until a live decree is purchased',
            reason: speedup > 0
                ? 'AP Qi/combat/offline decrees and route memory should compress early-life reclaim without skipping gates.'
                : 'No live speed decree is active yet; route familiarity is the only assumed advantage.',
            confidence: speedup > 0 ? 'medium' : 'low',
        },
    ];
};
export const buildPostResetObjectivePreview = () => {
    const game = useGameStore.getState();
    const prestige = usePrestigeStore.getState();
    const forecast = buildForecastSnapshot();
    const topPurchase = buildRecommendedPurchases(prestige.totalAP + Math.max(0, forecast.totalAp))[0];
    if (!game.selectedPath) {
        return {
            id: 'choose_path',
            label: 'Choose the next life path',
            detail: 'A new life should first choose a cultivation path; reclaim guidance waits for that identity.',
            route: { kind: 'tab', tabId: 'cultivation', anchor: 'path' },
        };
    }
    if (topPurchase?.affordance === 'buy_now') {
        return {
            id: 'buy_first_decree',
            label: `Consider ${topPurchase.label}`,
            detail: `${topPurchase.cost} AP for Lv ${topPurchase.nextLevel}. ${topPurchase.reason}`,
            route: { kind: 'tab', tabId: 'prestige', anchor: topPurchase.upgradeId },
        };
    }
    const hasPriorLife = prestige.prestigeCount > 0 || prestige.prestigeRuns.length > 0;
    return {
        id: hasPriorLife ? 'reclaim_foundation' : 'establish_first_route',
        label: hasPriorLife ? 'Reclaim old ground' : 'Establish the first route',
        detail: hasPriorLife
            ? 'Choose path and doctrine, then reclaim the first gate with retained decrees and prior route memory.'
            : 'Build a clean first-life route before treating reincarnation as the main objective.',
        route: { kind: 'tab', tabId: 'cultivation', anchor: 'threshold' },
    };
};
export function buildPrestigeForecastSurfaceV2() {
    const prestige = usePrestigeStore.getState();
    const content = useContentStore.getState().raw;
    const advisor = getPrestigeAdvisorSurface();
    const forecast = buildForecastSnapshot();
    const potentialGain = Math.max(0, forecast.totalAp);
    const availableAfterRitual = prestige.totalAP + potentialGain;
    const advisorState = mapAdvisorState(forecast.snapshot.atContentCap, advisor.stateLabel);
    const copy = buildAdvisorCopy(advisorState);
    const resetContract = getPrestigeResetContractSurface({ purchasesById: prestige.purchasesById });
    const recommendedPurchases = buildRecommendedPurchases(availableAfterRitual);
    const warnings = [
        'Offline progress does not progress combat.',
    ];
    if (!content?.prestige_store) {
        warnings.push('Prestige content is still loading; decree recommendations are unavailable.');
    }
    if (advisorState === 'too_early') {
        warnings.push('Reincarnation is locked until the prestige unlock realm is reached.');
    }
    if (forecast.totalAp <= 0) {
        warnings.push('Potential AP gain is zero; resetting now would not create meaningful permanent progress.');
    }
    return {
        version: 2,
        advisorState,
        advisorLabel: copy.label,
        advisorDetail: copy.detail,
        ap: {
            currentAvailable: prestige.totalAP,
            potentialGain,
            afterRitual: availableAfterRitual,
            lifetimeAP: prestige.lifetimeAP,
            breakdownRows: prestige.getApBreakdown().rows.map((row) => ({ ...row })),
        },
        resetBuckets: resetContract.reset,
        carryBuckets: resetContract.carry,
        rebuiltBuckets: resetContract.rebuilt,
        hybridBuckets: resetContract.hybrid,
        retainedEffects: buildRetainedEffects(),
        recommendedPurchases,
        reclaimForecast: buildReclaimForecast(),
        postResetObjective: buildPostResetObjectivePreview(),
        warnings,
        debugNotes: [
            `Advisor source label: ${advisor.stateLabel}.`,
            `Runtime prestige nodes visible: ${content ? getPrestigeRuntimeCatalog(content).visibleLiveNodeIds.length : 0}.`,
            `Spirit root preview is rebuilt, not carried: ${prestige.spiritRoot ? titleCase(prestige.spiritRoot.element) : 'none'}.`,
        ],
    };
}
