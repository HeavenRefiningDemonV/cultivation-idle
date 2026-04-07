import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { canRenderPixiStage, isSceneKindAllowedForStage } from '../../src/ui/fx/shellContract.js';
import { FX_STAGE_IDS } from '../../src/ui/fx/constants.js';
import type { FxSceneContract } from '../../src/ui/fx/types.js';

const repo = (...parts: string[]) => path.resolve(process.cwd(), ...parts);

async function findDirectPixiReactImports(): Promise<string[]> {
  const roots = ['src/components', 'src/ui', 'src/features', 'src/app'];
  const offenders: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.tsx')) continue;
      const rel = path.relative(process.cwd(), full).replace(/\\/g, '/');
      const src = await fs.readFile(full, 'utf8');
      if (src.includes("from '@pixi/react'") && rel !== 'src/ui/fx/pixi/PixiUiStage.tsx') {
        offenders.push(rel);
      }
    }
  }

  for (const root of roots) {
    await walk(repo(root));
  }

  return offenders;
}

function makeScene(overrides: Partial<FxSceneContract> = {}): FxSceneContract {
  return {
    stageId: FX_STAGE_IDS.status,
    sceneKind: 'status',
    bounds: { width: 400, height: 200 },
    width: 400,
    height: 200,
    centerX: 200,
    centerY: 100,
    shortestSide: 200,
    longestSide: 400,
    dpr: 1,
    requestedQuality: 'high',
    effectiveQuality: 'high',
    budget: {
      sceneMode: 'full',
      continuousAtmosphere: 'full',
      allowBurstAtmosphere: true,
      allowHeroPulse: true,
      allowGlints: true,
      allowFilters: true,
      maxDpr: 2,
      particleDensity: 1,
      tickScale: 1,
    },
    prefersReducedMotion: false,
    isStatic: false,
    canAnimateContinuously: true,
    hostReady: true,
    dormant: false,
    ...overrides,
  };
}

test('PixiUiStage remains the only legal @pixi/react Application mount in src', async () => {
  const offenders = await findDirectPixiReactImports();
  assert.deepEqual(offenders, []);
});

test('scene-kind legality is stage-bound for shell-level contract', () => {
  assert.equal(isSceneKindAllowedForStage(FX_STAGE_IDS.status, 'status'), true);
  assert.equal(isSceneKindAllowedForStage(FX_STAGE_IDS.status, 'generic'), true);
  assert.equal(isSceneKindAllowedForStage(FX_STAGE_IDS.status, 'world'), false);
  assert.equal(isSceneKindAllowedForStage('ad-hoc-stage', 'generic'), true);
  assert.equal(isSceneKindAllowedForStage('ad-hoc-stage', 'status'), false);
});

test('Pixi scene renderability rejects dormant or host-invalid states', () => {
  assert.equal(canRenderPixiStage(null), false);
  assert.equal(canRenderPixiStage(makeScene({ hostReady: false })), false);
  assert.equal(canRenderPixiStage(makeScene({ dormant: true })), false);
  assert.equal(canRenderPixiStage(makeScene({ width: 0 })), false);
  assert.equal(canRenderPixiStage(makeScene()), true);
});
