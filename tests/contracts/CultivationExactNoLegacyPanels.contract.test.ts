import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('Cultivation Exact pure screen owns exact regions and keeps legacy panels out of default view', () => {
  const source = readFileSync('src/features/cultivation/exact/CultivationExactScreen.tsx', 'utf8');

  for (const required of [
    'cultivationExactPage',
    'data-testid={surface.meta.rootTestId}',
    'data-region="top-ribbon"',
    'data-region="left-milestone-seals"',
    'data-region="center-altar"',
    'data-region="right-doctrine-rail"',
    'data-region="breakthrough-seal"',
    'data-region="qi-rail"',
    'data-testid="cultivation-qi-lane"',
    'data-region="command-deck"',
    'DantianOrb',
    'VerseMiniBar',
    'QiLotusIcon',
  ]) {
    assert.equal(source.includes(required), true, `missing exact screen token ${required}`);
  }

  for (const forbidden of [
    'useGameStore',
    'useActivityStore',
    'useCultivationStore',
    'useContentStore',
    'useInventoryStore',
    'usePrestigeStore',
    'RewardService',
    'createCultivationExactMockupFixture',
    'cultivationScreenRoot',
    'cultivationSideRails',
    'cultivationTruthStack',
    'daoHeartSealButton',
    'data-region="life-cycle-whisper"',
    'cultivationExactLifeCycleSeal',
    'Life Cycle',
  ]) {
    assert.equal(source.includes(forbidden), false, `pure exact screen must not include ${forbidden}`);
  }

  const defaultViewSource = source.split('function CultivationExactDrawerLayer')[0] ?? source;
  for (const legacyDefault of [
    '<RunCompass',
    '<CultivationBreakthroughPanel',
    '<CultivationDoctrineSummary',
    '<MandateSeal',
    '<RequirementLedger',
    '<ReadinessLedger',
    '<SourceRouteSlip',
    'Threshold Mandate',
    'Breakthrough Proof',
    'Primary Route',
    'Best Next Action',
    'Biggest Shortfall',
  ]) {
    assert.equal(defaultViewSource.includes(legacyDefault), false, `default exact view must not permanently render ${legacyDefault}`);
  }

  for (const required of [
    'OmenSeal',
    'ProofSealRow',
    'data-region="cultivation-compact-omen"',
    'testId="cultivation-compact-omen-seal"',
    'testId="cultivation-threshold-proof-seals"',
  ]) {
    assert.equal(defaultViewSource.includes(required), true, `default exact view must include V2 compact omen token ${required}`);
  }
});

void test('Cultivation Exact SCSS uses named grid regions and preserves nav reservation', () => {
  const scss = readFileSync('src/features/cultivation/exact/CultivationExactScreen.scss', 'utf8');

  for (const required of [
    '.cultivationExactPage',
    'grid-template-areas',
    "'top top top'",
    "'left altar right'",
    "'. qi .'",
    "'. command .'",
    '--cult-exact-nav-h',
    '.cultivationExactTopRibbon',
    '.cultivationExactMilestoneRail',
    '.cultivationExactAltarField',
    '.cultivationExactDoctrineRail',
    '.cultivationExactQiRail',
    '.cultivationExactCommandDeck',
    'bar_long',
  ]) {
    assert.equal(scss.includes(required), true, `missing SCSS exact contract ${required}`);
  }

  for (const forbidden of ['GPU', 'CPU', 'LAT', 'N/A', 'linear-gradient(135deg, #1e3a8a', '.cultivationExactLifeCycleSeal']) {
    assert.equal(scss.includes(forbidden), false, `SCSS must not include debug/dashboard styling token ${forbidden}`);
  }
});
