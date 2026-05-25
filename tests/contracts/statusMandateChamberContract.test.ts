import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const STRICT = process.env.STATUS_V3_STRICT === '1';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const statusScreenSource = readSource('src/components/screens/StatusScreen.tsx');
const statusV2SurfaceSource = readSource('src/systems/ui/status/statusV2Surface.ts');

test('Status target is Cultivator Ledger, not Mandate Chamber or sparse Omen Projection', () => {
  const agents = readSource('AGENTS.md');
  const releasePlan = readSource('docs/release/status_v3_dao_decommission_plan.md');

  assert.match(`${agents}\n${releasePlan}`, /Cultivator Ledger|Status Ledger/i);
  assert.match(`${agents}\n${releasePlan}`, /old-look|old Status|old Status page/i);
  assert.doesNotMatch(agents, /sparse Omen Projection|sparse, omen\/proof\/reflection based/i);
});

test('default Status still rejects the old Mandate Chamber stack during transition', () => {
  for (const oldComponent of [
    'MandateChamberHero',
    'RequirementLedger',
    'ReadinessLedger',
    'SourceRouteSlip',
  ]) {
    assert.equal(
      statusScreenSource.includes(oldComponent),
      false,
      `Default Status must not import or render ${oldComponent}.`,
    );
  }
});

test('legacy statusV2Surface is not the future public Status contract', () => {
  const packetRules = readSource('docs/codex-packet-rules.md');

  assert.match(statusV2SurfaceSource, /StatusV2Surface/);
  assert.match(packetRules, /Packet C[\s\S]*replace|replace[\s\S]*Status/i);
  assert.match(packetRules, /stale tests must be rewritten|stale tests/i);
});

test('strict Status render removes Dao/Omen public components after Packet C', (t) => {
  if (!STRICT) {
    t.skip('Strict Status UI decommission assertions activate after Packet C with STATUS_V3_STRICT=1.');
    return;
  }

  for (const forbidden of [
    'OmenSeal',
    'ProofSealRow',
    'PressureBadgeRow',
    'SourceThreadDrawer',
    'ReflectionPlaque',
  ]) {
    assert.doesNotMatch(statusScreenSource, new RegExp(forbidden), `StatusScreen must not render ${forbidden}.`);
  }
});
