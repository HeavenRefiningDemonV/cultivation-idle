import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3A world and trial-progress surfaces share gate-trial semantic labels', () => {
  const worldPanel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');
  const trialProgress = read('src/features/trials/ui/TrialProgress.tsx');

  assert.match(worldPanel, /buildGateTrialScreenContract/);
  assert.match(trialProgress, /buildGateTrialScreenContract/);
  assert.match(worldPanel, /checklistMinimumTitle/);
  assert.match(trialProgress, /checklistMinimumTitle/);
  assert.match(worldPanel, /checklistRecommendedTitle/);
  assert.match(trialProgress, /checklistRecommendedTitle/);
  assert.match(worldPanel, /readinessScoreLine/);
  assert.match(trialProgress, /readinessScoreLine/);
});
