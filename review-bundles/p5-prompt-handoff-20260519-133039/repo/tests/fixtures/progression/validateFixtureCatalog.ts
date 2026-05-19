import type { DriftCategory } from '../../../src/systems/progression/diagnostics/index.js';
import { PROGRESSION_FIXTURE_CATALOG } from './fixtureCatalog.js';
import { buildProgressionFixture } from './buildFixture.js';
import type { BuiltProgressionFixture, FixtureValidationStatus } from './fixtureTypes.js';

export interface FixtureValidationResult {
  fixture: BuiltProgressionFixture;
  status: FixtureValidationStatus;
  categories: DriftCategory[];
}

const deriveStatus = (fixture: BuiltProgressionFixture): FixtureValidationStatus =>
  fixture.validationIssues.length > 0 ? 'warning' : 'clean';

export const validateProgressionFixtureCatalog = async (): Promise<FixtureValidationResult[]> =>
  Promise.all(
    PROGRESSION_FIXTURE_CATALOG.map(async (definition) => {
      const fixture = await buildProgressionFixture(definition.metadata.id);
      const categories = Array.from(new Set(fixture.validationIssues.map((issue) => issue.category))).sort();
      return {
        fixture,
        status: deriveStatus(fixture),
        categories,
      };
    }),
  );
