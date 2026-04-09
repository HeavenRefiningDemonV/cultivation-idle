import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const modalSource = readFileSync('src/components/modals/DaoHeartModal.tsx', 'utf8');
const studySource = readFileSync('src/ui/cultivation/StudyModeWidget.tsx', 'utf8');


test('DaoHeartModal keeps the study tab and debugInitialTab compatibility', () => {
  assert.ok(modalSource.includes("debugInitialTab?: 'heartLaw' | 'study'"));
  assert.ok(modalSource.includes("id=\"dao-heart-tab-study\""));
  assert.ok(modalSource.includes("setTab('study')"));
});

test('study tab still mounts StudyModeWidget inside DaoHeartModal owner', () => {
  assert.ok(modalSource.includes('<StudyModeWidget />'));
  assert.ok(modalSource.includes('id="dao-heart-panel-study"'));
});

test('StudyModeWidget keeps live study control store semantics', () => {
  assert.ok(studySource.includes('studyEnabled'));
  assert.ok(studySource.includes('studyTechniqueId'));
  assert.ok(studySource.includes('setStudyEnabled'));
  assert.ok(studySource.includes('setStudyTechniqueId'));
});

test('StudyModeWidget now exposes a dedicated Dao Heart study surface with state and technique summary regions', () => {
  assert.ok(studySource.includes('data-ui="dao-heart-study"'));
  assert.ok(studySource.includes('daoHeartStudySurface'));
  assert.ok(studySource.includes('daoHeartStudyTechniqueSummary'));
  assert.ok(studySource.includes('Selected Technique'));
  assert.equal(studySource.includes('<div className="cultivationPanel studyWidget">'), false);
});
