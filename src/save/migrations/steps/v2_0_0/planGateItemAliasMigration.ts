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
  title: 'Normalize legacy gate item aliases',
  description: 'Detect legacy gate item IDs in save containers and remap them to canonical gate_* IDs for packet 1.3.',
  kind: 'transform',
  ownerPacket: '1.3',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 40,
  appliesTo: (save) => isRecord(save.inventoryState) && isRecord((save.inventoryState as Record<string, unknown>).items),
  run: (save, ctx) => {
    const next = cloneSave(save);
    const inventoryState = isRecord(next.inventoryState) ? next.inventoryState : null;
    const items = inventoryState && isRecord(inventoryState.items)
      ? (inventoryState.items as Record<string, unknown>)
      : null;

    const warnings = [];
    const touched: MigrationFieldTouch[] = [];
    const plannedMutations: PlannedMutation[] = [];
    const found: string[] = [];
    let didMutate = false;

    if (!items) {
      return createStepResult(
        v2_0_0_plan_gate_item_alias_migration,
        next,
        'No legacy gate item aliases detected.',
        { warnings, touchedFieldPaths: touched, plannedMutations },
      );
    }

    Object.entries(GATE_ITEM_ALIASES).forEach(([legacyId, canonicalId]) => {
      const legacyQty = typeof items[legacyId] === 'number' ? items[legacyId] : 0;
      if (legacyQty <= 0) return;

      const canonicalQty = typeof items[canonicalId] === 'number' ? items[canonicalId] : 0;
      found.push(`${legacyId} x${legacyQty}`);
      touched.push(
        touch(`inventoryState.items.${legacyId}`, ctx.mode === 'apply' ? 'delete' : 'inspect', `Legacy gate item qty ${legacyQty}.`),
        touch(`inventoryState.items.${canonicalId}`, ctx.mode === 'apply' ? 'set' : 'inspect', `Canonical gate item will total ${canonicalQty + legacyQty}.`),
      );
      plannedMutations.push(
        plan(`inventoryState.items.${legacyId}`, '1.3', `Remap ${legacyId} to ${canonicalId} while preserving quantity ${legacyQty}.`, 'move'),
        plan(`inventoryState.items.${canonicalId}`, '1.3', `Merge legacy quantity ${legacyQty} into canonical gate item ${canonicalId}.`, 'set'),
      );

      if (ctx.mode === 'apply') {
        items[canonicalId] = canonicalQty + legacyQty;
        delete items[legacyId];
        didMutate = true;
      }
    });

    if (found.length > 0) {
      warnings.push(
        warning('LEGACY_GATE_ITEM_ALIAS_PRESENT', `Legacy gate item aliases found: ${found.join(', ')}.`, '1.3', 'warning', 'inventoryState.items'),
        warning(
          ctx.mode === 'apply' ? 'CANONICAL_GATE_ID_NORMALIZED' : 'CANONICAL_GATE_ID_NORMALIZATION_READY',
          ctx.mode === 'apply'
            ? 'Legacy gate item aliases were normalized into canonical gate_* IDs for packet 1.3.'
            : 'Canonical gate item ID normalization is ready for packet 1.3.',
          '1.3',
          'info',
          'inventoryState.items',
        ),
      );
    }

    return createStepResult(
      v2_0_0_plan_gate_item_alias_migration,
      next,
      found.length > 0
        ? ctx.mode === 'apply'
          ? `Normalized ${found.length} legacy gate item aliases into canonical gate_* IDs.`
          : `Planned canonical remap for ${found.length} legacy gate item aliases.`
        : 'No legacy gate item aliases detected.',
      { warnings, touchedFieldPaths: touched, plannedMutations, didMutate },
    );
  },
};
