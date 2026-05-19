import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { useContentStore, __setContentStoreLoadTestOverrides } from '../../../src/stores/contentStore.js';
import type { LoadedContentRaw } from '../../../src/content/loaders.js';
import { ContentLoadError } from '../../../src/content/loaders.js';
import { validateLoadedContent } from '../../../src/content/validators.js';
import { getValidatedEconomicContent } from '../../helpers/economy/setupEconomicRuntimeScenario.js';

async function resetLoadedBaseline() {
  const content = await getValidatedEconomicContent();
  useContentStore.setState({
    isLoaded: false,
    isLoading: false,
    error: null,
    loadFailure: null,
    raw: content,
    economy: content.economy,
    maps: useContentStore.getState().maps,
    citiesSorted: [...content.cities],
    techniquesByPath: useContentStore.getState().techniquesByPath,
  });
}

test('validation failure is structured and clears stale loaded content', async () => {
  await resetLoadedBaseline();
  useContentStore.setState({ raw: await getValidatedEconomicContent(), isLoaded: false });

  const valid = await getValidatedEconomicContent();
  const raw = valid.raw as unknown as LoadedContentRaw;
  __setContentStoreLoadTestOverrides({
    loadAllContent: async () => raw,
    validateLoadedContent: () => {
      throw new Error('[ContentValidation] 2 issue(s) found:\n- bad city\n- missing expedition route');
    },
  });

  const ok = await useContentStore.getState().load();
  assert.equal(ok, false);
  const state = useContentStore.getState();
  assert.equal(state.isLoaded, false);
  assert.equal(state.raw, null);
  assert.equal(state.loadFailure?.phase, 'load');
  assert.deepEqual(state.loadFailure?.issueLines, ['bad city', 'missing expedition route']);
  assert.ok(state.loadFailureDiagnostics);

  __setContentStoreLoadTestOverrides({});
});

test('fetch/bootstrap style failures share the same structured failure model', async () => {
  await resetLoadedBaseline();
  __setContentStoreLoadTestOverrides({
    loadAllContent: async () => {
      throw new ContentLoadError({ message: 'expeditions missing', phase: 'fetch', fileName: 'expeditions.json' });
    },
  });

  const ok = await useContentStore.getState().load();
  assert.equal(ok, false);
  const state = useContentStore.getState();
  assert.equal(state.loadFailure?.phase, 'fetch');
  assert.equal(state.loadFailure?.fileName, 'expeditions.json');

  __setContentStoreLoadTestOverrides({});
});

test('ContentInitGate uses dedicated content failure modal flow', () => {
  const source = readFileSync('src/components/system/ContentInitGate.tsx', 'utf8');
  assert.equal(source.includes('ContentLoadFailureModal'), true);
  assert.equal(source.includes('Content Load Failed'), false);
});
