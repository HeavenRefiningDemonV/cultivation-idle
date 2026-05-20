import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';

const repoPath = (...parts: string[]) => path.resolve(process.cwd(), ...parts);

const SELECTOR_STABILITY_FILES = [
  'src/components/screens/BountyBoardPanel.tsx',
  'src/components/Header.tsx',
  'src/components/screens/WorldScreen.tsx',
  'src/components/screens/ApothecaryPanel.tsx',
  'src/components/screens/ExpeditionBoardPanel.tsx',
  'src/components/screens/AlchemyPanel.tsx',
  'src/components/screens/TalismanPanel.tsx',
  'src/components/system/CityArrivalBanner.tsx',
] as const;

const TRACKED_BOUNTY_FILES = [
  'src/components/Header.tsx',
  'src/components/screens/WorldScreen.tsx',
  'src/components/screens/BountyBoardPanel.tsx',
] as const;

const STORE_SELECTOR_NAMES = ['useContentStore', 'useBountyStore', 'useCityStore', 'useUIStore'] as const;

const readSource = async (relativePath: string): Promise<string> =>
  fs.readFile(repoPath(relativePath), 'utf8');

const fileExists = async (relativePath: string): Promise<boolean> => {
  try {
    await fs.access(repoPath(relativePath));
    return true;
  } catch {
    return false;
  }
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const collectStoreCallBodies = (source: string, storeName: string): string[] => {
  const bodies: string[] = [];
  const needle = `${storeName}(`;
  let startIndex = 0;

  while (startIndex < source.length) {
    const callIndex = source.indexOf(needle, startIndex);
    if (callIndex === -1) break;

    let depth = 0;
    let cursor = callIndex + storeName.length;
    let bodyStart = -1;

    for (; cursor < source.length; cursor += 1) {
      const char = source[cursor];
      if (char === '(') {
        depth += 1;
        if (bodyStart === -1) {
          bodyStart = cursor + 1;
        }
        continue;
      }

      if (char === ')') {
        depth -= 1;
        if (depth === 0 && bodyStart !== -1) {
          bodies.push(source.slice(bodyStart, cursor));
          cursor += 1;
          break;
        }
      }
    }

    startIndex = Math.max(cursor, callIndex + needle.length);
  }

  return bodies;
};

const buildGroupedSelectorPattern = (storeName: string): RegExp =>
  new RegExp(`${escapeRegex(storeName)}\\s*\\(\\s*\\(state\\)\\s*=>\\s*\\(\\s*[\\[{]`, 'g');

const buildTrackedGetterPattern = (): RegExp =>
  /useBountyStore\s*\(\s*\(state\)\s*=>[\s\S]*?state\.getTrackedBounty\s*\(/g;

test('touched world/support files do not use fresh fallback arrays or objects inside Zustand selectors', async () => {
  for (const relativePath of SELECTOR_STABILITY_FILES) {
    if (!(await fileExists(relativePath))) continue;
    const source = await readSource(relativePath);

    for (const storeName of STORE_SELECTOR_NAMES) {
      const selectorBodies = collectStoreCallBodies(source, storeName);
      assert.equal(
        selectorBodies.some((body) => /\?\?\s*\[\]/.test(body)),
        false,
        `${relativePath} should not use ?? [] inside ${storeName} selectors`,
      );
      assert.equal(
        selectorBodies.some((body) => /\?\?\s*\{\}/.test(body)),
        false,
        `${relativePath} should not use ?? {} inside ${storeName} selectors`,
      );
    }
  }
});

test('touched world-era components do not use grouped Zustand selector objects without shallow handling', async () => {
  for (const relativePath of SELECTOR_STABILITY_FILES) {
    if (!(await fileExists(relativePath))) continue;
    const source = await readSource(relativePath);

    for (const storeName of STORE_SELECTOR_NAMES) {
      const hasGroupedSelector = buildGroupedSelectorPattern(storeName).test(source);
      if (!hasGroupedSelector) continue;

      assert.match(
        source,
        /useShallow|zustand\/shallow/,
        `${relativePath} uses grouped ${storeName} selectors and must also use useShallow`,
      );
    }
  }
});

test('world/header bounty selectors derive tracked bounties outside selector-time store getters', async () => {
  for (const relativePath of TRACKED_BOUNTY_FILES) {
    const source = await readSource(relativePath);
    assert.equal(
      buildTrackedGetterPattern().test(source),
      false,
      `${relativePath} should not call state.getTrackedBounty(...) inside useBountyStore selectors`,
    );
  }
});

test('touched onboarding guidance copy avoids stale vocabulary leaks', async () => {
  const touchedFiles = [
    'src/components/system/OnboardingPromptRuntime.tsx',
    'src/systems/ui/onboardingPromptRegistry.ts',
    'src/components/screens/WorldScreen.tsx',
    'src/components/screens/ApothecaryPanel.tsx',
    'src/components/screens/BountyBoardPanel.tsx',
    'src/components/screens/ExpeditionBoardPanel.tsx',
    'src/features/trials/ui/TrialProgress.tsx',
  ];

  const forbidden = [/Adventure/, /Fail-safe/, /Eligible/, /Sealed/];

  for (const relativePath of touchedFiles) {
    const source = await readSource(relativePath);
    for (const pattern of forbidden) {
      assert.equal(
        pattern.test(source),
        false,
        `${relativePath} should avoid stale player-facing vocabulary (${pattern.source})`,
      );
    }
  }
});

test('WorldScreen no longer contains the old visible-module writeback loop pattern', async () => {
  const source = await readSource('src/components/screens/WorldScreen.tsx');

  assert.equal(
    /useEffect\s*\(\s*\(\)\s*=>[\s\S]*?setSelectedModule\s*\(\s*selectedCity\.id\s*,\s*lockedModuleKey\s*\)/.test(source),
    false,
    'WorldScreen should not write the fallback locked module back into city store from an effect.',
  );
  assert.match(source, /if \(!visibleCityModules\.includes\(moduleKey\)\) return;/);
  assert.match(
    source,
    /setSelectedModule\(selectedCity\.id, moduleKey\)/,
    'User-driven module selection should remain the only selected-module write in WorldScreen.',
  );
});

test('packet-era city-arrival store actions are idempotent when the same target state is requested repeatedly', () => {
  const uiState = useUIStore.getState();
  const cityState = useCityStore.getState();

  if (
    typeof uiState.queueCityArrival !== 'function'
    || typeof uiState.clearCityArrival !== 'function'
    || typeof cityState.ensurePendingCityArrival !== 'function'
  ) {
    return;
  }

  useUIStore.getState().hardResetUI();
  useCityStore.getState().hardResetCity();
  useContentStore.setState({
    ...useContentStore.getState(),
    maps: {
      ...useContentStore.getState().maps,
      citiesById: {
        city_alpha: { id: 'city_alpha', index: 0, name: 'Alpha', modules: ['outskirts'] } as never,
      },
    },
    citiesSorted: [{ id: 'city_alpha', index: 0, name: 'Alpha', modules: ['outskirts'] }] as never,
  });

  let uiMutations = 0;
  const unsubscribe = useUIStore.subscribe(() => {
    uiMutations += 1;
  });

  try {
    useUIStore.getState().queueCityArrival('city_alpha');
    assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_alpha');
    const queueMutationCount = uiMutations;

    useUIStore.getState().queueCityArrival('city_alpha');
    assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_alpha');
    assert.equal(uiMutations, queueMutationCount, 'queueCityArrival should not mutate state twice for the same city');

    useUIStore.getState().clearCityArrival();
    assert.equal(useUIStore.getState().pendingCityArrivalId, null);
    const clearMutationCount = uiMutations;

    useUIStore.getState().clearCityArrival();
    assert.equal(useUIStore.getState().pendingCityArrivalId, null);
    assert.equal(uiMutations, clearMutationCount, 'clearCityArrival should be a no-op when already clear');

    useCityStore.setState((state) => ({
      ...state,
      unlockedCityIds: ['city_alpha'],
      acknowledgedArrivalCityIds: [],
    }));

    const firstCandidate = useCityStore.getState().ensurePendingCityArrival('city_alpha');
    assert.equal(firstCandidate, 'city_alpha');
    assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_alpha');
    const ensureMutationCount = uiMutations;

    const secondCandidate = useCityStore.getState().ensurePendingCityArrival('city_alpha');
    assert.equal(secondCandidate, 'city_alpha');
    assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_alpha');
    assert.equal(uiMutations, ensureMutationCount, 'ensurePendingCityArrival should not requeue the same pending city');
  } finally {
    unsubscribe();
    useUIStore.getState().hardResetUI();
    useCityStore.getState().hardResetCity();
  }
});
