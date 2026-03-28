import { useGameStore } from '../../stores/gameStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { formatNumber, D } from '../../utils/numbers.js';
import { formatOfflineDuration, MAX_OFFLINE_MS, resolveOfflineCultivationEfficiency } from './offlineShared.js';
import { cultivationService } from '../cultivationService.js';
import { buildCultivationConsumableCarryoverWindows } from '../../systems/consumables/cultivationConsumableEffects.js';
import { getHeartLawBonuses } from '../../systems/heartLaw/heartLawLogic.js';
import { getExpeditionReadinessDelta, getQueuedActionReadinessDelta } from '../../systems/offline/offlineSummaryReadModel.js';
function getLiveOfflineEfficiency() {
    const prestigeStore = usePrestigeStore.getState();
    const cultivationStore = useCultivationStore.getState();
    const heartLawId = cultivationStore.selectedHeartLawId;
    const heartLawDef = heartLawId ? useContentStore.getState().maps.heartLawsById[heartLawId] ?? null : null;
    const heartLawBonus = getHeartLawBonuses({
        heartLawDef,
        chapter: cultivationStore.chapter,
        spiritRoot: prestigeStore.spiritRoot,
    }).offlineEfficiencyAdd;
    return resolveOfflineCultivationEfficiency({
        prestigeEfficiencyAdd: prestigeStore.getOfflineEfficiencyBonusAdditive(),
        heartLawBonus,
    });
}
function calculateOfflineQiGain(startAt, endAt, offlineEfficiency) {
    if (offlineEfficiency <= 0 || endAt <= startAt)
        return D(0);
    const cultivation = useCultivationStore.getState();
    const gameStore = useGameStore.getState();
    cultivation.clearExpiredCultivationConsumables(startAt);
    const readModel = cultivation.getCultivationConsumableReadModel(startAt);
    const currentQiPerSecond = D(gameStore.qiPerSecond ?? '0');
    const baseQiPerSecond = readModel.modifiers.qiRateMult > 0
        ? currentQiPerSecond.dividedBy(readModel.modifiers.qiRateMult)
        : currentQiPerSecond;
    return buildCultivationConsumableCarryoverWindows(cultivation.activeCultivationConsumables, startAt, endAt)
        .reduce((total, window) => {
        const seconds = window.elapsedMs / 1000;
        return total.plus(baseQiPerSecond.times(window.modifiers.qiRateMult).times(seconds).times(offlineEfficiency));
    }, D(0));
}
export function apply(context) {
    if (context.dtMs <= 0) {
        return { summary: null };
    }
    const seconds = Math.floor(Math.min(context.dtMs, MAX_OFFLINE_MS) / 1000);
    const summaryParts = [];
    const startAt = context.now - seconds * 1000;
    const gameStore = useGameStore.getState();
    useGameStore.setState({ lastActiveTime: context.now, lastTickTime: context.now });
    const offlineEfficiency = getLiveOfflineEfficiency();
    const qiGain = calculateOfflineQiGain(startAt, context.now, offlineEfficiency);
    if (qiGain.greaterThan(0)) {
        const nextQi = D(gameStore.qi ?? '0').plus(qiGain);
        useGameStore.setState({ qi: nextQi.toString() });
        summaryParts.push({ kind: 'qi_gained', label: 'Qi gained', value: formatNumber(qiGain) });
    }
    cultivationService.applyOfflineProgress(seconds * 1000, startAt, context.now);
    const professionStore = useProfessionStore.getState();
    const beforeQueueSnapshot = {
        alchemyQueue: [...professionStore.alchemyQueue],
        talismanQueue: [...professionStore.talismanQueue],
        forgeQueue: [...professionStore.forgeQueue],
    };
    professionStore.applyOffline(context.now);
    const afterProfessionStore = useProfessionStore.getState();
    const queuedReadiness = getQueuedActionReadinessDelta({
        before: beforeQueueSnapshot,
        after: {
            alchemyQueue: afterProfessionStore.alchemyQueue,
            talismanQueue: afterProfessionStore.talismanQueue,
            forgeQueue: afterProfessionStore.forgeQueue,
        },
        beforeAt: startAt,
        afterAt: context.now,
    });
    if (queuedReadiness.newlyReady > 0) {
        summaryParts.push({
            kind: 'queued_actions',
            label: 'Queued actions ready',
            value: `${queuedReadiness.newlyReady}`,
        });
    }
    const expeditionStore = useExpeditionStore.getState();
    const beforeExpeditionSnapshot = { active: expeditionStore.active.map((run) => ({ ...run })) };
    expeditionStore.tick(context.now);
    const afterExpeditionStore = useExpeditionStore.getState();
    const expeditionReadiness = getExpeditionReadinessDelta({
        before: beforeExpeditionSnapshot,
        after: { active: afterExpeditionStore.active },
        beforeAt: startAt,
        afterAt: context.now,
    });
    if (expeditionReadiness.newlyComplete > 0) {
        summaryParts.push({ kind: 'expeditions', label: 'Expeditions ready', value: `${expeditionReadiness.newlyComplete}` });
    }
    return {
        summary: {
            offlineSeconds: seconds,
            offlineDuration: formatOfflineDuration(seconds),
            efficiency: offlineEfficiency,
            wasCapped: context.wasCapped,
            parts: summaryParts,
        },
    };
}
