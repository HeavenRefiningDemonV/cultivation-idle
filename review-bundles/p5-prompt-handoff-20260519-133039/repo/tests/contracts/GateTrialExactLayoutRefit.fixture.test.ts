import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('Gate Trial Exact T1 root grid uses remaining vertical space for scenic stage', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '--gate-scenic-min-height',
    '--gate-page-pad-bottom',
    '--gate-left-rail-top-offset',
    '--gate-right-rail-top-offset',
    '--gate-summary-lift',
    'grid-template-areas:',
    "'top top top'",
    "'left scenic right'",
    "'left rail summary'",
    "'. cta summary'",
  ]) {
    assert.equal(scss.includes(required), true, `missing T1 layout token ${required}`);
  }

  assert.equal(
    scss.includes('minmax(var(--gate-scenic-min-height), 1fr)'),
    true,
    'scenic grid row must absorb remaining vertical space',
  );

  assert.equal(
    scss.includes('minmax(0, var(--gate-scenic-height))'),
    false,
    'root grid must not cap scenic row with old fixed scenic height',
  );
});

void test('Gate Trial Exact T1 removes stale compact SCSS stubs that fight final layout', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const forbidden of [
    '.gateTrialScenicStage{position:relative;height:100%;border:1px solid rgba(70,62,54,.38);border-radius:16px;background:#7e7c74;overflow:hidden}',
    '.gateTrialReadinessSeal{position:absolute;left:50%;bottom:20%;',
    '.gateTrialGuardianPlaque{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);background:rgba(48,43,36,.92);',
    '.gateTrialTrialSummary__row{display:flex;justify-content:space-between}',
  ]) {
    assert.equal(scss.includes(forbidden), false, `stale compact layout stub remains: ${forbidden}`);
  }
});

void test('Gate Trial Exact T1 slots use independent mockup-aligned vertical offsets', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialExactPage__leftRail',
    'padding-top: var(--gate-left-rail-top-offset)',
    'align-items: flex-start',
    '.gateTrialExactPage__rightRail',
    'padding-top: var(--gate-right-rail-top-offset)',
    '.gateTrialExactPage__summaryDock',
    'transform: translateY(calc(-1 * var(--gate-summary-lift)))',
    '.gateTrialExactPage__scenicSlot',
    'padding-top: 0',
    'padding-bottom: 0',
  ]) {
    assert.equal(scss.includes(required), true, `missing T1 slot layout token ${required}`);
  }

  assert.equal(
    scss.includes('padding-top: clamp(44px, 4.2vh, 64px)'),
    false,
    'scenic slot must not retain old large top padding',
  );
});

void test('Gate Trial Exact T1 cards have explicit mockup-scale heights', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialMinimumChecklist',
    'height: clamp(640px, 58vh, 680px)',
    '.gateTrialRecommendedPanel',
    'height: clamp(600px, 55vh, 645px)',
    '.gateTrialTrialSummary',
    'height: clamp(210px, 20.5vh, 242px)',
  ]) {
    assert.equal(scss.includes(required), true, `missing T1 card height token ${required}`);
  }
});

void test('Gate Trial Exact T2 preserves T1 layout refit while allowing CTA de-green', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '--gate-scenic-min-height',
    '--gate-page-pad-bottom',
    '--gate-left-rail-top-offset',
    '--gate-right-rail-top-offset',
    '--gate-summary-lift',
    'minmax(var(--gate-scenic-min-height), 1fr)',
    '.gateTrialExactPage__leftRail',
    '.gateTrialExactPage__rightRail',
    '.gateTrialExactPage__summaryDock',
    '.gateTrialExactPage__readinessRailSlot',
    '.gateTrialExactPage__ctaSlot',
  ]) {
    assert.equal(scss.includes(required), true, `T2 must preserve T1 layout token ${required}`);
  }

  assert.equal(
    scss.includes('minmax(0, var(--gate-scenic-height))'),
    false,
    'T2 must not regress root grid to old fixed scenic row',
  );
});
