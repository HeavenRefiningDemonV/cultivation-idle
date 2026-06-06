import { validateProgressionSemantics } from '../../../src/systems/progression/validation/index.js';
import { toContractScenario } from './adapters/toContractScenario.js';
import { toMigrationFixture } from './adapters/toMigrationFixture.js';
import { toSaveShape } from './adapters/toSaveShape.js';
import { getProgressionFixtureDefinition } from './fixtureCatalog.js';
import { loadProgressionFixtureContext } from './loadFixtureContext.js';
export const buildProgressionFixture = async (id) => {
    const definition = getProgressionFixtureDefinition(id);
    const context = await loadProgressionFixtureContext();
    const built = await definition.build(context);
    const scenario = toContractScenario(built, context.contract);
    const saveShape = toSaveShape(built, context.contract);
    const migrationFixture = definition.metadata.isLegacy
        ? toMigrationFixture(definition.metadata, { ...built, saveShape: saveShape ?? undefined }, context.contract)
        : built.migrationFixture ?? null;
    const runtimeFileTextByPath = built.runtimeFileTextByPath ?? {};
    const validationIssues = validateProgressionSemantics({
        rawContent: context.rawContent,
        runtimeFileTextByPath,
        scenarios: scenario ? [scenario] : [],
        migrationFixtures: migrationFixture ? [migrationFixture] : [],
    });
    return {
        metadata: definition.metadata,
        scenario,
        saveShape,
        migrationFixture,
        runtimeFileTextByPath,
        validationIssues,
    };
};
