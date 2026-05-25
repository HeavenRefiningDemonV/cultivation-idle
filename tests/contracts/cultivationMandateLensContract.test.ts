import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const cultivationScreenSource = readSource('src/features/cultivation/exact/CultivationExactScreen.tsx');
const cultivationSurfaceSource = readSource('src/features/cultivation/exact/buildCultivationExactSurface.ts');
const cultivationTypesSource = readSource('src/features/cultivation/exact/cultivationExactTypes.ts');
const cultivationControllerSource = readSource('src/features/cultivation/exact/useCultivationExactActionController.ts');

test('Cultivation no-Dao target is encoded without requiring compact Omen UI', () => {
  const agents = readSource('AGENTS.md');
  const releasePlan = readSource('docs/release/status_v3_dao_decommission_plan.md');

  assert.match(`${agents}\n${releasePlan}`, /Cultivation explains cultivation/i);
  assert.match(`${agents}\n${releasePlan}`, /Qi, realm, stage, stability, Heart Law, breath\/focus, (and )?breakthrough readiness/i);
  assert.match(`${agents}\n${releasePlan}`, /Public non-Status screens must not render|Do not render these as default reachable public UI components/i);
});

test('Packet D Cultivation removes Dao projection routing from public exact files', () => {
  for (const source of [cultivationScreenSource, cultivationSurfaceSource, cultivationTypesSource, cultivationControllerSource]) {
    assert.doesNotMatch(source, /OmenSeal|ProofSealRow|SourceThreadDrawer|Threshold Omen|compactOmen|buildDaoOmenProjectionV1|performMandateRouteIfAvailable/);
  }
});
