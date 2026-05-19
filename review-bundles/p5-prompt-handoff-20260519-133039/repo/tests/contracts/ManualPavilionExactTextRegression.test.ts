import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildManualSpineDisplayTitle,
  classifyManualSpineTitleLength,
} from '../../src/features/world/manualPavilionExact/manualPavilionExactPresentation.js';

function readExactModuleSources(): string {
  const dir = path.resolve('src/features/world/manualPavilionExact');
  return fs
    .readdirSync(dir)
    .filter((fileName) => /\.(ts|tsx|scss)$/.test(fileName))
    .map((fileName) => fs.readFileSync(path.join(dir, fileName), 'utf8'))
    .join('\n');
}

test('manual pavilion exact production sources do not expose prototype or misleading copy', () => {
  const source = readExactModuleSources();

  assert.doesNotMatch(source, /Painted Spine Shelf/);
  assert.doesNotMatch(source, /Not configured/);
  assert.doesNotMatch(source, /path-aligned manual guaranteed/i);
  assert.doesNotMatch(source, /Study Later/);
});

test('manual pavilion exact spine states do not use geometry-changing transforms', () => {
  const scss = fs.readFileSync(
    path.resolve('src/features/world/manualPavilionExact/ManualPavilionExactScreen.scss'),
    'utf8',
  );

  assert.doesNotMatch(scss, /manualPavilionSpine--selected\s*\{[^}]*translateY/s);
  assert.doesNotMatch(scss, /manualPavilionSpine:hover\s*\{[^}]*translate/s);
});

test('manual pavilion exact spine display titles preserve words and apostrophes', () => {
  assert.equal(
    buildManualSpineDisplayTitle({ techniqueId: 'tech_heavens_pulse', fullTitle: "Heaven's Pulse" }),
    "Heaven's Pulse",
  );
  assert.equal(
    buildManualSpineDisplayTitle({ techniqueId: 'tech_stonebreaker_fist', fullTitle: 'Stonebreaker Fist' }),
    'Stonebreaker Fist',
  );
  assert.equal(
    buildManualSpineDisplayTitle({ techniqueId: 'tech_killing_rhythm_manual', fullTitle: 'Killing Rhythm Manual' }),
    'Killing Rhythm',
  );
  assert.equal(
    buildManualSpineDisplayTitle({ techniqueId: 'tech_enduring_pulse', fullTitle: 'Enduring Pulse of the Quiet Mountain' }),
    'Enduring Pulse',
  );
  assert.equal(classifyManualSpineTitleLength("Heaven's Pulse"), 'medium');
});

test('manual pavilion exact spine titles use painted text, not dark title boxes', () => {
  const scss = fs.readFileSync(
    path.resolve('src/features/world/manualPavilionExact/ManualPavilionExactScreen.scss'),
    'utf8',
  );
  const titleBlock = scss.match(/\.manualPavilionSpine__title\s*\{(?<body>[^}]*)\}/)?.groups?.body ?? '';

  assert.doesNotMatch(titleBlock, /background\s*:/);
  assert.doesNotMatch(titleBlock, /box-shadow\s*:/);
  assert.doesNotMatch(titleBlock, /border-radius\s*:/);
  assert.doesNotMatch(titleBlock, /overflow-wrap\s*:\s*anywhere/);
  assert.doesNotMatch(titleBlock, /word-break\s*:/);
  assert.match(scss, /\.manualPavilionSpine__titleText\s*\{/);
  assert.match(scss, /-webkit-text-stroke/);
  assert.match(scss, /text-shadow/);
  assert.match(scss, /white-space:\s*nowrap/);
  assert.match(scss, /\.manualPavilionSpine__meta\s*\{[^}]*visibility:\s*hidden/s);
});
