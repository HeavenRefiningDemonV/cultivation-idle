import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { getPrestigeNodeRuntimeStatus, getPrestigeRefundAmount, isRefundableHiddenPrestigeNode, } from '../../../../systems/progression/contract/prestigeContract.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';
export const v2_0_0_plan_deferred_prestige_refund = {
    id: 'v2_0_0_plan_deferred_prestige_refund',
    title: 'Refund hidden prestige purchases',
    description: 'Refund hidden prestige purchases, clear them from save truth, and keep dry-run reporting transparent for packet 1.6.',
    kind: 'transform',
    ownerPacket: '1.6',
    fromVersionRange: { min: CURRENT_SAVE_VERSION },
    toVersion: CURRENT_SAVE_VERSION,
    priority: 60,
    appliesTo: (save) => isRecord(save.prestigeState),
    run: (save) => {
        const next = cloneSave(save);
        const prestigeState = isRecord(next.prestigeState) ? next.prestigeState : {};
        const purchases = isRecord(prestigeState.purchasesById) ? prestigeState.purchasesById : {};
        const warnings = [];
        const touched = [];
        const plannedMutations = [];
        const purchasedNodeIds = [];
        const hiddenStatusesByNode = {};
        const refundByNode = {};
        let totalRefundAP = 0;
        let didMutate = false;
        Object.entries(purchases).forEach(([nodeId, rawCount]) => {
            const count = typeof rawCount === 'number' ? rawCount : 0;
            if (count <= 0 || !isRefundableHiddenPrestigeNode(nodeId))
                return;
            const refund = getPrestigeRefundAmount(nodeId, count);
            const status = getPrestigeNodeRuntimeStatus(nodeId);
            purchasedNodeIds.push(nodeId);
            hiddenStatusesByNode[nodeId] = status;
            refundByNode[nodeId] = refund;
            totalRefundAP += refund;
            touched.push(touch(`prestigeState.purchasesById.${nodeId}`, 'inspect', `Hidden prestige node purchased at count ${count}. status=${status}. refund=${refund}`));
            plannedMutations.push(plan(`prestigeState.purchasesById.${nodeId}`, '1.6', `Refund ${refund} AP and clear hidden prestige purchase ${nodeId} (${status}).`, 'delete'));
            delete purchases[nodeId];
            didMutate = true;
        });
        if (purchasedNodeIds.length > 0) {
            const currentTotalAP = typeof prestigeState.totalAP === 'number' ? prestigeState.totalAP : 0;
            prestigeState.totalAP = currentTotalAP + totalRefundAP;
            touched.push(touch('prestigeState.totalAP', 'set', `Refund hidden prestige spendable AP by ${totalRefundAP}.`));
            plannedMutations.push(plan('prestigeState.totalAP', '1.6', `Restore ${totalRefundAP} refunded AP to spendable totalAP.`));
            warnings.push(warning('HIDDEN_PRESTIGE_PURCHASE_PRESENT', `Hidden prestige purchases found: ${purchasedNodeIds.join(', ')}; statuses=${JSON.stringify(hiddenStatusesByNode)}.`, '1.6', 'warning', 'prestigeState.purchasesById'), warning('PRESTIGE_REFUND_PLAN_READY', `Refund plan ready: totalRefundAP=${totalRefundAP}; refundByNode=${JSON.stringify(refundByNode)}.`, '1.6', 'info', 'prestigeState.purchasesById'));
        }
        return createStepResult(v2_0_0_plan_deferred_prestige_refund, next, purchasedNodeIds.length > 0
            ? `Hidden prestige refund applied for ${purchasedNodeIds.length} node(s); totalRefundAP=${totalRefundAP}; refundedNodeIds=${purchasedNodeIds.join(', ')}.`
            : 'No hidden prestige purchases detected.', { warnings, touchedFieldPaths: touched, plannedMutations, didMutate });
    },
};
