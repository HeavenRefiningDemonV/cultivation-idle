import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { FX_FOUNDATION_COMPLIANCE_CHECKLIST } from '../../src/ui/fx/diagnostics/foundationComplianceChecklist.js';

const root = process.cwd();

const REQUIRED_IDS = [
  'dom-readable-ui',
  'no-pixi-text',
  'provider-store-boundary',
  'single-app-provider',
  'use-primitives-first',
  'local-before-global',
  'quality-floor-respected',
  'reduced-motion-respected',
  'static-fallback-defined',
  'no-new-global-z',
  'screen-no-store-coupling-inside-fx',
  'content-overlay-readable',
];

void test('fx foundation compliance checklist: has required ids and valid category values', () => {
  assert.equal(FX_FOUNDATION_COMPLIANCE_CHECKLIST.length >= 12, true);

  const ids = FX_FOUNDATION_COMPLIANCE_CHECKLIST.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, 'checklist ids must be unique');
  REQUIRED_IDS.forEach((id) => assert.equal(ids.includes(id), true, `${id} should exist`));

  const validCategories = new Set([
    'ownership',
    'quality',
    'layering',
    'fallback',
    'integration',
    'readability',
  ]);

  FX_FOUNDATION_COMPLIANCE_CHECKLIST.forEach((entry) => {
    assert.equal(validCategories.has(entry.category), true, `${entry.id} category should be valid`);
    assert.equal(entry.title.trim().length > 0, true, `${entry.id} should have title`);
    assert.equal(entry.rule.trim().length > 0, true, `${entry.id} should have rule`);
    assert.equal(entry.whyItMatters.trim().length > 0, true, `${entry.id} should have whyItMatters`);
  });
});

void test('fx foundation compliance checklist: docs include required ids/rules', () => {
  const docPath = path.join(root, 'docs/ui/fx-foundation-compliance-checklist.md');
  assert.equal(fs.existsSync(docPath), true);

  const doc = fs.readFileSync(docPath, 'utf8');
  REQUIRED_IDS.forEach((id) => {
    assert.match(doc, new RegExp(id));
  });
});
