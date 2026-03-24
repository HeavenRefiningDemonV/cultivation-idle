import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';

test('techniques screen mounts build-altar summary with identity/floor/posture/next-fix coverage', async () => {
  const source = await fs.readFile('src/components/screens/TechniqueLibraryScreen.tsx', 'utf8');

  assert.match(source, /RunCompassCompact/);
  assert.match(source, /BuildAltarSummary/);
  assert.match(source, /archetypeLabel=/);
  assert.match(source, /pathAlignmentScore=/);
  assert.match(source, /mastery=\{\{ label: 'Mastery'/);
  assert.match(source, /rank=\{\{ label: 'Rank'/);
  assert.match(source, /runes=\{\{ label: 'Runes'/);
  assert.match(source, /aiProfileLine=/);
  assert.match(source, /castingPolicyLine=/);
  assert.match(source, /nextFix=/);
});
