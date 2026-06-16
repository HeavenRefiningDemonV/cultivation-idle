import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildJaggedPath,
  buildShallowSPath,
  jaggedPoints,
} from '../../src/ui/status/observatory/fx/bridgeThreadGeometry.js';

const repoRoot = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function parseCoords(d: string): Array<{ x: number; y: number }> {
  return [...d.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map((match) => ({
    x: Number.parseFloat(match[1]),
    y: Number.parseFloat(match[2]),
  }));
}

test('buildJaggedPath is deterministic for a fixed seed', () => {
  assert.equal(buildJaggedPath(120, 48, 9, 7), buildJaggedPath(120, 48, 9, 7));
  // A different seed should generally produce a different jag.
  assert.notEqual(buildJaggedPath(120, 48, 9, 7), buildJaggedPath(120, 48, 9, 8));
});

test('buildJaggedPath returns segments+1 points spanning exactly 0..width', () => {
  const width = 200;
  const segments = 8;
  const coords = parseCoords(buildJaggedPath(width, 60, segments, 13));
  assert.equal(coords.length, segments + 1);
  assert.equal(coords[0].x, 0);
  assert.equal(coords[coords.length - 1].x, width);
});

test('buildJaggedPath clamps every point to the 0..height range', () => {
  const height = 40;
  const coords = parseCoords(buildJaggedPath(150, height, 10, 99));
  for (const point of coords) {
    assert.ok(point.y >= 0 && point.y <= height, `y ${point.y} out of 0..${height}`);
  }
});

test('jaggedPoints anchors both endpoints on the centre line', () => {
  const height = 50;
  const points = jaggedPoints(100, height, 6, 3);
  assert.equal(points[0].y, height / 2);
  assert.equal(points[points.length - 1].y, height / 2);
});

test('buildShallowSPath spans the full width as a cubic curve', () => {
  const d = buildShallowSPath(180, 60);
  assert.match(d, /^M0 /);
  assert.match(d, /C/);
  assert.match(d, /180\.00 30\.00$/);
});

test('the fx barrel re-exports all six primitives', () => {
  const barrel = read('src/ui/status/observatory/fx/index.ts');
  for (const name of [
    'useRitualMotion',
    'BreathingGlow',
    'BridgeThread',
    'GlintPath',
    'QiThreadPath',
    'SealStamp',
  ]) {
    assert.match(barrel, new RegExp(`\\b${name}\\b`), `fx barrel should export ${name}`);
  }
  assert.match(barrel, /buildJaggedPath/, 'fx barrel should expose the testable jag generator');
});
