import { PROGRESSION_FIXTURE_CATALOG } from './fixtureCatalog.js';
import { buildProgressionFixture } from './buildFixture.js';
const deriveStatus = (fixture) => fixture.validationIssues.length > 0 ? 'warning' : 'clean';
export const validateProgressionFixtureCatalog = async () => Promise.all(PROGRESSION_FIXTURE_CATALOG.map(async (definition) => {
    const fixture = await buildProgressionFixture(definition.metadata.id);
    const categories = Array.from(new Set(fixture.validationIssues.map((issue) => issue.category))).sort();
    return {
        fixture,
        status: deriveStatus(fixture),
        categories,
    };
}));
