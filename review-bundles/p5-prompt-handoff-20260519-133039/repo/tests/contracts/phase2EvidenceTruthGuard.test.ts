import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

const PRIMARY_ROOTS: Array<{ id: string; folder: string; required: string[] }> = [
  { id: 'world', folder: 'docs/release/qa/ui-cutover/phase-0-core-screens/04-world', required: ['01-base.png', '02-interaction.png', '03-truth-states.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
  { id: 'cultivation', folder: 'docs/release/qa/ui-cutover/phase-0-core-screens/02-cultivation', required: ['01-base.png', '02-interaction.png', '03-truth-states.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
  { id: 'status', folder: 'docs/release/qa/ui-cutover/phase-0-core-screens/03-status', required: ['01-base.png', '02-interaction.png', '03-truth-states.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
  { id: 'prestige', folder: 'docs/release/qa/ui-cutover/phase-0-core-screens/10-prestige', required: ['01-base.png', '02-interaction.png', '03-truth-states.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
  { id: 'prestige-ritual', folder: 'docs/release/qa/ui-cutover/prestige-ritual', required: ['01-base.png', '02-interaction.png', '03-truth-states.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
  { id: 'current-chapter-exhausted', folder: 'docs/release/qa/ui-cutover/current-chapter-exhausted', required: ['01-base.png', '02-interaction.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
  { id: 'life-summary', folder: 'docs/release/qa/ui-cutover/life-summary', required: ['01-base.png', '02-interaction.png', '03-truth-states.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
  { id: 'change-heart-law', folder: 'docs/release/qa/ui-cutover/change-heart-law', required: ['01-base.png', '02-interaction.png', '03-truth-states.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] },
];

void test('phase 2 canonical primary roots exist and are README-first when slots are absent', () => {
  const manifest = read('docs/ui/phase-2-screenshot-manifest.md');

  for (const target of PRIMARY_ROOTS) {
    assert.equal(existsSync(resolve(process.cwd(), target.folder)), true, `missing folder ${target.folder}`);
    assert.match(manifest, new RegExp(`\\| ${target.id} \\|`));

    const presentCount = target.required.filter((slot) => existsSync(resolve(process.cwd(), target.folder, slot))).length;
    if (presentCount === 0) {
      assert.match(manifest, /0\/6 captured|0\/5 captured|manual-path-only/);
    }
  }
});

void test('phase 2 proof matrix keeps primary set bounded and blocks silent promotion', () => {
  const source = read('docs/ui/phase-2-proof-surface-matrix.md');
  ['world', 'cultivation', 'status', 'prestige', 'prestige-ritual', 'current-chapter-exhausted', 'life-summary', 'change-heart-law', 'bottom-tab-bar'].forEach((id) => {
    assert.match(source, new RegExp(`\\| ${id} \\|`));
  });

  ['manual-pavilion', 'techniques', 'apothecary', 'forge', 'bounties-expeditions'].forEach((id) => {
    assert.match(source, new RegExp(`\\| ${id} \\| .*Secondary already-opted-in compact consumer`));
  });
});
