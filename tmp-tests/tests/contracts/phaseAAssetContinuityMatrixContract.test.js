import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const matrixMdPath = 'docs/ui/phase-a-asset-continuity-matrix.md';
const auditMdPath = 'docs/ui/phase-a-screen-recovery-audit.md';
const matrixJsonPath = 'docs/ui/phase-a-asset-continuity-matrix.json';

const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');

void test('phase A.2 artifacts exist', () => {
  [matrixMdPath, auditMdPath, matrixJsonPath].forEach((relPath) => {
    assert.equal(fs.existsSync(path.join(root, relPath)), true, `${relPath} should exist`);
  });
});

void test('matrix json parses and has required top-level keys', () => {
  const parsed = JSON.parse(read(matrixJsonPath));
  ['packet', 'screenOrder', 'screens'].forEach((key) => {
    assert.equal(Object.prototype.hasOwnProperty.call(parsed, key), true, `matrix json missing ${key}`);
  });
  assert.equal(Array.isArray(parsed.screenOrder), true, 'screenOrder should be an array');
  assert.equal(Array.isArray(parsed.screens), true, 'screens should be an array');
});

void test('screenOrder includes locked primary order with bounties/expeditions rule', () => {
  const parsed = JSON.parse(read(matrixJsonPath));
  const order = new Set(parsed.screenOrder);

  [
    'path_life_start',
    'cultivation',
    'status',
    'world',
    'manual_pavilion',
    'techniques',
    'apothecary',
    'forge',
    'prestige',
  ].forEach((id) => assert.equal(order.has(id), true, `screenOrder missing ${id}`));

  const hasCombined = order.has('bounties_expeditions');
  const hasSplit = order.has('bounties') && order.has('expeditions');
  assert.equal(hasCombined || hasSplit, true, 'screenOrder must contain bounties_expeditions or both bounties and expeditions');
});

void test('primary screen entries contain required core fields', () => {
  const parsed = JSON.parse(read(matrixJsonPath));
  const byId = Object.fromEntries(parsed.screens.map((entry) => [entry.id, entry]));

  const primaryIds = [
    'path_life_start',
    'cultivation',
    'status',
    'world',
    'manual_pavilion',
    'techniques',
    'apothecary',
    'forge',
    'prestige',
  ];

  if (byId.bounties_expeditions) {
    primaryIds.push('bounties_expeditions');
  } else {
    primaryIds.push('bounties', 'expeditions');
  }

  const requiredFields = [
    'ownerPacket',
    'codeFiles',
    'baseArtToPreserve',
    'baseArtToRestore',
    'duplicateOrConflictingSystems',
    'missingUiElements',
    'currentBreakages',
    'noGoDestructiveMoves',
    'laterEnhancementBacklog',
    'newArtNeed',
    'cutoverStatus',
    'cutoverBlockingReasons',
  ];

  primaryIds.forEach((id) => {
    assert.equal(Boolean(byId[id]), true, `missing primary screen entry: ${id}`);
    requiredFields.forEach((field) => {
      assert.equal(Object.prototype.hasOwnProperty.call(byId[id], field), true, `${id} missing field ${field}`);
    });
  });
});

void test('markdown matrix includes required section markers', () => {
  const source = read(matrixMdPath);
  ['Preserve', 'Enhance', 'Create-New', 'Primary Recovery Order', 'Cross-Screen Regression Patterns'].forEach((marker) => {
    assert.match(source, new RegExp(marker), `matrix markdown should include ${marker}`);
  });
});

void test('audit contains named primary screen sections and owner packet mapping coverage', () => {
  const source = read(auditMdPath);
  [
    'path_life_start',
    'cultivation',
    'status',
    'world',
    'manual_pavilion',
    'techniques',
    'apothecary',
    'forge',
    'bounties_expeditions',
    'prestige',
  ].forEach((id) => {
    assert.match(source, new RegExp(id), `audit should include screen section ${id}`);
  });

  ['A.4', 'A.5', 'A.6', 'A.7'].forEach((packet) => {
    assert.match(source + '\n' + read(matrixMdPath), new RegExp(packet), `matrix/audit should include owner packet ${packet}`);
  });
});

// Runtime files must remain untouched for A.2 by manual QA via:
//   git diff --name-only
// This contract intentionally does not enforce git-state assertions.
