import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  buildFreshRunAcceptanceReport,
  type FreshSaveManualResult,
} from '../../../src/services/diagnostics/release/freshRunAcceptanceReport.js';
import type { FreshSaveRouteResult } from '../../helpers/release/freshSaveRouteTypes.js';

const execFileAsync = promisify(execFile);

const makeAutomatedNormalResult = (): FreshSaveRouteResult => ({
  routeId: 'normal',
  policy: 'balanced',
  automationMode: 'automated_smoke_blocking',
  isBlockingSmokeRoute: true,
  representativePath: 'martial',
  checkpoints: [
    { checkpointId: 'life_started', elapsedMsSinceLifeStart: 0, source: 'event' },
    { checkpointId: 'path_selected', elapsedMsSinceLifeStart: 1, source: 'runner' },
    { checkpointId: 'heart_law_selected', elapsedMsSinceLifeStart: 2, source: 'runner' },
    { checkpointId: 'pinewind_ready', elapsedMsSinceLifeStart: 3, source: 'runner' },
    { checkpointId: 'gate_1_available', elapsedMsSinceLifeStart: 4, source: 'event' },
    { checkpointId: 'gate_1_resolved', elapsedMsSinceLifeStart: 5, source: 'event' },
    { checkpointId: 'foundation_entry', elapsedMsSinceLifeStart: 6, source: 'event' },
    { checkpointId: 'stonecrag_entered', elapsedMsSinceLifeStart: 7, source: 'event' },
    { checkpointId: 'gate_2_available', elapsedMsSinceLifeStart: 8, source: 'event' },
    { checkpointId: 'gate_2_resolved', elapsedMsSinceLifeStart: 9, source: 'event' },
    { checkpointId: 'core_formation_entry', elapsedMsSinceLifeStart: 10, source: 'event' },
    { checkpointId: 'spirit_cavern_entered', elapsedMsSinceLifeStart: 11, source: 'event' },
    { checkpointId: 'gate_3_available', elapsedMsSinceLifeStart: 12, source: 'event' },
    { checkpointId: 'gate_3_resolved', elapsedMsSinceLifeStart: 13, source: 'event' },
    { checkpointId: 'nascent_soul_entry', elapsedMsSinceLifeStart: 14, source: 'event' },
    { checkpointId: 'lotusford_entered', elapsedMsSinceLifeStart: 15, source: 'event' },
    { checkpointId: 'gate_4_available', elapsedMsSinceLifeStart: 16, source: 'event' },
    { checkpointId: 'gate_4_resolved', elapsedMsSinceLifeStart: 17, source: 'event' },
    { checkpointId: 'soul_formation_entry', elapsedMsSinceLifeStart: 18, source: 'event' },
    { checkpointId: 'ironpeak_entered', elapsedMsSinceLifeStart: 19, source: 'event' },
    { checkpointId: 'gate_5_available', elapsedMsSinceLifeStart: 20, source: 'event' },
    { checkpointId: 'gate_5_resolved', elapsedMsSinceLifeStart: 21, source: 'event' },
    { checkpointId: 'spirit_severing_entry', elapsedMsSinceLifeStart: 22, source: 'event' },
    { checkpointId: 'content_cap_reached', elapsedMsSinceLifeStart: 23, source: 'event' },
    { checkpointId: 'prestige_advisor_surface_available', elapsedMsSinceLifeStart: 24, source: 'assertion' },
    { checkpointId: 'current_chapter_exhausted_truth_available', elapsedMsSinceLifeStart: 25, source: 'assertion' },
    { checkpointId: 'current_life_summary_available', elapsedMsSinceLifeStart: 26, source: 'assertion' },
  ],
  progressionEvents: [],
  failures: [],
  warnings: [],
  assistedSteps: [],
  finalSnapshot: {
    routeId: 'normal',
    automationMode: 'automated_smoke_blocking',
    representativePath: 'martial',
    runStartTime: 100,
    elapsedMsToCap: 23,
    finalRealmId: 'spirit_severing',
    currentCityId: 'city_ironpeak_bastion',
    unlockedCityIds: [
      'city_pinewind_hamlet',
      'city_stonecrag_town',
      'city_spirit_cavern_city',
      'city_lotusford',
      'city_ironpeak_bastion',
    ],
    gateResolutionSummary: [1, 2, 3, 4, 5].map((gateIndex) => ({
      gateIndex,
      trialId: [
        'trial_novices_clearing',
        'trial_stone_core_sanctum',
        'trial_patriarchs_seal',
        'trial_soul_lantern_vault',
        'trial_severing_court',
      ][gateIndex - 1] as FreshSaveRouteResult['finalSnapshot']['gateResolutionSummary'][number]['trialId'],
      resolution: 'cleared',
      attempts: 1,
      elapsedMsResolved: gateIndex,
    })),
    prestigeAdvisorLabel: 'Recommended',
    currentChapterExhaustedTruth: true,
    lifeSummaryAvailable: true,
  },
});

const passingManual = (routeId: FreshSaveManualResult['routeId']): FreshSaveManualResult => ({
  routeId,
  tester: `tester_${routeId}`,
  date: '2026-03-27',
  overallStatus: 'pass',
  reachedSpiritSevering: true,
  reachedCurrentChapterExhausted: true,
  prestigeAdvisorSeen: true,
  lifeSummarySeen: true,
  issues: [],
});

test('report generation from automated route only keeps manual coverage pending and releaseReady false', async () => {
  const report = await buildFreshRunAcceptanceReport({ automatedRouteRunner: async () => makeAutomatedNormalResult() });

  assert.equal(report.automatedPass, true);
  assert.equal(report.manualCoverageComplete, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.routeSummaries.normal.automatedStatus, 'pass');
  assert.equal(report.routeSummaries.cautious.manualStatus, 'missing');
  assert.equal(report.warnings.some((entry) => entry.summary.includes('Manual coverage missing')), true);
});

test('report merges manual results and can become releaseReady when required routes pass', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fresh-report-'));
  const manualPath = path.join(tmpDir, 'manual.json');
  await fs.writeFile(manualPath, JSON.stringify([
    passingManual('normal'),
    passingManual('cautious'),
    passingManual('aggressive'),
  ], null, 2), 'utf8');

  const report = await buildFreshRunAcceptanceReport({
    manualResultsPaths: [manualPath],
    automatedRouteRunner: async () => makeAutomatedNormalResult(),
  });

  assert.equal(report.automatedPass, true);
  assert.equal(report.manualCoverageComplete, true);
  assert.equal(report.releaseReady, true);
  assert.equal(report.routeSummaries.cautious.manualStatus, 'pass');
});

test('malformed manual results are surfaced as ingestion blockers', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fresh-report-'));
  const manualPath = path.join(tmpDir, 'broken.json');
  await fs.writeFile(manualPath, '{"routeId": "normal"}', 'utf8');

  const report = await buildFreshRunAcceptanceReport({
    manualResultsPaths: [manualPath],
    automatedRouteRunner: async () => makeAutomatedNormalResult(),
  });

  assert.equal(report.blockers.some((entry) => entry.source === 'ingestion'), true);
  assert.equal(report.releaseReady, false);
});

test('blocker manual issue forces releaseReady false even when coverage is complete', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fresh-report-'));
  const manualPath = path.join(tmpDir, 'manual.json');
  const cautious = passingManual('cautious');
  cautious.overallStatus = 'blocked';
  cautious.issues = [{ severity: 'blocker', summary: 'Route hard-stalled in gate flow.' }];

  await fs.writeFile(manualPath, JSON.stringify([
    passingManual('normal'),
    cautious,
    passingManual('aggressive'),
  ], null, 2), 'utf8');

  const report = await buildFreshRunAcceptanceReport({
    manualResultsPaths: [manualPath],
    automatedRouteRunner: async () => makeAutomatedNormalResult(),
  });

  assert.equal(report.manualCoverageComplete, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.blockers.some((entry) => entry.source === 'manual'), true);
});

test('CLI json mode emits stable report shape', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fresh-report-'));
  const manualPath = path.join(tmpDir, 'manual.json');
  await fs.writeFile(manualPath, JSON.stringify([passingManual('normal')], null, 2), 'utf8');

  const scriptPath = path.join(process.cwd(), 'tmp-tests/scripts/release/buildFreshRunAcceptanceReport.js');
  const { stdout } = await execFileAsync('node', [
    '--loader=./scripts/relativeJsLoader.mjs',
    scriptPath,
    '--json',
    '--skip-automated',
    `--manual-results=${manualPath}`,
  ], { cwd: process.cwd() });

  const report = JSON.parse(stdout) as {
    suiteVersion: string;
    routeSummaries: unknown;
    finalTruthSummary: unknown;
  };
  assert.equal(typeof report.suiteVersion, 'string');
  assert.equal(report.suiteVersion, '7.1d');
  assert.equal(typeof report.routeSummaries, 'object');
  assert.equal(typeof report.finalTruthSummary, 'object');
});
