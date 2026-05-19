import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('techniqueStore.ts no longer contains a local AI->casting helper', async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), 'src/stores/techniqueStore.ts'),
    'utf8',
  );

  assert.equal(source.includes('getDefaultCastingPolicyForAiProfile'), true);
  assert.equal(source.includes('const mapAiProfileToCastingPolicy'), false);
});

test('combatStore.ts no longer contains a local AI->casting helper', async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), 'src/stores/combatStore.ts'),
    'utf8',
  );

  assert.equal(source.includes('getDefaultCastingPolicyForAiProfile'), true);
  assert.equal(source.includes('const mapAiProfileToCastingPolicy'), false);
});

test('combined posture wrapper reads the actual runtime posture sources', async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), 'src/systems/builds/combatPostureFit.ts'),
    'utf8',
  );

  assert.equal(source.includes('buildDoctrineSnapshot'), true);
  assert.equal(source.includes('buildLoadoutSnapshot'), true);
  assert.equal(source.includes('useUIStore'), true);
  assert.equal(source.includes('useMedicinePouchStore'), true);
  assert.equal(source.includes('evaluateAiProfileFit'), true);
  assert.equal(source.includes('evaluateCastingPolicyFit'), true);
  assert.equal(source.includes('evaluateMedicinePouchFit'), true);
});
