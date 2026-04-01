import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveStatusShortfallReason,
  resolveStatusUrgentCard,
} from '../../src/systems/ui/status/statusTroubleshootingSurface.js';

const scenarioCases = [
  { code: 'undercultivated' as const, urgent: 'readiness', label: 'Undercultivated' },
  { code: 'underforged' as const, urgent: 'permanent_floor', label: 'Underforged' },
  { code: 'underprepared' as const, urgent: 'preparation', label: 'Underprepared' },
  { code: 'underbuilt' as const, urgent: 'build', label: 'Underbuilt' },
  { code: 'close' as const, urgent: 'readiness', label: 'Close' },
];

test('status troubleshooting mapping keeps urgency tied to diagnosis families', () => {
  scenarioCases.forEach((entry) => {
    assert.equal(resolveStatusUrgentCard(entry.code), entry.urgent);
    assert.match(resolveStatusShortfallReason(entry.code, false), /\w+/);
  });
});

test('content-cap shortfall stays honest and does not invent future gate requirements', () => {
  assert.equal(resolveStatusUrgentCard(null), null);
  assert.equal(resolveStatusShortfallReason(null, true), 'Current chapter cap reached.');
});

test('status surface exports focus/breath posture contract keys', async () => {
  const module = await import('../../src/systems/ui/status/statusTroubleshootingSurface.js');
  const source = await import('node:fs/promises').then((fs) =>
    fs.readFile('src/systems/ui/status/statusTroubleshootingSurface.ts', 'utf8'),
  );

  assert.equal(typeof module.buildStatusTroubleshootingSurface, 'function');
  assert.equal(source.includes('focusPosture'), true);
  assert.equal(source.includes('breathPosture'), true);
  assert.equal(source.includes('modeOverallLine'), true);
});
