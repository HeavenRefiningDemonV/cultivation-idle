import type { MigrationFieldTouch, MigrationStep, PlannedMutation } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';

const GATE_ITEM_ALIASES: Record<string, string> = {
  foundation_pill: 'gate_foundation_pill',
  core_catalyst: 'gate_core_catalyst',
  core_stabilizer: 'gate_core_stabilizer',
  soul_condensate: 'gate_soul_condensate',
};

export const v2_0_0_plan_gate_item_alias_migration: MigrationStep = {
  id: 'v2_0_0_plan_gate_item_alias_migration',
  title: 'Plan legacy gate item alias migration',
  description: 'Detect legacy gate item IDs in save containers and report canonical remap plan for packet 1.3.',
  kind: 'plannedTransform',
  ownerPacket: '1.3',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 40,
  appliesTo: (save) => isRecord(save.inventoryState) && isRecord((save.inventoryState as Record<string, unknown>).items),
  run: (save) => {
    const next = cloneSave(save);
    const items = isRecord(next.inventoryState) && isRecord(next.inventoryState.items)
      ? (next.inventoryState.items as Record<string, unknown>)
      : {};

    const warnings = [];
    const touched: MigrationFieldTouch[] = [];
    const plannedMutations: PlannedMutation[] = [];
    const found: string[] = [];

    Object.entries(GATE_ITEM_ALIASES).forEach(([legacyId, canonicalId]) => {
      const qty = typeof items[legacyId] === 'number' ? items[legacyId] : 0;
      if (qty <= 0) return;
      found.push(`${legacyId} x${qty}`);
      touched.push(touch(`inventoryState.items.${legacyId}`, 'inspect', `Legacy gate item qty ${qty}.`));
      plannedMutations.push(
        plan(`inventoryState.items.${legacyId}`, '1.3', `Remap ${legacyId} to ${canonicalId} while preserving quantity ${qty}.`, 'move'),
        plan(`inventoryState.items.${canonicalId}`, '1.3', `Create/update canonical gate item ${canonicalId} by quantity ${qty}.`, 'set'),
      );
    });

    if (found.length > 0) {
      warnings.push(
        warning('LEGACY_GATE_ITEM_ALIAS_PRESENT', `Legacy gate item aliases found: ${found.join(', ')}.`, '1.3', 'warning', 'inventoryState.items'),
        warning('CANONICAL_GATE_ID_PLAN_READY', 'Canonical gate item ID migration plan is ready for packet 1.3.', '1.3', 'info', 'inventoryState.items'),
      );
    }

    return createStepResult(
      v2_0_0_plan_gate_item_alias_migration,
      next,
      found.length > 0 ? `Planned gate item alias migration for ${found.length} legacy gate item IDs.` : 'No legacy gate item aliases detected.',
      { warnings, touchedFieldPaths: touched, plannedMutations },
    );
  },
};
