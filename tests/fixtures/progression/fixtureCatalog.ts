import { capReachedFixture } from './cases/capReached.js';
import { freshSaveFixture } from './cases/freshSave.js';
import { gateEdgePostFirstFixture } from './cases/gateEdgePostFirst.js';
import { gateEdgePreFirstFixture } from './cases/gateEdgePreFirst.js';
import { legacyGateAliasFixture } from './cases/legacyGateAlias.js';
import { legacyHiddenPrestigeFixture } from './cases/legacyHiddenPrestige.js';
import { legacyOfflineSplitFixture } from './cases/legacyOfflineSplit.js';
import { legacyOverCapFixture } from './cases/legacyOverCap.js';
import { legacyPartialResetResidueFixture } from './cases/legacyPartialResetResidue.js';
import { legacyPathConflictFixture } from './cases/legacyPathConflict.js';
import { legacyTrialMismatchFixture } from './cases/legacyTrialMismatch.js';
import { prestigeReadyFixture } from './cases/prestigeReady.js';
import type { ProgressionFixtureDefinition } from './fixtureTypes.js';

export const PROGRESSION_FIXTURE_CATALOG: ProgressionFixtureDefinition[] = [
  freshSaveFixture,
  gateEdgePreFirstFixture,
  gateEdgePostFirstFixture,
  prestigeReadyFixture,
  capReachedFixture,
  legacyPathConflictFixture,
  legacyGateAliasFixture,
  legacyTrialMismatchFixture,
  legacyOverCapFixture,
  legacyHiddenPrestigeFixture,
  legacyPartialResetResidueFixture,
  legacyOfflineSplitFixture,
];

export const getProgressionFixtureDefinition = (id: string): ProgressionFixtureDefinition => {
  const match = PROGRESSION_FIXTURE_CATALOG.find((fixture) => fixture.metadata.id === id);
  if (!match) throw new Error(`Unknown progression fixture '${id}'.`);
  return match;
};
