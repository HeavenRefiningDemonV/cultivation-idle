import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { runVocabularyAudit } from '../../src/services/diagnostics/release/vocabularyAudit.js';
import { getDaoMandateProfileLabel } from '../../src/ui/daoMandate/daoMandateUiFormatters.js';

const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;

const STATUS_DEFAULT_FILES = [
  'src/components/screens/StatusScreen.tsx',
  'src/systems/ui/status/statusDashboardSurface.ts',
  'src/systems/ui/status/statusLedgerSurface.ts',
  'src/systems/ui/status/statusTroubleshootingSurface.ts',
  'src/ui/status/ledger/StatusLedgerPage.tsx',
  'src/ui/status/ledger/StatusLedgerHero.tsx',
  'src/ui/status/ledger/StatusMetricStrip.tsx',
  'src/ui/status/ledger/StatusLedgerCard.tsx',
  'src/ui/status/ledger/StatusLedgerRows.tsx',
  'src/ui/status/ledger/StatusDetailsDrawer.tsx',
];

const PUBLIC_ROUTE_BOARD_PATTERNS = [
  /\bPrimary Route\b/i,
  /\bPrimary Obstruction\b/i,
  /\bBest Next Actions?\b/i,
  /\bBiggest Shortfall\b/i,
  /\bRun Compass\b/i,
  /Guidance Oath/i,
  /Sealed Counsel|Elder's Counsel|Jade Slip Tutor/i,
  /Mandate points elsewhere|points elsewhere/i,
  /Mandate Context/i,
  /Open Apothecary|Open Forge|Open Techniques|Tune Techniques|Raise Forge Floor|Cultivate Qi/i,
];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function walk(filePath: string): string[] {
  if (!existsSync(filePath)) return [];
  const stats = statSync(filePath);
  if (stats.isFile()) return SOURCE_FILE_PATTERN.test(filePath) ? [filePath] : [];
  return readdirSync(filePath)
    .flatMap((entry) => walk(join(filePath, entry)));
}

function read(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

test('Status V3 audit surfaces current Packet C/D public Dao blockers with classification', () => {
  const report = runVocabularyAudit();
  const blockers = report.daoMandateV2.matches
    .filter((finding) => finding.severity === 'blocker')
    .map((finding) => `${finding.file}:${finding.line} [${finding.normalizedTerm}] ${finding.excerpt}`);

  assert.ok(blockers.length > 0, 'Packet C should still expose current non-Status public Dao/Omen offenders until Packet D.');
  assert.equal(report.daoMandateV2.overallPass, false);
  assert.equal(
    blockers.some((entry) => /StatusScreen|statusV2Surface/.test(entry)),
    false,
    'Packet C should keep public Status and retired Status V2 internals out of blocker findings.',
  );
  assert.ok(blockers.some((entry) => /SettingsScreen/.test(entry) && /Dao Mandate Interface/.test(entry)));
});

test('V2-11 default Status source does not expose old route-board labels or raw chamber stack', () => {
  const offenders: string[] = [];
  for (const filePath of STATUS_DEFAULT_FILES) {
    const source = read(filePath);
    for (const pattern of PUBLIC_ROUTE_BOARD_PATTERNS) {
      if (pattern.test(source)) offenders.push(`${normalizePath(filePath)} :: ${pattern}`);
    }
  }

  const statusScreen = read('src/components/screens/StatusScreen.tsx');
  assert.doesNotMatch(statusScreen, /MandateChamberHero|RequirementLedger|ReadinessLedger|SourceRouteSlip/);
  assert.doesNotMatch(statusScreen, /<RunCompass\b|<RunCompassCompact\b|<RunCompassSection\b/);
  assert.deepEqual(offenders, []);
});

test('V2-11 Prestige and Settings do not expose old guide profiles or live-run route ribbons', () => {
  const settingsSource = read('src/components/screens/SettingsScreen.tsx');
  const prestigeSources = [
    ...walk('src/components/screens/PrestigeScreen.tsx'),
    ...walk('src/features/prestige/prestigeLedgerExact'),
  ].map(read).join('\n');

  assert.doesNotMatch(settingsSource, /Guidance Oath|Sealed Counsel|Elder's Counsel|Jade Slip Tutor/);
  assert.doesNotMatch(prestigeSources, /runCompassHint|useRunCompassSurface|Primary Route|Mandate Context|Run Compass|Best Next Actions?|Biggest Shortfall/);
});

test('V2-11 legacy ModuleRoleBanner compatibility code is not mounted by active screens', () => {
  const offenders: string[] = [];
  for (const filePath of walk('src')) {
    const normalized = normalizePath(filePath);
    if (
      normalized === 'src/ui/world/ModuleRoleBanner.tsx' ||
      normalized === 'src/systems/world/moduleRoleBannerSurface.ts' ||
      normalized === 'src/services/diagnostics/release/vocabularyAudit.ts'
    ) {
      continue;
    }
    const source = read(filePath);
    if (/ModuleRoleBanner|moduleRoleBannerSurface/.test(source)) offenders.push(normalized);
  }

  assert.deepEqual(offenders, []);
});

test('V2-11 legacy guidance profiles normalize to one sparse compatibility label', () => {
  assert.deepEqual(
    (['sealed', 'elder', 'jade'] as const).map(getDaoMandateProfileLabel),
    ['Sparse compatibility', 'Sparse compatibility', 'Sparse compatibility'],
  );
});

test('V2-11 stale tests no longer assert old guide-board behavior as required public UI', () => {
  const statusChamberTest = read('tests/contracts/statusMandateChamberContract.test.ts');
  const guidanceVisibilityTest = read('tests/contracts/daoMandateP8GuidanceVisibilityOnly.test.ts');
  const guidanceSettingsTest = read('tests/contracts/daoMandateGuidanceVisibilitySettings.test.ts');
  const moduleRoleBannerTest = read('tests/contracts/moduleRoleBannerSurfaceContract.test.ts');

  assert.match(statusChamberTest, /Cultivator Ledger|future public Status contract/i);
  assert.doesNotMatch(statusChamberTest, /assert\.match\([^;]*MandateChamberHero/);
  assert.doesNotMatch(guidanceVisibilityTest, /Sealed Counsel|Elder's Counsel|Jade Slip Tutor/);
  assert.doesNotMatch(guidanceVisibilityTest, /reveal|increase|more strategic/i);
  assert.doesNotMatch(guidanceSettingsTest, /Sealed Counsel|Elder's Counsel|Jade Slip Tutor/);
  assert.match(moduleRoleBannerTest, /legacy|internal-only/i);
});
