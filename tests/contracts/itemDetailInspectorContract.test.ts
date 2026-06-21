import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ITEM_DETAIL_RARITY_OPTIONS,
  ITEM_DETAIL_VARIANT_OPTIONS,
  ITEM_DETAIL_VISUAL_STATE_OPTIONS,
  buildItemDetailSurface,
} from '../../src/systems/ui/modals/index.js';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('F2: inspector exposes frozen rarity/variant/state registries (the item language is fixed)', () => {
  assert.deepEqual([...ITEM_DETAIL_RARITY_OPTIONS], ['common', 'uncommon', 'rare', 'epic', 'legendary']);
  assert.deepEqual([...ITEM_DETAIL_VARIANT_OPTIONS], ['item', 'technique']);
  assert.equal(ITEM_DETAIL_VISUAL_STATE_OPTIONS.length, 10);
});

test('F2: the inspector component is RENDER-ONLY (no gameplay store import, no mutation)', () => {
  const src = read('src/ui/modals/ItemDetailInspector.tsx');
  assert.doesNotMatch(src, /useGameStore|useCombatStore|useTrainingStore|usePrestigeStore|useInventoryStore|useEquipmentStore|useUIStore/);
  assert.doesNotMatch(src, /\.getState\(|\.setState\(/);
  // It forwards opaque intents and reads its typed surface prop.
  assert.match(src, /onAction\(/);
  // The component barrel re-exports the frozen registries.
  assert.match(read('src/ui/modals/index.ts'), /ITEM_DETAIL_INSPECTOR_RARITY_OPTIONS/);
});

test('F2: the empty + locked states render the frame honestly', () => {
  const empty = buildItemDetailSurface('inspector-empty');
  assert.equal(empty.visualState, 'empty');
  assert.equal(empty.identity, null);
  assert.ok((empty.emptyLegend ?? '').length > 0, 'empty state names a legend');

  const locked = buildItemDetailSurface('inspector-locked');
  assert.equal(locked.visualState, 'locked');
  assert.ok((locked.gate?.unmet ?? '').length > 0, 'locked state names what unlocks it');
  assert.equal(locked.actions.every((a) => a.enabled === false), true, 'locked actions are disabled');
  assert.ok(locked.actions.every((a) => a.enabled || (a.disabledReason ?? '').length > 0), 'disabled actions name a reason');

  const src = read('src/ui/modals/ItemDetailInspector.tsx');
  assert.match(src, /data-detail-zone="empty"/);
  assert.match(src, /data-detail-zone="gate"/);
});

test('F2: affixes are real-text props (name + value) tinted by kind, never hover-only', () => {
  const leg = buildItemDetailSurface('item-legendary');
  assert.ok(leg.affixes.length >= 4, 'legendary shows a full affix list');
  for (const affix of leg.affixes) {
    assert.equal(typeof affix.name, 'string');
    assert.equal(typeof affix.value, 'string');
    assert.ok(['prefix', 'suffix', 'bond', 'set'].includes(affix.kind));
  }
  const src = read('src/ui/modals/ItemDetailInspector.tsx');
  // Affixes are tinted by kind via the artifact-ported class `affix ${a.kind}` (.affix.prefix/.suffix/.bond),
  // and the value renders in the `.av` real-text cell.
  assert.match(src, /affix \$\{a\.kind\}/);
  assert.match(src, /className="av"/);
});

test('F2: the compare strip carries shape + sign + value (not color alone)', () => {
  const cmp = buildItemDetailSurface('item-equippable-compare');
  assert.ok((cmp.compareVsEquipped ?? []).length > 0);
  for (const row of cmp.compareVsEquipped ?? []) {
    assert.ok(['up', 'down', 'flat'].includes(row.direction));
    assert.equal(typeof row.delta, 'string');
  }
  // The compare strip carries the direction by shape (▲/▼ in `.cd.up`/`.cd.down`) + sign + value.
  const src = read('src/ui/modals/ItemDetailInspector.tsx');
  assert.match(src, /'▲'/);
  assert.match(src, /'▼'/);
  assert.match(read('src/ui/modals/ItemDetailInspector.scss'), /\.cd\.up/);
  assert.match(read('src/ui/modals/ItemDetailInspector.scss'), /\.cd\.down/);
});
