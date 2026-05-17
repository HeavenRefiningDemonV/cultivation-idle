import type { ReleaseGateCheckId } from './releaseGateTypes.js';

export type ReleaseGateCheckManifestEntry = {
  checkId: ReleaseGateCheckId;
  order: number;
  title: string;
  packetOwners: string[];
  why: string;
  evidenceCommand: string;
  evidencePaths: string[];
  canEmitWaiverCandidateWarnings: boolean;
  failureAlwaysBlocker: boolean;
  canReturnPendingManual: boolean;
};

export const RELEASE_GATE_MANIFEST: ReadonlyArray<ReleaseGateCheckManifestEntry> = Object.freeze([
  {
    checkId: 'runtime_content_manifest',
    order: 1,
    title: 'Runtime Content Manifest',
    packetOwners: ['P0-01'],
    why: 'Ensures the playable artifact source tree contains every runtime JSON file the loader fetches.',
    evidenceCommand: 'npm run release:runtime-content-manifest:json',
    evidencePaths: ['public/cultivation_idle_content_bible_v1_config', 'docs/release/runtime_content_manifest.md'],
    canEmitWaiverCandidateWarnings: false,
    failureAlwaysBlocker: true,
    canReturnPendingManual: false,
  },
  {
    checkId: 'build_audit',
    order: 2,
    title: 'Build Warning Inventory',
    packetOwners: ['7.4a'],
    why: 'Ensures build blockers/warnings are explicitly classified before RC sign-off.',
    evidenceCommand: 'npm run release:build-audit:json',
    evidencePaths: ['docs/release/build_warning_inventory.md'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: true,
    canReturnPendingManual: false,
  },
  {
    checkId: 'content_validation',
    order: 3,
    title: 'Content Validation',
    packetOwners: ['core-content'],
    why: 'Validates authored content pack cross-references and semester-slice integrity.',
    evidenceCommand: 'npm run validate:content',
    evidencePaths: ['public/cultivation_idle_content_bible_v1_config'],
    canEmitWaiverCandidateWarnings: false,
    failureAlwaysBlocker: true,
    canReturnPendingManual: false,
  },
  {
    checkId: 'progression_contract',
    order: 4,
    title: 'Progression Contract Drift',
    packetOwners: ['1.1-1.8'],
    why: 'Prevents progression-truth drift between authored content and runtime surfaces.',
    evidenceCommand: 'builder:buildProgressionContract + collectProgressionDiagnostics',
    evidencePaths: ['src/systems/progression/contract', 'src/systems/progression/diagnostics'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: false,
    canReturnPendingManual: false,
  },
  {
    checkId: 'fresh_run_acceptance',
    order: 5,
    title: 'Fresh Run Acceptance',
    packetOwners: ['7.1'],
    why: 'Ensures new-life progression and final-truth checkpoints remain release-honest.',
    evidenceCommand: 'npm run release:fresh-run-report:json',
    evidencePaths: ['docs/release/qa/fresh_save_routes.md'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: false,
    canReturnPendingManual: true,
  },
  {
    checkId: 'migration_matrix',
    order: 6,
    title: 'Migration Matrix',
    packetOwners: ['7.2'],
    why: 'Verifies migration safety across canonical fixture classes and high-risk save variants.',
    evidenceCommand: 'npm run release:migration-matrix:json',
    evidencePaths: ['docs/release/migration_fixture_catalog.md'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: false,
    canReturnPendingManual: false,
  },
  {
    checkId: 'balance_regression',
    order: 7,
    title: 'Balance Regression',
    packetOwners: ['6.x', '7.3'],
    why: 'Guards pacing, throughput and AP/hour envelopes for semester release balancing.',
    evidenceCommand: 'npm run balance:report:json',
    evidencePaths: ['tmp-tests/scripts/balanceRegressionReport.js'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: false,
    canReturnPendingManual: false,
  },
  {
    checkId: 'route_comparison',
    order: 8,
    title: 'Route Comparison',
    packetOwners: ['7.3'],
    why: 'Ensures fresh/offline/reclaim route truth stays aligned with semester final-truth constraints.',
    evidenceCommand: 'npm run release:route-report:json',
    evidencePaths: ['docs/release/qa'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: false,
    canReturnPendingManual: false,
  },
  {
    checkId: 'runtime_diagnostics',
    order: 9,
    title: 'Runtime Diagnostics',
    packetOwners: ['7.4c'],
    why: 'Catches runtime validation errors and health regressions before RC.',
    evidenceCommand: 'npm run release:runtime-diagnostics:json',
    evidencePaths: ['src/services/diagnostics/runValidation.ts'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: false,
    canReturnPendingManual: false,
  },
  {
    checkId: 'vocabulary_audit',
    order: 10,
    title: 'Vocabulary Audit',
    packetOwners: ['7.5a'],
    why: 'Prevents stale placeholder/debug copy regressions on tracked live surfaces.',
    evidenceCommand: 'npm run release:vocab-audit:json',
    evidencePaths: ['docs/release/vocabulary_audit.md'],
    canEmitWaiverCandidateWarnings: true,
    failureAlwaysBlocker: false,
    canReturnPendingManual: false,
  },
  {
    checkId: 'full_test_suite',
    order: 11,
    title: 'Full Test Suite',
    packetOwners: ['7.4d-7.5d'],
    why: 'Authoritative umbrella proof for test-first release-critical checks.',
    evidenceCommand: 'npm run test',
    evidencePaths: ['tests/contracts', 'tests/integration/release', 'tests/migrations'],
    canEmitWaiverCandidateWarnings: false,
    failureAlwaysBlocker: true,
    canReturnPendingManual: false,
  },
]);

export const RELEASE_GATE_CHECK_IDS = RELEASE_GATE_MANIFEST.map((entry) => entry.checkId);
