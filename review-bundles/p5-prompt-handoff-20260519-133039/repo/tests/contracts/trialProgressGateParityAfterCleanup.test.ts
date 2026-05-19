import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3F TrialProgress keeps Gate Trial semantic parity labels after cleanup', () => {
  const trialProgress = read('src/features/trials/ui/TrialProgress.tsx');

  assert.match(trialProgress, /buildGateTrialScreenContract/);
  assert.match(trialProgress, /GateTrialReadinessCard/);
  assert.match(trialProgress, /GateTrialChecklist/);
  assert.match(trialProgress, /checklistMinimumTitle \?\? 'Minimum Floor'/);
  assert.match(trialProgress, /checklistRecommendedTitle \?\? 'Recommended Floor'/);
  assert.match(trialProgress, /GATE_SUPPORT_LABELS\.support/);
  assert.match(trialProgress, /Readiness Score:/);
});
