import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function readIfExists(relPath: string): string {
  const absPath = path.join(repoRoot, relPath);
  return existsSync(absPath) ? readFileSync(absPath, 'utf8') : '';
}

function statusUiSources(): string {
  const uiRoot = path.join(repoRoot, 'src', 'ui', 'status');
  const uiFiles = existsSync(uiRoot)
    ? readdirSync(uiRoot).filter((file) => /\.(?:ts|tsx)$/.test(file)).map((file) => path.join(uiRoot, file))
    : [];

  return [
    read('src/components/screens/StatusScreen.tsx'),
    read('src/components/screens/StatusScreen.scss'),
    readIfExists('src/systems/ui/status/statusV2Surface.ts'),
    ...uiFiles.map((file) => readFileSync(file, 'utf8')),
  ].join('\n');
}

function quotedText(source: string): string {
  return source.match(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g)?.join('\n') ?? '';
}

test('Status V2 production files exist and replace the old chamber imports', () => {
  assert.equal(
    existsSync(path.join(repoRoot, 'src', 'systems', 'ui', 'status', 'statusV2Surface.ts')),
    true,
    'Status V2 needs an explicit surface builder.',
  );

  const statusScreen = read('src/components/screens/StatusScreen.tsx');

  for (const forbiddenImport of [
    'MandateChamberHero',
    'RequirementLedger',
    'ReadinessLedger',
    'SourceRouteSlip',
    'BackgroundSupportStrip',
    'SafetyNetPlaque',
    'ReincarnationCounsel',
    'JadeSlipHelp',
  ]) {
    assert.equal(
      statusScreen.includes(forbiddenImport),
      false,
      `StatusScreen default render must not import/use ${forbiddenImport}.`,
    );
  }

  for (const required of [
    'OmenSeal',
    'ProofSealRow',
    'PressureBadgeRow',
    'SourceThreadDrawer',
    'ReflectionPlaque',
  ]) {
    assert.match(statusUiSources(), new RegExp(required), `Status V2 should use ${required}.`);
  }
});

test('Status V2 render tree exposes restored root, hero, metrics, grid, six cards, and drawers', () => {
  const sources = statusUiSources();
  const scss = read('src/components/screens/StatusScreen.scss');

  for (const testId of [
    'status-v2-root',
    'status-v2-hero',
    'status-v2-metrics',
    'status-v2-grid',
    'status-v2-card-current-omen',
    'status-v2-card-gate-proof',
    'status-v2-card-life-identity',
    'status-v2-card-preparation-health',
    'status-v2-card-current-work',
    'status-v2-card-recent-omens',
  ]) {
    assert.match(sources, new RegExp(testId), `Status V2 render tree should expose ${testId}.`);
  }

  for (const selector of [
    '.statusV2Root',
    '.statusV2Canvas',
    '.statusV2Hero',
    '.statusV2Hero__identity',
    '.statusV2Hero__omenSeal',
    '.statusV2Metrics',
    '.statusV2Metric',
    '.statusV2Grid',
    '.statusV2Card',
    '.statusV2Card--currentOmen',
    '.statusV2Card--gateProof',
    '.statusV2Card--lifeIdentity',
    '.statusV2Card--preparationHealth',
    '.statusV2Card--currentWork',
    '.statusV2Card--recentOmens',
    '.statusV2DrawerLayer',
    '.statusV2SourceThreadDrawer',
    '.statusV2ReflectionDrawer',
  ]) {
    assert.equal(scss.includes(selector), true, `Status V2 SCSS should include ${selector}.`);
  }

  assert.match(scss, /focus-visible/, 'Status V2 SCSS must include visible focus states.');
  assert.match(scss, /prefers-reduced-motion/, 'Status V2 SCSS must include reduced-motion handling.');
  assert.doesNotMatch(scss, /statusMandateChamber__grid/, 'Status V2 must not use the old chamber grid as active layout.');
});

test('Status V2 public production copy avoids old route-led guide vocabulary', () => {
  const publicCopy = quotedText(statusUiSources());

  for (const forbidden of [
    'Mandate Chamber',
    'Mandate Ledger',
    'Primary Route',
    'Secondary Route',
    'Best Next Action',
    'Best Next Actions',
    'Biggest Shortfall',
    'Run Compass',
    'Mission Requirements',
    'Missions',
    'Requirement Ledger',
    'Readiness Ledger',
    'Source Route',
    'Source Map',
    'Guidance Oath',
    'Sealed Counsel',
    "Elder's Counsel",
    'Jade Slip Tutor',
    'Open Apothecary',
    'Open Forge',
    'Tune Techniques',
    'Raise Forge Floor',
    'Cultivate Qi',
    'Mandate points elsewhere',
  ]) {
    assert.equal(publicCopy.includes(forbidden), false, `Forbidden default Status copy leaked: ${forbidden}`);
  }

  for (const required of [
    'Current Omen',
    'Gate Proof',
    'Life Identity',
    'Preparation Health',
    'Current Work',
    'Recent Omens',
    'Details',
  ]) {
    assert.equal(publicCopy.includes(required), true, `Status V2 should expose heading: ${required}`);
  }
});
