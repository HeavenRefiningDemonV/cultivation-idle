import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PHASE0_CORE_SURFACE_IDS } from '../../src/dev/phase0CoreAudit/phase0CoreSurfaceIds.js';
import { SECTION_C_SURFACE_IDS } from '../../src/dev/sectionCAudit/sectionCSurfaceIds.js';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('proof-surface matrix documents phase0 and section-c evidence routes for required proof set', () => {
  const matrix = read('docs/ui/phase-2-proof-surface-matrix.md');

  ['surface=world', 'surface=cultivation', 'surface=status', 'surface=prestige'].forEach((route) => {
    assert.match(matrix, new RegExp(route));
  });

  ['surface=prestige-ritual', 'surface=current-chapter-exhausted', 'surface=life-summary', 'surface=change-heart-law'].forEach((route) => {
    assert.match(matrix, new RegExp(route));
  });
});

void test('matrix primary modal evidence ids stay aligned with section-c harness ids', () => {
  const matrix = read('docs/ui/phase-2-proof-surface-matrix.md');
  const requiredSectionCProofIds = ['prestige-ritual', 'current-chapter-exhausted', 'life-summary', 'change-heart-law'];

  requiredSectionCProofIds.forEach((id) => {
    assert.equal(SECTION_C_SURFACE_IDS.includes(id as (typeof SECTION_C_SURFACE_IDS)[number]), true);
    assert.match(matrix, new RegExp(`\\| ${id} \\|`));
  });
});

void test('matrix secondary compact consumers remain explicit and phase0-backed where expected', () => {
  const matrix = read('docs/ui/phase-2-proof-surface-matrix.md');

  const phase0Backed = ['apothecary', 'bounties-expeditions', 'manual-pavilion', 'techniques', 'forge'];
  phase0Backed.forEach((surfaceId) => {
    assert.equal(PHASE0_CORE_SURFACE_IDS.includes(surfaceId as (typeof PHASE0_CORE_SURFACE_IDS)[number]), true);
    assert.match(matrix, new RegExp(`\\| ${surfaceId} \\|`));
  });

  const secondaryCount = (matrix.match(/\| Secondary already-opted-in compact consumer \|/g) ?? []).length;
  assert.equal(secondaryCount, 7);
});
