import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const repoRoot = process.cwd();
const daoUiRoot = path.join(repoRoot, 'src', 'ui', 'daoMandate');

const REQUIRED_FILES = [
  'DaoMandateTokens.scss',
  'OmenSeal.tsx',
  'OmenSeal.scss',
  'ProofSealRow.tsx',
  'ProofSealRow.scss',
  'PressureBadgeRow.tsx',
  'PressureBadgeRow.scss',
  'SourceThreadDrawer.tsx',
  'SourceThreadDrawer.scss',
  'ReflectionPlaque.tsx',
  'ReflectionPlaque.scss',
  'daoMandateComponentFixtures.ts',
  'index.ts',
] as const;

const COMPONENT_FILES = REQUIRED_FILES.filter((file) => /\.(?:ts|tsx)$/.test(file));

const FORBIDDEN_IMPORT_PATTERNS = [
  /from ['"][^'"]*stores/i,
  /src\/stores\//i,
  /RewardService|CombatStore|TrialStore|ActivityStore|PrestigeResetService/,
  /performDaoMandateRouteAction|useDaoMandateRouteActionHandler/,
  /useGameStore|useUiStore|useUIStore|useCombatStore|useTrialStore|usePrestigeStore/,
  /localStorage|sessionStorage|fetch\(|XMLHttpRequest|new WebSocket/,
  /innerHTML|dangerouslySetInnerHTML|eval\(|Function\(/,
] as const;

const FORBIDDEN_DEFAULT_COPY = [
  'Open Apothecary',
  'Open Forge',
  'Raise Forge',
  'Tune Techniques',
  'Cultivate Qi',
  'Primary Route',
  'Best Next Action',
  'Biggest Shortfall',
  'Mandate points elsewhere',
  'Guidance Oath',
  'Sealed Counsel',
  "Elder's Counsel",
  'Jade Slip Tutor',
] as const;

function readDaoFile(fileName: string): string {
  return readFileSync(path.join(daoUiRoot, fileName), 'utf8');
}

function walkSourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return walkSourceFiles(entryPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

test('V2-4 shared Omen component files exist', () => {
  for (const file of REQUIRED_FILES) {
    assert.equal(existsSync(path.join(daoUiRoot, file)), true, `${file} should exist for V2-4.`);
  }
});

test('V2-4 shared Omen exports are present in the Dao UI barrel', () => {
  const source = readDaoFile('index.ts');

  for (const exportName of [
    'OmenSeal',
    'ProofSealRow',
    'PressureBadgeRow',
    'SourceThreadDrawer',
    'ReflectionPlaque',
    'DAO_MANDATE_COMPONENT_FIXTURES',
  ]) {
    assert.match(source, new RegExp(exportName), `src/ui/daoMandate/index.ts should export ${exportName}.`);
  }
});

test('V2-4 components remain pure renderers without gameplay, store, route adapter, network, or unsafe DOM imports', () => {
  for (const file of COMPONENT_FILES) {
    const source = readDaoFile(file);
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      assert.doesNotMatch(source, pattern, `${file} must stay a pure renderer and not match ${pattern}.`);
    }
  }
});

test('V2-4 components and fixtures do not introduce forbidden default route or old strategy copy', () => {
  for (const file of COMPONENT_FILES) {
    const source = readDaoFile(file);
    for (const phrase of FORBIDDEN_DEFAULT_COPY) {
      assert.equal(source.includes(phrase), false, `${file} should not contain forbidden public copy: ${phrase}.`);
    }
  }
});

test('V2-4 SCSS defines shared Dao tokens, focus-visible rules, and reduced-motion safeguards', () => {
  const css = REQUIRED_FILES
    .filter((file) => file.endsWith('.scss'))
    .map((file) => readDaoFile(file))
    .join('\n');

  for (const token of [
    '--dao-parchment',
    '--dao-ink',
    '--dao-jade',
    '--dao-bronze',
    '--dao-cinnabar',
    '--dao-gold',
    '--dao-focus',
    '--dao-focus-ring',
  ]) {
    assert.match(css, new RegExp(token), `Dao token ${token} should be present.`);
  }

  assert.match(css, /prefers-reduced-motion/, 'V2-4 SCSS must include reduced-motion handling.');
  assert.match(css, /focus-visible/, 'V2-4 SCSS must include visible focus states.');
  assert.match(css, /\.daoOmenSeal/, 'OmenSeal selectors should be styled.');
  assert.match(css, /\.daoProofSealRow/, 'ProofSealRow selectors should be styled.');
  assert.match(css, /\.daoPressureBadgeRow/, 'PressureBadgeRow selectors should be styled.');
  assert.match(css, /\.daoSourceThreadDrawer/, 'SourceThreadDrawer selectors should be styled.');
  assert.match(css, /\.daoReflectionPlaque/, 'ReflectionPlaque selectors should be styled.');
});

test('shared Omen components are consumed only by approved V2 cutover screens', () => {
  const productionFiles = [
    ...walkSourceFiles(path.join(repoRoot, 'src', 'components')),
    ...walkSourceFiles(path.join(repoRoot, 'src', 'features')),
  ];
  const bannedNames = [
    'OmenSeal',
    'ProofSealRow',
    'PressureBadgeRow',
    'SourceThreadDrawer',
    'ReflectionPlaque',
    'DaoMandateComponentSpecimen',
  ] as const;

  for (const filePath of productionFiles) {
    const relativePath = path.relative(repoRoot, filePath);
    if (relativePath === path.join('src', 'components', 'screens', 'StatusScreen.tsx')) continue;
    if (relativePath === path.join('src', 'features', 'cultivation', 'exact', 'CultivationExactScreen.tsx')) continue;

    const source = readFileSync(filePath, 'utf8');
    for (const name of bannedNames) {
      assert.equal(
        source.includes(name),
        false,
        `${relativePath} should not import/use ${name} outside approved V2 cutovers.`,
      );
    }
  }
});

test('V2-4 fixtures and components render sparse Omen surfaces without route-led default commands', async () => {
  const [
    components,
    fixturesModule,
  ] = await Promise.all([
    import('../../src/ui/daoMandate/index.js'),
    import('../../src/ui/daoMandate/daoMandateComponentFixtures.js'),
  ]);
  const {
    OmenSeal,
    ProofSealRow,
    PressureBadgeRow,
    SourceThreadDrawer,
    ReflectionPlaque,
  } = components as typeof import('../../src/ui/daoMandate/index.js');
  const { DAO_MANDATE_COMPONENT_FIXTURES } = fixturesModule as typeof import('../../src/ui/daoMandate/daoMandateComponentFixtures.js');

  const survivalHtml = renderToStaticMarkup(React.createElement(OmenSeal, {
    omen: DAO_MANDATE_COMPONENT_FIXTURES.survivalReserveThin.currentOmen,
    action: { label: 'Inspect details', onClick: () => undefined },
    showEvidenceCount: true,
  }));
  assert.match(survivalHtml, /Current omen/i);
  assert.match(survivalHtml, /Reserve|Survival|Thin/i);
  assert.doesNotMatch(survivalHtml, /Inspect details|Open Apothecary|Primary Route|Best Next Action/i);

  const proofMissingHtml = renderToStaticMarkup(React.createElement(OmenSeal, {
    omen: DAO_MANDATE_COMPONENT_FIXTURES.proofMissing.currentOmen,
    action: { label: 'Inspect gate', onClick: () => undefined },
  }));
  assert.match(proofMissingHtml, /Inspect gate/i);

  const proofHtml = renderToStaticMarkup(React.createElement(ProofSealRow, {
    seals: DAO_MANDATE_COMPONENT_FIXTURES.proofSeals,
  }));
  assert.match(proofHtml, /Proof seals/i);
  assert.match(proofHtml, /Realm Edge|Qi Threshold|Gate Proof/i);
  assert.doesNotMatch(proofHtml, /\+4/, 'ProofSealRow should default to four visible seals, not hide all proof.');

  const pressureHtml = renderToStaticMarkup(React.createElement(PressureBadgeRow, {
    badges: DAO_MANDATE_COMPONENT_FIXTURES.pressureBadges,
  }));
  assert.match(pressureHtml, /Pressure badges/i);
  assert.match(pressureHtml, /Survival|Forge|Doctrine/i);
  assert.doesNotMatch(pressureHtml, /Open Apothecary|Open Forge|Tune Techniques/i);

  const drawerHtml = renderToStaticMarkup(React.createElement(SourceThreadDrawer, {
    threads: DAO_MANDATE_COMPONENT_FIXTURES.sourceThreads,
  }));
  assert.match(drawerHtml, /aria-expanded="false"/);
  assert.doesNotMatch(drawerHtml, /Herb pouch|Iron ore cache/i, 'SourceThreadDrawer should be closed by default.');

  const reflectionHtml = renderToStaticMarkup(React.createElement(ReflectionPlaque, {
    reflection: DAO_MANDATE_COMPONENT_FIXTURES.reflectionPlaque,
  }));
  assert.match(reflectionHtml, /Reflection|pattern/i);
  assert.doesNotMatch(reflectionHtml, /you failed|Open Forge|Open Apothecary/i);
});
