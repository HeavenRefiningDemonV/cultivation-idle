import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';

const repoRoot = process.cwd();

const FORBIDDEN_LEDGER_COPY = [
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
  'Mandate points elsewhere',
  'Current Mandate',
  'proof source handoff',
  'status snapshot only',
  'cultivation compact only',
  'proof sealed',
  'source sealed',
  'No dominant omen',
  'Mercy proof',
  'Gate proof',
  'Dantian proof',
];

const FORBIDDEN_FILLER = [
  'Waiting',
  'Stay the course',
  'No additional action needed right now.',
  'No stronger corrective route is surfaced right now.',
  'Reason 1',
  'Reason 2',
];

function flattenText(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenText(entry));
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => flattenText(entry));
  }
  return [];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readIfExists(relPath: string): string {
  const absPath = path.join(repoRoot, relPath);
  return existsSync(absPath) ? readFileSync(absPath, 'utf8') : '';
}

function publicStatusRenderText(): string {
  return [
    'src/components/screens/StatusScreen.tsx',
    'src/components/screens/StatusScreen.scss',
    'src/ui/status/ledger/StatusLedgerPage.tsx',
    'src/ui/status/ledger/StatusLedgerHero.tsx',
    'src/ui/status/ledger/StatusMetricStrip.tsx',
    'src/ui/status/ledger/StatusLedgerCard.tsx',
    'src/ui/status/ledger/StatusLedgerRows.tsx',
    'src/ui/status/ledger/StatusDetailsDrawer.tsx',
    'src/ui/status/ledger/StatusLedgerPage.scss',
    'src/ui/status/ledger/index.ts',
    'src/systems/ui/status/statusRouteActions.ts',
  ].map(readIfExists).join('\n');
}

test('Status Ledger runtime surface uses concrete copy only', () => {
  const ledger = buildStatusDashboardSurface().statusLedger;
  const text = flattenText(ledger);

  for (const forbidden of FORBIDDEN_LEDGER_COPY) {
    assert.equal(
      text.some((entry) => entry.includes(forbidden)),
      false,
      `Status Ledger must not expose forbidden default public copy: ${forbidden}`,
    );
  }

  for (const filler of FORBIDDEN_FILLER) {
    assert.equal(
      text.some((entry) => entry.includes(filler)),
      false,
      `Status Ledger must not expose filler copy: ${filler}`,
    );
  }
});

test('Status public render files do not contain retired Dao/Omen UI copy or imports', () => {
  const text = publicStatusRenderText();

  for (const forbidden of [
    ...FORBIDDEN_LEDGER_COPY,
    'OmenSeal',
    'ProofSealRow',
    'SourceThreadDrawer',
    'ReflectionPlaque',
    'PressureBadgeRow',
    'performDaoMandateRouteAction',
    'DaoMandateRoute',
    'actionFromProofSeal',
    'actionFromReflection',
    'actionFromSourceThread',
    'statusV2',
  ]) {
    assert.doesNotMatch(text, new RegExp(escapeRegex(forbidden)), `${forbidden} must not appear in public Status render files.`);
  }
});

test('Status public render files contain concrete Status Ledger labels', () => {
  const text = publicStatusRenderText();

  for (const expected of [
    'Cultivation Base',
    'Mission Requirements',
    'Best Improvements',
    'Safety Net',
    'Identity & Doctrine',
    'Current Work',
    'Build & Preparation',
    'Recent Changes',
    'How calculated',
    'Next Major Goal',
    'Main Bottleneck',
  ]) {
    assert.match(text, new RegExp(escapeRegex(expected)), `${expected} should appear in public Status Ledger render files.`);
  }
});

test('Status Ledger runtime surface includes concrete section vocabulary', () => {
  const text = flattenText(buildStatusDashboardSurface().statusLedger).join('\n');

  for (const expected of [
    'Cultivation Base',
    'Mission Requirements',
    'Best Improvements',
    'Safety Net',
    'Current Work',
    'Build & Preparation',
    'Identity & Doctrine',
    'Recent Changes',
    'How calculated',
  ]) {
    assert.match(text, new RegExp(escapeRegex(expected)));
  }
});
