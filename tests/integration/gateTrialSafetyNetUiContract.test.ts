import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';

test('safety net wording is canonical in touched gate trial surfaces', async () => {
  const panel = await fs.readFile('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx', 'utf8');
  const progress = await fs.readFile('src/features/trials/ui/TrialProgress.tsx', 'utf8');
  const modal = await fs.readFile('src/components/combat/presentation/CombatTheaterModal.tsx', 'utf8');
  const lifecycle = await fs.readFile('src/systems/progression/runtime/trialLifecycle.ts', 'utf8');

  assert.doesNotMatch(panel, /Fail-safe|Eligible Failures/i);
  assert.doesNotMatch(progress, /Fail-safe|eligible failures/i);
  assert.doesNotMatch(modal, /Fail-safe|eligible failures/i);
  assert.doesNotMatch(lifecycle, /Fail-safe/i);
  assert.match(panel, /GATE_SUPPORT_LABELS\.support|Safety Net/);
  assert.match(panel, /Eligible Defeats/);
  assert.match(panel, /GateTrialSummaryCard/);
  assert.match(panel, /COMBAT_TRIO_TRUTH\.gateTrial/);
});
