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
  const combatTrioTruth = read('src/systems/world/combatTrioTruth.ts');
  const worldCommandSurface = read('src/systems/ui/world/worldCommandSurface.ts');

  assert.match(labels, /adventure:\s*'World'/);
  assert.match(combatTrioTruth, /roleTag:\s*'Gold & Common Mats'/);
  assert.match(combatTrioTruth, /roleTag:\s*'Targeted Mats'/);
  assert.match(combatTrioTruth, /roleTag:\s*'Gate Progress'/);
  assert.match(combatTrioTruth, /bestUsedWhenClause:\s*'you need gold, common materials, or low-risk combat reps\.'/);
  assert.match(combatTrioTruth, /bestUsedWhenClause:\s*'you need targeted local materials and deterministic support rewards\.'/);
  assert.match(combatTrioTruth, /bestUsedWhenClause:\s*'you are ready to resolve the current gate trial\.'/);
  assert.match(moduleRegistry, /COMBAT_TRIO_TRUTH\.outskirts\.roleTag/);
  assert.match(moduleRegistry, /COMBAT_TRIO_TRUTH\.ruins\.roleTag/);
  assert.match(moduleRegistry, /COMBAT_TRIO_TRUTH\.gateTrial\.roleTag/);
  assert.match(moduleRegistry, /roleTag:\s*'Build Correction'/);
  assert.match(moduleRegistry, /roleTag:\s*'Immediate Readiness'/);
  assert.match(moduleRegistry, /roleTag:\s*'Permanent Floor'/);
  assert.match(moduleRegistry, /roleTag:\s*'Merit & Routing'/);
  assert.match(moduleRegistry, /roleTag:\s*'Passive Support'/);
  assert.match(worldCommandSurface, /getWorldModuleCardDefinition\(moduleKey\)\.roleTag/);

  [labels, moduleRegistry, combatTrioTruth, worldCommandSurface].forEach((source) => {
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
