import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REGISTER_PATH = 'docs/ui/phase-3-repo-truth-register.md';

const SURFACE_IDS = [
  'life-start-path',
  'life-start-heart-law',
  'life-start-breath-focus',
  'dao-heart-law',
  'dao-heart-study',
  'change-heart-law',
  'prestige-ritual',
  'current-chapter-exhausted',
  'life-summary',
] as const;

const OWNER_FILES = [
  'src/components/modals/LifeStartWizardModal.tsx',
  'src/components/modals/LifeStartWizardModal.scss',
  'src/components/modals/DaoHeartModal.tsx',
  'src/components/modals/DaoHeartModal.scss',
  'src/ui/cultivation/heartLaw/HeartLawPanel.tsx',
  'src/ui/cultivation/heartLaw/HeartLawPanel.scss',
  'src/ui/cultivation/heartLaw/HeartLawMindView.tsx',
  'src/ui/cultivation/heartLaw/HeartLawMindView.scss',
  'src/ui/cultivation/StudyModeWidget.tsx',
  'src/ui/cultivation/StudyModeWidget.scss',
  'src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx',
  'src/ui/cultivation/heartLaw/ChangeHeartLawModal.scss',
  'src/components/modals/PrestigeRitualModal.tsx',
  'src/components/modals/PrestigeRitualModal.scss',
  'src/components/modals/CurrentChapterExhaustedModal.tsx',
  'src/components/modals/CurrentChapterExhaustedModal.scss',
  'src/components/modals/LifeSummaryModal.tsx',
  'src/components/modals/LifeSummaryModal.scss',
  'src/ui/fx/scenes/SelectionFxScene.tsx',
] as const;

const EVIDENCE_FOLDERS = [
  'docs/release/qa/ui-cutover/life-start-path',
  'docs/release/qa/ui-cutover/life-start-heart-law',
  'docs/release/qa/ui-cutover/life-start-breath-focus',
  'docs/release/qa/ui-cutover/dao-heart-law',
  'docs/release/qa/ui-cutover/dao-heart-study',
  'docs/release/qa/ui-cutover/change-heart-law',
  'docs/release/qa/ui-cutover/prestige-ritual',
  'docs/release/qa/ui-cutover/current-chapter-exhausted',
  'docs/release/qa/ui-cutover/life-summary',
] as const;

function readRegister() {
  return readFileSync(resolve(process.cwd(), REGISTER_PATH), 'utf8');
}

void test('phase 3 repo-truth register exists and lists all canonical surfaces', () => {
  assert.equal(existsSync(resolve(process.cwd(), REGISTER_PATH)), true);
  const source = readRegister();
  SURFACE_IDS.forEach((id) => assert.equal(source.includes(`\`${id}\``), true));
});

void test('register identifies LifeStartWizardModal as owner for life-start surfaces', () => {
  const source = readRegister();
  assert.match(source, /life-start-path/);
  assert.match(source, /life-start-heart-law/);
  assert.match(source, /life-start-breath-focus/);
  assert.match(source, /LifeStartWizardModal\.tsx/);
});

void test('register treats PathSelectionModal only as stale/absent and records SelectionFxScene as present stub', () => {
  const source = readRegister();
  assert.equal(source.includes('PathSelectionModal.tsx'), true);
  assert.equal(/legacy\/stale reference|stale reference|no standalone/i.test(source), true);
  assert.equal(source.includes('SelectionFxScene.tsx'), true);
  assert.equal(/stub\/null scene/i.test(source), true);
});

void test('register states cleanup authority remains locked', () => {
  const source = readRegister();
  assert.match(source, /does not unlock cleanup authority/i);
});

void test('phase 3 repo-truth owner files and evidence folders exist on disk', () => {
  OWNER_FILES.forEach((file) => {
    assert.equal(existsSync(resolve(process.cwd(), file)), true, `Expected owner file to exist: ${file}`);
  });

  EVIDENCE_FOLDERS.forEach((folder) => {
    assert.equal(existsSync(resolve(process.cwd(), folder)), true, `Expected evidence folder to exist: ${folder}`);
  });
});
