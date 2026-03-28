import { toSaveShape } from './toSaveShape.js';
export const toMigrationFixture = (metadata, buildResult, contract) => {
    if (buildResult.migrationFixture)
        return buildResult.migrationFixture;
    const saveShape = toSaveShape(buildResult, contract);
    if (!saveShape)
        return null;
    return { name: metadata.id, data: saveShape };
};
