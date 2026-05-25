import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const FORBIDDEN_DEFAULT_LABELS = [
  'Current Omen',
  'Gate Proof',
  'Recent Omens',
  'Source Thread',
  'Proof Detail',
  'Preparation Health',
  'Mandate Lens',
  'Module Source-Sink',
  'Threshold Omen',
  'Omen evidence',
  'Dao Mandate Interface',
];

const EXPECTED_CONCRETE_LABELS = [
  'Cultivation Base',
  'Mission Requirements',
  'Gate Readiness',
  'Current Bottleneck',
  'Best Improvements',
  'Safety Net',
  'Current Work',
  'Build & Preparation',
  'Recent Changes',
  'Details',
  'How calculated',
];

test('copy policy documents forbidden public Dao labels and concrete replacements', () => {
  const docs = [
    read('AGENTS.md'),
    read('docs/codex-packet-rules.md'),
    read('docs/release/status_v3_dao_decommission_plan.md'),
  ].join('\n');

  for (const forbidden of FORBIDDEN_DEFAULT_LABELS) {
    assert.match(docs, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Policy should enumerate forbidden label ${forbidden}.`);
  }

  for (const expected of EXPECTED_CONCRETE_LABELS) {
    assert.match(docs, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Policy should enumerate concrete label ${expected}.`);
  }
});
