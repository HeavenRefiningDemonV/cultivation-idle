import { validateProgressionFixtureCatalog, } from '../tests/fixtures/progression/index.js';
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const matrixMode = args.includes('--matrix');
const priority = {
    clean: 0,
    warning: 1,
};
const main = async () => {
    const results = await validateProgressionFixtureCatalog();
    const failures = results.filter((result) => {
        if (result.status !== result.fixture.metadata.expectedValidationStatus)
            return true;
        return result.fixture.metadata.expectedIssueCategories.some((category) => !result.categories.includes(category));
    });
    if (jsonMode) {
        console.log(JSON.stringify({
            ok: failures.length === 0,
            results: results.map((result) => ({
                id: result.fixture.metadata.id,
                status: result.status,
                expectedStatus: result.fixture.metadata.expectedValidationStatus,
                categories: result.categories,
                expectedIssueCategories: result.fixture.metadata.expectedIssueCategories,
            })),
        }, null, 2));
    }
    else {
        console.log(matrixMode ? 'Progression Fixture Validation Matrix' : 'Progression Fixture Validation');
        console.log('=====================================');
        results
            .sort((a, b) => priority[a.status] - priority[b.status] || a.fixture.metadata.id.localeCompare(b.fixture.metadata.id))
            .forEach((result) => {
            console.log(`- ${result.fixture.metadata.id}: ${result.status}`);
            console.log(`  expected=${result.fixture.metadata.expectedValidationStatus}`);
            console.log(`  categories=${result.categories.join(', ') || 'none'}`);
        });
    }
    if (failures.length > 0) {
        process.exitCode = 1;
    }
};
void main();
