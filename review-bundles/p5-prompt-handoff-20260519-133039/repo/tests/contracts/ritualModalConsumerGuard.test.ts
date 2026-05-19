import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('live ritual modals continue to consume RitualModalFrame', () => {
  const files = [
    'src/components/modals/PrestigeRitualModal.tsx',
    'src/components/modals/CurrentChapterExhaustedModal.tsx',
    'src/components/modals/LifeSummaryModal.tsx',
    'src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx',
  ];

  for (const filePath of files) {
    const source = read(filePath);
    assert.match(source, /RitualModalFrame/);
  }
});

test('critical no-shift selector targets for ritual family remain tracked in release visual manifest', () => {
  const manifest = read('src/services/diagnostics/release/liveSurfaceVisualManifest.ts');
  assert.match(manifest, /prestigeRitualConfirmButton/);
  assert.match(manifest, /changeHeartLawModal__button/);
});

test('P2-09 packet doc records lifecycle ownership and existing Section C proof surfaces', () => {
  const doc = read('docs/ui/phase-2-p2-09-ritual-modal-contract.md');
  assert.match(doc, /Lifecycle ownership contract/);
  assert.match(doc, /PrestigeRitualModal/);
  assert.match(doc, /CurrentChapterExhaustedModal/);
  assert.match(doc, /LifeSummaryModal/);
  assert.match(doc, /ChangeHeartLawModal/);
  assert.match(doc, /Section C/);
});


test('P3-09 contract doc extends ritual family semantics on top of P2-09', () => {
  const doc = read('docs/ui/phase-3-ritual-modal-contract.md');
  assert.match(doc, /phase-2-p2-09-ritual-modal-contract\.md/);
  assert.match(doc, /Choice \/ consequence ritual/);
  assert.match(doc, /Warning \/ chapter-end ritual/);
  assert.match(doc, /Summary \/ review ritual/);
});
