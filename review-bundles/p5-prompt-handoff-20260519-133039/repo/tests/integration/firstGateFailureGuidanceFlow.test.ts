import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('first gate failure guidance piggybacks on shared diagnosis surfaces with one once-per-life teaching strap', async () => {
  const trialProgressSource = await readSource('src/features/trials/ui/TrialProgress.tsx');
  const gatePanelSource = await readSource('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');
  const runtimeSource = await readSource('src/components/system/OnboardingPromptRuntime.tsx');

  assert.match(trialProgressSource, /PostFailureDiagnosisPanel/);
  assert.match(trialProgressSource, /InlineOnboardingCallout/);
  assert.match(trialProgressSource, /Defeat is feedback/);
  assert.match(trialProgressSource, /ONBOARDING_INLINE_LIFE_KEYS\.firstFailureStrap/);
  assert.equal(/lastAttemptSummary\.suggestions/.test(trialProgressSource), false);

  assert.match(gatePanelSource, /GateTrialTopFixes/);
  assert.match(gatePanelSource, /InlineOnboardingCallout/);
  assert.match(gatePanelSource, /Defeat is feedback/);

  assert.match(runtimeSource, /buildSection5PostFailureSurface/);
  assert.match(runtimeSource, /surface\.state !== 'available'/);
});
