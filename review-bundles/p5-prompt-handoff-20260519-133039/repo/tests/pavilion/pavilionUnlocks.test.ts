import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDefaultPavilionSaveState,
  reconcilePavilionSaveState,
  resolvePavilionRecordState,
} from '../../src/features/pavilion/pavilionUnlocks.js';
import type { PavilionRecord } from '../../src/features/pavilion/pavilionTypes.js';

test('record states resolve with safe overrides and prestige preservation', () => {
  const sealed: PavilionRecord = {
    id: 'future.core_gate',
    title: 'Core Gate',
    categoryId: 'gate-trials',
    categoryLabel: 'Gate Trials',
    state: 'sealed',
    tags: ['future'],
    plain: 'Future gate.',
    jade: 'Future gate.',
    related: [],
    route: [],
    implementation: 'Generated',
    searchText: 'core gate future sealed',
    debug: { generated: true, unresolvedRelations: [] },
  };
  const save = createDefaultPavilionSaveState();
  save.stateByEntryId[sealed.id] = 'studied';
  save.pinnedEntryIds = [sealed.id];
  save.priorLifeAnnotations[sealed.id] = ['Past life failed here due to weak medicine'];

  assert.equal(resolvePavilionRecordState(sealed, save), 'studied');
  assert.equal(resolvePavilionRecordState({ ...sealed, id: 'future.unseen' }, save), 'sealed');

  const reconciled = reconcilePavilionSaveState(save, [sealed.id], { preserveArchive: true });
  assert.deepEqual(reconciled.pinnedEntryIds, [sealed.id]);
  assert.deepEqual(reconciled.priorLifeAnnotations[sealed.id], ['Past life failed here due to weak medicine']);
  assert.equal(reconciled.entryUnlockVersion, save.entryUnlockVersion + 1);
});
