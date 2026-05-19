import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { resolveFxPortalMountPolicy } from '../../src/ui/fx/shellContract.js';
import type { FxStageSnapshot } from '../../src/ui/fx/types.js';

const readSource = (relativePath: string) =>
  fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

function makeSnapshot(overrides: Partial<FxStageSnapshot> = {}): FxStageSnapshot {
  const host = ({ isConnected: true } as HTMLDivElement);
  return {
    stageId: 'cultivation',
    hostElement: host,
    bounds: { width: 400, height: 220 },
    dpr: 1,
    hostReady: true,
    dormant: false,
    updatedAt: 0,
    ...overrides,
  };
}

test('portal mount policy blocks missing, unready, disconnected, and dormant hosts gracefully', () => {
  assert.equal(resolveFxPortalMountPolicy(null).reason, 'missingSnapshot');

  const missingHost = makeSnapshot({ hostElement: null as unknown as HTMLDivElement });
  assert.equal(resolveFxPortalMountPolicy(missingHost).reason, 'missingHost');

  const disconnected = makeSnapshot({ hostElement: ({ isConnected: false } as HTMLDivElement) });
  assert.equal(resolveFxPortalMountPolicy(disconnected).reason, 'hostDisconnected');

  assert.equal(resolveFxPortalMountPolicy(makeSnapshot({ hostReady: false })).reason, 'hostNotReady');
  assert.equal(resolveFxPortalMountPolicy(makeSnapshot({ dormant: true })).reason, 'stageDormant');
  assert.equal(resolveFxPortalMountPolicy(makeSnapshot()).canMount, true);
});

test('FxStagePortal keeps missing-host warning scoped to missingSnapshot only', async () => {
  const source = await readSource('src/ui/fx/FxStagePortal.tsx');
  assert.match(source, /mountPolicy\.reason !== 'missingSnapshot'/);
  assert.match(source, /if \(!mountPolicy\.canMount \|\| !snapshot\?\.hostElement\) return null/);
});
