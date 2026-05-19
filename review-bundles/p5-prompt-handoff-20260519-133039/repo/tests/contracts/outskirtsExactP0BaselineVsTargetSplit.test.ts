import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

void test('P0 docs explicitly separate baseline evidence truth and target fixture truth', async () => {
  const readme = await readFile('docs/release/qa/ui-cutover/outskirts-exact/README.md', 'utf8');
  const freezeReadme = await readFile('docs/release/qa/ui-cutover/outskirts-exact/p0-freeze/README.md', 'utf8');
  const anchors = await readFile('docs/release/qa/ui-cutover/outskirts-exact/p0-freeze/review-anchor-sheet.md', 'utf8');
  const fixtureJson = await readFile('docs/release/qa/ui-cutover/outskirts-exact/p0-freeze/outskirtsExactReviewFixture.json', 'utf8');

  assert.match(readme, /Truth A — Current live baseline/i);
  assert.match(readme, /Truth B — Exact target review fixture/i);
  assert.match(readme, /phase-6-combat-preflight\/01-outskirts/);

  assert.match(freezeReadme, /Canonical baseline evidence source/);
  assert.match(freezeReadme, /Target fixture lock artifacts/);

  assert.match(anchors, /Screenshot-authoritative visible anchors/);
  assert.match(anchors, /Deterministic but not directly visible\/internal placeholders/);
  assert.match(anchors, /Intentionally not over-guessed/);

  assert.match(fixtureJson, /"schemaVersion": "outskirts-exact-review-fixture.v1"/);
  assert.match(fixtureJson, /"selectedEncounterId": "snarling-wolf"/);
  assert.match(fixtureJson, /"legacyConceptPolicy": "context-only-not-exact-authority"/);
});

void test('P0 does not modify live host/layout owner files', async () => {
  const [scss, modalSurface, panel] = await Promise.all([
    readFile('src/components/modals/WorldBuildingModal.scss', 'utf8'),
    readFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8'),
    readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8'),
  ]);

  assert.match(scss, /width:\s*80rem;/);
  assert.match(scss, /height:\s*45rem;/);
  assert.match(modalSurface, /shellFamily\s*=\s*'combat-path'/);
  assert.match(panel, /OutskirtsExactMockupScreen/);
});
