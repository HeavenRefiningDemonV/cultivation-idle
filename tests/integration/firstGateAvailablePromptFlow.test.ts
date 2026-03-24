import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('first gate available onboarding prompt is queued from honest gate lifecycle truth', async () => {
  const runtimeSource = await readSource('src/components/system/OnboardingPromptRuntime.tsx');
  const registrySource = await readSource('src/systems/ui/onboardingPromptRegistry.ts');

  assert.match(runtimeSource, /getCurrentGateTrialId/);
  assert.match(runtimeSource, /getTrialLifecycleSnapshot/);
  assert.match(runtimeSource, /lifecycle\.canStart/);
  assert.match(runtimeSource, /hasAnyGateAttempts/);
  assert.match(runtimeSource, /createFirstGateAvailablePrompt/);

  assert.match(registrySource, /title: 'First Gate Available'/);
  assert.match(registrySource, /Open Gate Trial/);
  assert.match(registrySource, /Milestone Gate/);
  assert.equal(/Adventure/.test(registrySource), false);
});
