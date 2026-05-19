import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('p2-13 packet doc freezes primary/secondary boundaries and defer rules', () => {
  const packetDoc = read('docs/ui/phase-2-p2-13-proof-surface-normalization.md');

  assert.match(packetDoc, /## Primary proof surfaces/);
  assert.match(packetDoc, /## Secondary already-opted-in compact consumers/);
  assert.match(packetDoc, /## Explicitly deferred/);
  assert.match(packetDoc, /No art requests or asset generation/);
});

void test('secondary compact consumers remain documented as bounded follow-through only', () => {
  const packetDoc = read('docs/ui/phase-2-p2-13-proof-surface-normalization.md');

  [
    'ApothecaryPanel',
    'BountyBoardPanel',
    'ExpeditionBoardPanel',
    'ManualPavilionPanel',
    'TechniqueLibraryScreen',
    'OutskirtsBuildingPanel',
    'RuinsBuildingPanel',
    'ForgeWorkshop',
  ].forEach((name) => assert.match(packetDoc, new RegExp(name)));
});

void test('visual diagnostics include primary proof-surface style files for normalization scope', () => {
  const visualManifest = read('src/services/diagnostics/release/liveSurfaceVisualManifest.ts');

  [
    'src/components/BottomTabBar.scss',
    'src/features/cultivation/exact/CultivationExactScreen.scss',
    'src/components/screens/StatusScreen.scss',
    'src/components/screens/WorldScreen.scss',
    'src/components/screens/PrestigeScreen.scss',
    'src/components/modals/PrestigeRitualModal.scss',
    'src/components/modals/CurrentChapterExhaustedModal.scss',
    'src/components/modals/LifeSummaryModal.scss',
    'src/ui/cultivation/heartLaw/ChangeHeartLawModal.scss',
  ].forEach((file) => assert.match(visualManifest, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
});
