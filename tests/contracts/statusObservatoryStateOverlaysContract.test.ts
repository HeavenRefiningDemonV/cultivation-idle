import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildStatusObservatoryFixtureSurface } from '../../src/systems/ui/status/statusObservatoryFixtures.js';
import { resolveObservatoryPresentation } from '../../src/systems/ui/status/statusObservatoryPresentation.js';

const repoRoot = process.cwd();
function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const OVERLAY = 'src/ui/status/observatory/StatusObservatoryStateOverlays.tsx';
const SHELL = 'src/ui/status/observatory/StatusLivingStateObservatory.tsx';
const DECREE = 'src/ui/status/observatory/StatusLifeDecreeScroll.tsx';
const SCSS = 'src/ui/status/observatory/StatusLivingStateObservatory.scss';

test('W7.2 overlay file family exists', () => {
  assert.equal(existsSync(path.join(repoRoot, OVERLAY)), true);
  assert.equal(existsSync(path.join(repoRoot, 'src/ui/status/observatory/StatusObservatoryStateOverlays.scss')), true);
});

test('W7.2 shell mounts the state-overlay layer exactly once and threads presentation', () => {
  const shell = read(SHELL);
  assert.match(shell, /import \{ StatusObservatoryStateOverlays \}/);
  const mounts = shell.match(/<StatusObservatoryStateOverlays\b/g) ?? [];
  assert.equal(mounts.length, 1, 'overlay should be mounted exactly once');
  assert.match(shell, /<StatusObservatoryStateOverlays\s+presentation=\{presentation\}\s*\/>/);
});

test('W7.2 overlay visibility follows the resolver fx fields per state (no JSX recompute)', () => {
  const cases: Record<string, { scorch: boolean; ritual: boolean }> = {
    blocked: { scorch: false, ritual: false },
    healthy: { scorch: false, ritual: false },
    postFailure: { scorch: true, ritual: false },
    prestigePressure: { scorch: false, ritual: true },
    contentCap: { scorch: false, ritual: false },
  };
  for (const [stateId, expected] of Object.entries(cases)) {
    const surface = buildStatusObservatoryFixtureSurface(stateId);
    assert.ok(surface, `${stateId} fixture should build`);
    const presentation = resolveObservatoryPresentation(surface);
    assert.equal(presentation.fx.scorchOverlay, expected.scorch, `${stateId} scorchOverlay`);
    assert.equal(presentation.fx.ritualGold, expected.ritual, `${stateId} ritualGold`);
  }
});

test('W7.2 overlay is display-only and never duplicates the decree chop or canopy route', () => {
  const overlay = read(OVERLAY);
  assert.doesNotMatch(overlay, /from ['"].*stores\//, 'overlay must not import stores');
  assert.doesNotMatch(overlay, /\.getState\s*\(/, 'overlay must not read stores');
  assert.doesNotMatch(overlay, /RewardService|grantRewards|spendCurrency|performPrestigeReset|usePrestigeStore/, 'overlay must not own rewards/prestige');
  assert.doesNotMatch(overlay, /breakthrough\s*\(|attemptBreakthrough/, 'overlay must not trigger breakthrough');
  assert.doesNotMatch(overlay, /onAction|performStatusRouteTarget|openDaoHeartModal|openSpiritRootObservation/, 'overlay must not route — the canopy edict owns routing');
  assert.doesNotMatch(overlay, /<table|<tr|<td|<ul|<ol/, 'overlay must not use list/table markup');
  assert.doesNotMatch(overlay, /InkWaxSeal/, 'overlay must not render a decree chop — the Life Decree scroll owns the per-state seal');
});

test('W7.2 the Life Decree scroll owns the per-state seal with the artifact emphasis (postFailure 敗 / prestige 轉生)', () => {
  const decree = read(DECREE);
  assert.match(decree, /statusLifeDecree__stateSeal/, 'decree scroll renders the state seal');
  assert.match(decree, /postFailure:\s*\{\s*chars:\s*'敗'/);
  assert.match(decree, /prestigePressure:\s*\{\s*chars:\s*'轉生'/);
});

test('W7.2 state-keyed void backdrop exists, is token-derived, and never defaults to brown', () => {
  const scss = read(SCSS);
  assert.match(scss, /\[data-observatory-visual-state='prestigePressure'\]\s*\.obsStageViewport/);
  assert.match(scss, /\[data-observatory-visual-state='postFailure'\]\s*\.obsStageViewport/);
  assert.match(scss, /--obs-void-bronze-/, 'prestige void uses the bronze tokens');
  assert.match(scss, /--obs-void-cinnabar-/, 'postFailure void uses the cinnabar tokens');
  // The slate-teal-never-brown rule must remain.
  assert.match(scss, /slate-teal, never brown/);
});
