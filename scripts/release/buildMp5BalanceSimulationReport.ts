import { buildMp5BalanceSimulationReport } from '../../src/systems/balance/mp5BalanceSimulation.js';

const json = process.argv.includes('--json');
const report = buildMp5BalanceSimulationReport();

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`MP5 balance simulations: ${report.overallPass ? 'PASS' : 'FAIL'}`);
  console.log(`routeScenarios=${report.routeScenarioCount} exploitCases=${report.exploitCaseCount}`);
  report.exploitCases
    .filter((entry) => !entry.prevented)
    .forEach((entry) => console.log(`- ${entry.id}: ${entry.evidence}`));
}

if (!report.overallPass) {
  process.exit(1);
}
