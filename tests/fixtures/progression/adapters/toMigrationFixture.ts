import type { ProgressionContract } from '../../../../src/systems/progression/contract/index.js';
import type { MigrationFixtureLike } from '../../../../src/systems/progression/validation/index.js';
import type { FixtureBuildResult, ProgressionFixtureMetadata } from '../fixtureTypes.js';
import { toSaveShape } from './toSaveShape.js';

export const toMigrationFixture = (
  metadata: ProgressionFixtureMetadata,
  buildResult: FixtureBuildResult,
  contract: ProgressionContract,
): MigrationFixtureLike | null => {
  if (buildResult.migrationFixture) return buildResult.migrationFixture;
  const saveShape = toSaveShape(buildResult, contract);
  if (!saveShape) return null;
  return { name: metadata.id, data: saveShape };
};
