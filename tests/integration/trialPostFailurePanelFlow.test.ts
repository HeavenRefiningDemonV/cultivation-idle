import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('trial progress uses shared post-failure panel as primary advice above telemetry', async () => {
  const source = await fs.readFile('src/features/trials/ui/TrialProgress.tsx', 'utf8');

  assert.match(source, /buildSection5PostFailureSurface/);
  assert.match(source, /<PostFailureDiagnosisPanel[\s\S]*surface=\{postFailureSurface\}/);

  const panelIndex = source.indexOf('<PostFailureDiagnosisPanel');
  const intelIndex = source.indexOf('<div className="trial-progress__intel">');
  assert.equal(panelIndex > -1 && intelIndex > -1 && panelIndex < intelIndex, true);

  assert.doesNotMatch(source, /trial-progress__suggestions/);
  assert.doesNotMatch(source, /lastSummary\?\.suggestions/);
});

test('gate trial panel routes shared post-failure actions through the shared executor', async () => {
  const source = await fs.readFile('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx', 'utf8');

  assert.match(source, /buildSection5PostFailureSurface/);
  assert.match(source, /performPostFailureFixAction/);
  assert.match(source, /<GateTrialTopFixes[\s\S]*surface=\{postFailureSurface\}/);
});
