import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

const forbiddenWorldTerms = [
  /\bEmbermist\b/,
  /\bSilverkeep\b/,
  /\bStarsea\b/,
  /roleTag:\s*'Milestone Gate'/i,
  /roleTag:\s*'Gate Prep'/i,
  /roleTag:\s*'Support Currency'/i,
  /roleTag:\s*'Passive Supply'/i,
];

test('world-facing vocabulary sources keep canonical role tags and world tab label', () => {
  const labels = read('src/ui/text/playerFacingLabels.ts');
  const moduleRegistry = read('src/systems/world/moduleCardRegistry.ts');
  const worldCommandSurface = read('src/systems/ui/world/worldCommandSurface.ts');

  assert.match(labels, /adventure:\s*'World'/);
  assert.match(moduleRegistry, /OUTSKIRTS_ROLE_TAG/);
  assert.match(moduleRegistry, /RUINS_ROLE_TAG/);
  assert.match(moduleRegistry, /roleTag:\s*'Gate Progress'/);
  assert.match(moduleRegistry, /roleTag:\s*'Build Correction'/);
  assert.match(moduleRegistry, /roleTag:\s*'Immediate Readiness'/);
  assert.match(moduleRegistry, /roleTag:\s*'Permanent Floor'/);
  assert.match(moduleRegistry, /roleTag:\s*'Merit & Routing'/);
  assert.match(moduleRegistry, /roleTag:\s*'Passive Support'/);
  assert.match(worldCommandSurface, /getWorldModuleCardDefinition\(moduleKey\)\.roleTag/);

  [labels, moduleRegistry, worldCommandSurface].forEach((source) => {
    forbiddenWorldTerms.forEach((pattern) => {
      assert.doesNotMatch(source, pattern);
    });
  });
});

test('world leak audit replacement map preserves semester city canon replacement coverage', () => {
  const leakAudit = read('src/systems/world/liveWorldLeakAudit.ts');
  assert.match(leakAudit, /Embermist:\s*'Spirit Cavern'/);
  assert.match(leakAudit, /Silverkeep:\s*'Lotusford'/);
  assert.match(leakAudit, /Starsea:\s*'Ironpeak'/);
});
