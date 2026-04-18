import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('P10 layout stability reserves fixed slots for dynamic planning content', async () => {
  const scss = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  assert.match(scss, /\.outskirtsExactTop__subtitle\s*\{[^}]*min-height:\s*16px/s);
  assert.match(scss, /\.outskirtsExactField__identity\s*\{[^}]*min-height:\s*92px/s);
  assert.match(scss, /\.outskirtsExactField__chip\s*\{[^}]*min-width:\s*86px/s);
  assert.match(scss, /\.outskirtsExpectedCard__materials\s*\{[^}]*min-height:\s*46px/s);
  assert.match(scss, /\.outskirtsExpectedCard__bountyProgress\s*\{[^}]*min-height:\s*26px/s);
  assert.match(scss, /\.outskirtsExpectedCard__efficiency\s*\{[^}]*min-height:\s*36px/s);
  assert.match(scss, /\.outskirtsExpectedCard__autoRepeat\s*\{[^}]*min-height:\s*28px/s);
  assert.match(scss, /\.outskirtsGrindSummaryCard__label,[^}]*\.outskirtsGrindSummaryCard__value\s*\{[^}]*min-height:\s*14px/s);
});

void test('P10 planning scaffold keeps fixed-width side rails and stable progression/action gutters', async () => {
  const scss = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  assert.match(scss, /grid-template-columns:\s*252px\s+minmax\(0, 1fr\)\s+252px/);
  assert.match(scss, /\.outskirtsEncounterProgressStrip\s*\{[^}]*width:\s*min\(868px, 100%\)/s);
  assert.match(scss, /\.outskirtsExactActionZone\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)\s+260px/s);
});
