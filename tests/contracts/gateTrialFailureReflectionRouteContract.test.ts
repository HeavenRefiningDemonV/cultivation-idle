import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('gate trial exact reflection lookup uses the live gate index instead of a hardcoded gate one', () => {
  const source = readFileSync(
    'src/features/world/gateTrialExact/buildGateTrialExactSurface.ts',
    'utf8',
  );

  assert.equal(source.includes('getActiveReflectionForTrial(resolvedTrialId, 1)'), false);
  assert.match(source, /getActiveReflectionForTrial\(resolvedTrialId,\s*context\.gateIndex\)/);
});

test('gate trial failure reflection route mapping handles bounties and expeditions explicitly', () => {
  const screenSource = readFileSync(
    'src/features/world/gateTrialExact/GateTrialExactScreen.ts',
    'utf8',
  );
  const typesSource = readFileSync(
    'src/features/world/gateTrialExact/gateTrialExactTypes.ts',
    'utf8',
  );
  const controllerSource = readFileSync(
    'src/features/world/gateTrialExact/useGateTrialExactActionController.ts',
    'utf8',
  );

  assert.match(typesSource, /'bounties'/);
  assert.match(typesSource, /'expeditions'/);
  assert.match(typesSource, /'route-to-bounties'/);
  assert.match(typesSource, /'route-to-expeditions'/);
  assert.match(screenSource, /case 'bounties':/);
  assert.match(screenSource, /case 'expeditions':/);
  assert.match(controllerSource, /case 'bounties':/);
  assert.match(controllerSource, /case 'expeditions':/);
});
