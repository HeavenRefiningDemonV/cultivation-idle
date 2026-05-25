import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const screenSource = readSource('src/features/cultivation/exact/CultivationExactScreen.tsx');
const builderSource = readSource('src/features/cultivation/exact/buildCultivationExactSurface.ts');
const typesSource = readSource('src/features/cultivation/exact/cultivationExactTypes.ts');
const controllerSource = readSource('src/features/cultivation/exact/useCultivationExactActionController.ts');

test('Cultivation target is breakthrough readiness, not compact Omen Projection', () => {
  const agents = readSource('AGENTS.md');
  const packetRules = readSource('docs/codex-packet-rules.md');
  const releasePlan = readSource('docs/release/status_v3_dao_decommission_plan.md');

  assert.match(`${agents}\n${packetRules}\n${releasePlan}`, /Cultivation explains cultivation/i);
  assert.match(`${agents}\n${packetRules}\n${releasePlan}`, /breakthrough readiness|Gate Readiness/i);
  assert.match(`${agents}\n${releasePlan}`, /OmenSeal|ProofSealRow|SourceThreadDrawer/i);
  assert.doesNotMatch(`${agents}\n${packetRules}`, /Cultivation.*compact Omen.*target|compact Omen.*default view/i);
});

test('Packet D Cultivation public UI removes compact Omen components and keeps local readiness', () => {
  assert.match(`${screenSource}\n${builderSource}\n${typesSource}`, /Breakthrough Readiness|breakthroughReadiness/);

  for (const forbidden of [
    'OmenSeal',
    'ProofSealRow',
    'SourceThreadDrawer',
    'data-region="cultivation-compact-omen"',
    'Threshold Omen',
    'Omen evidence',
  ]) {
    assert.doesNotMatch(screenSource, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Cultivation must remove ${forbidden}.`);
  }

  assert.doesNotMatch(typesSource, /compactOmen:/);
  assert.doesNotMatch(builderSource, /buildDaoOmenProjectionV1|buildLiveDaoMandateSurfaceV1|Threshold Omen|Gate Proof/);
  assert.doesNotMatch(controllerSource, /compactOmen\?\.projection/);
  assert.doesNotMatch(controllerSource, /performDaoMandateRouteAction/);
});
