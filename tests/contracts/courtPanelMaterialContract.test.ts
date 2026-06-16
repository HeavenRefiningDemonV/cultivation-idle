import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * W1 — The Tempering Court panel material + shared sprite. Source-text contract
 * (jsdom has no layout engine; pixel parity is the Playwright gate). Asserts the
 * 10 stacked panel layers, the mask-composite frame trick, the banner/tag/
 * watermark material, and that <CourtDefs/> carries the artifact-exact ids the
 * Court regions/figure reference (incl. the artifact grainF = desaturate, distinct
 * from the Observatory sprite's tinted grainF).
 */

async function source(relPath: string): Promise<string> {
  return fs.readFile(path.resolve(process.cwd(), relPath), 'utf8');
}

test('CourtPanel renders the 10 stacked material layers and references the grain filter', async () => {
  const tsx = await source('src/ui/court/CourtPanel.tsx');
  for (const layer of [
    'courtPanel__grain',
    'courtPanel__watermark',
    'courtPanel__content',
    'courtPanel__gframe',
    'courtPanel__gframe2',
    'courtPanel__gc--tl',
    'courtPanel__gc--tr',
    'courtPanel__gc--bl',
    'courtPanel__gc--br',
    'courtPanel__banner',
    'courtPanel__tag',
    'courtPanel__roller',
  ]) {
    assert.ok(tsx.includes(layer), `CourtPanel.tsx missing layer class ${layer}`);
  }
  assert.ok(tsx.includes('url(#grainF)'), 'CourtPanel grain must reference the shared #grainF filter');
  assert.ok(tsx.includes('role="region"'), 'CourtPanel must be a labelled region');
});

test('courtPanel.scss preserves the gold double-frame (mask-composite) and banner/tag material', async () => {
  const scss = await source('src/ui/court/courtPanel.scss');
  // The mask-exclude is what makes the gold a FRAME (border only), not a filled box.
  assert.ok(scss.includes('mask-composite: exclude'), 'gframe must use mask-composite: exclude');
  assert.ok(scss.includes('-webkit-mask-composite: xor'), 'gframe must use -webkit-mask-composite: xor');
  assert.ok(scss.includes('var(--court-frame-hi)'), 'gframe gradient must be tokenised');
  assert.ok(scss.includes('var(--court-jade-ink)'), 'banner must use the jade-cloth token');
  assert.ok(scss.includes('.courtPanel__banner::before'), 'banner must have diamond end-caps');
  assert.ok(scss.includes('var(--court-seal-text)'), 'tag glyphs must be tokenised');
});

test('CourtDefs carries the artifact-exact sprite ids (grain, cores, per-path meridian gradients)', async () => {
  const defs = await source('src/ui/court/CourtDefs.tsx');
  // Artifact grainF is a desaturate (NOT the Observatory sprite's brown tint).
  assert.ok(defs.includes('id="grainF"'), 'CourtDefs must define grainF');
  assert.ok(defs.includes('type="saturate"') && defs.includes('values="0"'), 'CourtDefs grainF must desaturate');
  for (const id of [
    'cinnDisc',
    'jadeRad',
    'goldRad',
    'glowJ',
    'qiCore',
    'qiAura',
    'emberCore',
    'meridP_martial',
    'meridP_earth',
    'meridP_heaven',
    'starHalo',
    'forgeGlow',
  ]) {
    assert.ok(defs.includes(`id="${id}"`), `CourtDefs missing sprite id ${id}`);
  }
});

test('the Court token bridge exposes the palette (--court-*) incl. the 3 artifact accent tokens', async () => {
  const tokens = await source('src/ui/court/courtTokens.scss');
  for (const tok of [
    '--court-jade-deep:', // artifact --jade-deep #0f6f5a
    '--court-gold-bright:', // artifact --gold-bright #b2832d
    '--court-cinnabar-bright:', // artifact --cinnabar-bright #a94835
    '--court-serif:',
    '--court-kai:',
    '--court-frame-hi:',
    '--court-paper-deep:',
  ]) {
    assert.ok(tokens.includes(tok), `paperInkTokens.scss missing Court token ${tok}`);
  }
});
