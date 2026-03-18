import type { MigrationFieldTouch, MigrationStep, PlannedMutation } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import {
  createPrestigeClassificationHooks,
  DEFERRED_PRESTIGE_REFUND_COSTS,
} from '../../../../systems/progression/contract/prestigeContract.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';

export const v2_0_0_plan_deferred_prestige_refund: MigrationStep = {
  id: 'v2_0_0_plan_deferred_prestige_refund',
  title: 'Plan deferred prestige refund',
  description: 'Detect deferred prestige purchases and compute refund totals for packet 1.6.',
  kind: 'plannedTransform',
  ownerPacket: '1.6',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 60,
  appliesTo: (save) => isRecord(save.prestigeState),
  run: (save) => {
    const next = cloneSave(save);
    const hooks = createPrestigeClassificationHooks();
    const prestigeState = isRecord(next.prestigeState) ? next.prestigeState : {};
    const purchases = isRecord(prestigeState.purchasesById) ? (prestigeState.purchasesById as Record<string, unknown>) : {};

    const warnings = [];
    const touched: MigrationFieldTouch[] = [];
    const plannedMutations: PlannedMutation[] = [];
    const purchasedNodeIds: string[] = [];
    const refundByNode: Record<string, number> = {};
    let totalRefundAP = 0;

    Object.entries(purchases).forEach(([nodeId, rawCount]) => {
      const count = typeof rawCount === 'number' ? rawCount : 0;
      if (count <= 0 || hooks.classifyNode(nodeId) !== 'deferred') return;
      const refund = (DEFERRED_PRESTIGE_REFUND_COSTS as Record<string, number | undefined>)[nodeId] ?? count;
      purchasedNodeIds.push(nodeId);
      refundByNode[nodeId] = refund;
      totalRefundAP += refund;
      touched.push(touch(`prestigeState.purchasesById.${nodeId}`, 'inspect', `Deferred node purchased at count ${count}. refund=${refund}`));
      plannedMutations.push(
        plan(`prestigeState.purchasesById.${nodeId}`, '1.6', `Refund ${refund} AP and clear deferred prestige purchase ${nodeId}.`, 'delete'),
      );
    });

    if (purchasedNodeIds.length > 0) {
      warnings.push(
        warning('DEFERRED_PRESTIGE_PURCHASE_PRESENT', `Deferred prestige purchases found: ${purchasedNodeIds.join(', ')}.`, '1.6', 'warning', 'prestigeState.purchasesById'),
        warning('PRESTIGE_REFUND_PLAN_READY', `Refund plan ready: totalRefundAP=${totalRefundAP}; refundByNode=${JSON.stringify(refundByNode)}.`, '1.6', 'info', 'prestigeState.purchasesById'),
      );
      plannedMutations.push(plan('prestigeState.currentRunAP', '1.6', `Add deferred prestige refund total ${totalRefundAP} AP.`));
    }

    return createStepResult(
      v2_0_0_plan_deferred_prestige_refund,
      next,
      purchasedNodeIds.length > 0
        ? `Deferred prestige refund planned for ${purchasedNodeIds.length} node(s); totalRefundAP=${totalRefundAP}.`
        : 'No deferred prestige purchases detected.',
      { warnings, touchedFieldPaths: touched, plannedMutations },
    );
  },
};
