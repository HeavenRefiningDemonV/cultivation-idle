import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const statusScreenSource = readSource('src/components/screens/StatusScreen.tsx');
const statusSurfaceSource = readSource('src/systems/ui/status/statusDashboardSurface.ts');

test('P4 Status renders the Dao Mandate Chamber as the first guidance authority', () => {
  assert.match(statusScreenSource, /MandateChamberHero/);
  assert.match(statusScreenSource, /RequirementLedger/);
  assert.match(
    statusScreenSource,
    /ReadinessLedger|SourceRouteSlip|BackgroundSupportStrip|SafetyNetPlaque|RecentOmensFeed|ReincarnationCounsel/,
  );
  assert.match(statusScreenSource, /performDaoMandateRouteAction/);

  const heroIndex = statusScreenSource.indexOf('<MandateChamberHero');
  const mainIndex = statusScreenSource.indexOf('<main');
  assert.ok(heroIndex > -1, 'StatusScreen should render MandateChamberHero');
  assert.ok(mainIndex === -1 || heroIndex < mainIndex, 'MandateChamberHero should appear before the supporting grid');
});

test('P4 Status removes old public peer-guide vocabulary from the active screen', () => {
  for (const forbidden of [
    'Run Compass',
    'Biggest Shortfall',
    'Best Next Actions',
    'Recent Changes',
    'Mission Requirements',
    'Missions',
  ]) {
    assert.equal(
      statusScreenSource.includes(forbidden),
      false,
      `StatusScreen should not expose old public guide label: ${forbidden}`,
    );
  }

  for (const required of [
    'Mandate Chamber',
    'Mandate Ledger',
    'Primary Route',
    'Recent Omens',
  ]) {
    assert.match(statusScreenSource, new RegExp(required));
  }
});

test('P4 Status surface carries visible Dao Mandate truth filtered by Guidance Oath', () => {
  assert.match(statusSurfaceSource, /DaoMandateSurfaceV1/);
  assert.match(statusSurfaceSource, /buildLiveDaoMandateSurfaceV1/);
  assert.match(statusSurfaceSource, /currentScreen:\s*'status'/);
  assert.match(statusSurfaceSource, /pickDaoMandateGuidanceSettings/);
  assert.match(statusSurfaceSource, /applyDaoMandateVisibility/);
  assert.match(statusSurfaceSource, /resolveDaoMandateEffectiveMotionMode/);
  assert.match(statusSurfaceSource, /mandate:\s*\{/);
  assert.doesNotMatch(statusSurfaceSource, /title:\s*'Mission Requirements'/);
  assert.doesNotMatch(statusSurfaceSource, /title:\s*'Readiness Overview'/);
});
