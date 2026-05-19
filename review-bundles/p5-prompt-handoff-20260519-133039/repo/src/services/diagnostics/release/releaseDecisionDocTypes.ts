import type { ReleaseGateCheckId, ReleaseGateReport } from './releaseGateTypes.js';
import type { KnownIssueLedgerEntry } from './knownIssuesLedger.js';
import type { ReleaseGateCheckManifestEntry } from './releaseGateManifest.js';

export type ChecklistStatus = 'YES' | 'NO' | 'PENDING';

export type ChecklistQuestionDomain =
  | 'Engineering / startup integrity'
  | 'Progression / playability truth'
  | 'Balance / route integrity'
  | 'Runtime / safety integrity'
  | 'Copy / presentation integrity'
  | 'Known issues / waiver discipline';

export type ChecklistQuestionSpec = {
  checklistId: string;
  domain: ChecklistQuestionDomain;
  question: string;
  checkIds: ReleaseGateCheckId[];
  waiverAllowed: boolean;
  ownerRole: 'Engineering' | 'Progression/Content' | 'Balance/Systems' | 'QA/Release';
  extraEvidence?: string[];
};

export type ChecklistRow = {
  checklistId: string;
  domain: ChecklistQuestionDomain;
  question: string;
  checkIds: ReleaseGateCheckId[];
  status: ChecklistStatus;
  evidenceSources: string[];
  waiverAllowed: boolean;
  ownerRole: ChecklistQuestionSpec['ownerRole'];
};

export type ReleaseDecisionDocBuild = {
  report: ReleaseGateReport;
  manifest: ReadonlyArray<ReleaseGateCheckManifestEntry>;
  ledger: ReadonlyArray<KnownIssueLedgerEntry>;
  metadata?: {
    version?: string;
    commit?: string;
    buildId?: string;
  };
};

export type ReleaseDecisionDocsBundle = {
  checklistMarkdown: string;
  signoffMarkdown: string;
  handoffMarkdown: string;
  checklistRows: ChecklistRow[];
  binaryDecision: 'GO' | 'NO_GO';
};
