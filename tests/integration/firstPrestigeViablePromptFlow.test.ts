import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('first prestige viable onboarding prompt uses advisor vocabulary and prestige-tab guard', async () => {
  const runtimeSource = await readSource('src/components/system/OnboardingPromptRuntime.tsx');
  const registrySource = await readSource('src/systems/ui/onboardingPromptRegistry.ts');

  assert.match(runtimeSource, /getPrestigeAdvisorSurface/);
  assert.match(runtimeSource, /advisor\.stateLabel === 'Viable' \|\| advisor\.stateLabel === 'Recommended'/);
  assert.match(runtimeSource, /activeTab === 'prestige'/);
  assert.match(runtimeSource, /createFirstPrestigeViablePrompt/);

  assert.match(registrySource, /title: 'Prestige is now viable'/);
  assert.match(registrySource, /Open Prestige/);
  assert.match(registrySource, /Continue This Life/);
  assert.equal(/Eligible|Sealed/.test(registrySource), false);
});
