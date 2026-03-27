import { runVocabularyAudit, renderVocabularyAuditReport } from '../../src/services/diagnostics/release/vocabularyAudit.js';

interface CliOptions {
  json: boolean;
  failOnDrift: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  return {
    json: argv.includes('--json'),
    failOnDrift: argv.includes('--fail-on-drift'),
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const report = runVocabularyAudit();
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderVocabularyAuditReport(report));
  }

  if (options.failOnDrift && !report.overallPass) {
    process.exit(2);
  }
}

run().catch((error) => {
  console.error('[auditVocabulary] Failed');
  console.error(error);
  process.exit(1);
});
