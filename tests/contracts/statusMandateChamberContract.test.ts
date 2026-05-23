import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

function readSourceIfExists(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return '';
    throw error;
  }
}

const statusScreenSource = readSource('src/components/screens/StatusScreen.tsx');
const statusSurfaceSource = readSource('src/systems/ui/status/statusDashboardSurface.ts');
const statusV2SurfaceSource = readSourceIfExists('src/systems/ui/status/statusV2Surface.ts');
const statusScss = readSource('src/components/screens/StatusScreen.scss');

function quotedText(source: string): string {
  return source.match(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g)?.join('\n') ?? '';
}

test('V2-5 Status retires the Mandate Chamber stack from default Status', () => {
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

  assert.match(statusScreenSource, /status-v2-root/);
  assert.match(statusScreenSource, /status-v2-grid/);
  assert.match(statusScreenSource, /status-v2-card-current-omen/);
});

test('V2-5 Status surface consumes Omen Projection instead of raw route-led fields', () => {
  assert.match(statusV2SurfaceSource, /DaoOmenProjectionV1/);
  assert.match(statusV2SurfaceSource, /buildDaoOmenProjectionV1/);
  assert.match(statusV2SurfaceSource, /currentScreen:\s*'status'/);
  assert.match(statusSurfaceSource, /statusV2/);

  for (const forbiddenPublicField of [
    'bestNextActions',
    'primaryRouteLabel',
    'biggestShortfallLabel',
  ]) {
    assert.doesNotMatch(
      statusScreenSource,
      new RegExp(forbiddenPublicField),
      `StatusScreen must not render old public guide field ${forbiddenPublicField}.`,
    );
  }
});

test('V2-5 Status public vocabulary is Omen/Proof/Health/Work, not Chamber/Route/Ledger', () => {
  const publicStatusCopy = [
    quotedText(statusScreenSource),
    quotedText(statusV2SurfaceSource),
  ].join('\n');

  for (const forbidden of [
    'Mandate Chamber',
    'Mandate Ledger',
    'Primary Route',
    'Best Next Action',
    'Biggest Shortfall',
    'Run Compass',
    'Requirement Ledger',
    'Readiness Ledger',
    'Source Route',
    'Source Map',
    'Guidance Oath',
    'Open Apothecary',
    'Open Forge',
    'Tune Techniques',
    'Cultivate Qi',
    'Mandate points elsewhere',
  ]) {
    assert.equal(publicStatusCopy.includes(forbidden), false, `Forbidden Status V2 copy leaked: ${forbidden}`);
  }

  for (const required of [
    'Current Omen',
    'Gate Proof',
    'Life Identity',
    'Preparation Health',
    'Current Work',
    'Recent Omens',
  ]) {
    assert.equal(publicStatusCopy.includes(required), true, `Status V2 should expose ${required}.`);
  }
});

test('V2-5 Status details are drawer-based, not permanent ledger/source tables', () => {
  assert.match(statusScreenSource, /statusV2DrawerLayer/);
  assert.match(statusScreenSource, /SourceThreadDrawer/);
  assert.match(statusScreenSource, /ReflectionPlaque/);
  assert.match(statusScss, /\.statusV2DrawerLayer/);
  assert.doesNotMatch(statusScss, /statusMandateChamber__primaryColumn|daoRequirementLedger|daoReadinessLedger|daoSourceRouteSlip/);
});
