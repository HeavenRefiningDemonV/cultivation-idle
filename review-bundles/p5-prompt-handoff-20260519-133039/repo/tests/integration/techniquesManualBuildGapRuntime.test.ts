import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';

test('techniques and manual pavilion mount compact run compass and build-gap surfaces', async () => {
  const techniques = await fs.readFile('src/components/screens/TechniqueLibraryScreen.tsx', 'utf8');
  const pavilion = await fs.readFile('src/components/screens/ManualPavilionPanel.tsx', 'utf8');

  assert.match(techniques, /RunCompassCompact/);
  assert.match(techniques, /BuildAltarSummary/);
  assert.match(pavilion, /RunCompassCompact/);
  assert.match(pavilion, /ManualBuildGapSummary/);
  assert.match(pavilion, /ManualOfferTags/);
});

test('manual pavilion offer analysis is wired with real build analysis instead of null', async () => {
  const pavilion = await fs.readFile('src/components/screens/ManualPavilionPanel.tsx', 'utf8');
  assert.match(pavilion, /const buildAnalysis = useMemo\(/);
  assert.match(pavilion, /buildAnalysis,\s*\n\s*}\),/);
  assert.doesNotMatch(pavilion, /buildAnalysis:\s*null/);
});
