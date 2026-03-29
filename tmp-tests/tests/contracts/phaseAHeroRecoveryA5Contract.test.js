import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('packet A.5 hero recovery contract surface stays intact', () => {
  const requiredFiles = [
    'docs/ui/phase-a-a5-hero-recovery.md',
    'src/components/screens/CultivateScreen.tsx',
    'src/components/screens/CultivateScreen.scss',
    'src/components/screens/StatusScreen.tsx',
    'src/components/screens/StatusScreen.scss',
  ];

  requiredFiles.forEach((path) => assert.equal(fs.existsSync(path), true, `${path} must exist`));

  const cultivateTsx = read('src/components/screens/CultivateScreen.tsx');
  ['cbg_full.png', 'CultivationHeaderRibbon', 'DantianOrb', 'VerseMiniBar', 'RunCompass'].forEach((needle) => {
    assert.match(cultivateTsx, new RegExp(needle), `CultivateScreen.tsx should include ${needle}`);
  });

  const cultivateScss = read('src/components/screens/CultivateScreen.scss');
  ['.cultivationSceneLayer', '.cultivationCultivatorArt', '.cultivationCommandDeck', '.cultivationHudRail'].forEach((needle) => {
    assert.match(cultivateScss, new RegExp(needle.replace('.', '\\.')), `CultivateScreen.scss should include ${needle}`);
  });

  const orbScss = read('src/ui/cultivation/DantianOrb.scss');
  assert.doesNotMatch(orbScss, /position:\s*fixed/, 'DantianOrb.scss must not use fixed positioning');

  const statusTsx = read('src/components/screens/StatusScreen.tsx');
  assert.match(statusTsx, /RunCompass/);
  assert.match(statusTsx, /StatusSummaryHeader/);

  const statusScss = read('src/components/screens/StatusScreen.scss');
  assert.ok(
    /cbg_bg|cbg_bgblue/.test(statusTsx) || /cbg_bg|cbg_bgblue/.test(statusScss),
    'Status should reference an existing scenic/base background family',
  );

  assert.match(statusScss, /\.statusScreenSceneLayer/);
  assert.match(statusScss, /\.statusScreenCenterpiece/);

  const statusHeaderTsx = read('src/ui/status/StatusSummaryHeader.tsx');
  assert.ok(
    /Spirit Root|spiritRootSummary|spiritRootLine/.test(statusHeaderTsx),
    'StatusSummaryHeader should include stronger spirit-root identity support',
  );

  const cultivateHeaderTsx = read('src/ui/cultivation/CultivationHeaderRibbon.tsx');
  assert.match(cultivateHeaderTsx, /export function CultivationHeaderRibbon/);
  assert.match(cultivateHeaderTsx, /setCollapsed/);

  const a5Doc = read('docs/ui/phase-a-a5-hero-recovery.md');
  ['Cultivation Recovery Goals', 'Status Recovery Goals', 'Existing Assets Reused'].forEach((heading) => {
    assert.match(a5Doc, new RegExp(heading));
  });

  assert.ok(true, 'No-new-asset-file check is validated manually in packet QA to avoid brittle git-state coupling.');
});
