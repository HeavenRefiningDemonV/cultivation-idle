import { SECTION_C_SURFACE_IDS } from './sectionCSurfaceIds.js';

export type SectionCFxMode = 'high' | 'low' | 'reduced';

export interface SectionCEvidenceTarget {
  id: string;
  humanLabel: string;
  evidenceFolder: string;
  narrowWidthRequired: boolean;
  interactionRequired: boolean;
  truthStatesRequired: boolean;
  reachability: 'live' | 'state-gated' | 'forced-only';
  captureRoutes: Record<SectionCFxMode, string>;
  notes?: string;
}

const buildCaptureRoutes = (id: string): Record<SectionCFxMode, string> => ({
  high: `/?uiAudit=section-c&surface=${id}&fx=high`,
  low: `/?uiAudit=section-c&surface=${id}&fx=low`,
  reduced: `/?uiAudit=section-c&surface=${id}&fx=reduced`,
});

export const SECTION_C_EVIDENCE_TARGETS: readonly SectionCEvidenceTarget[] = [
  {
    id: 'life-start-path',
    humanLabel: 'Life Start Path (Step 1)',
    evidenceFolder: 'docs/release/qa/ui-cutover/life-start-path',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: false,
    reachability: 'live',
    captureRoutes: buildCaptureRoutes('life-start-path'),
    notes: 'Truth-states slot is N/A for this surface.',
  },
  {
    id: 'life-start-heart-law',
    humanLabel: 'Life Start Heart Law (Step 2)',
    evidenceFolder: 'docs/release/qa/ui-cutover/life-start-heart-law',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'live',
    captureRoutes: buildCaptureRoutes('life-start-heart-law'),
  },
  {
    id: 'life-start-breath-focus',
    humanLabel: 'Life Start Breath Focus (Step 3)',
    evidenceFolder: 'docs/release/qa/ui-cutover/life-start-breath-focus',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: false,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('life-start-breath-focus'),
    notes: 'Forced-only harness state for deterministic capture.',
  },
  {
    id: 'dao-heart-law',
    humanLabel: 'Dao Heart — Heart Law tab',
    evidenceFolder: 'docs/release/qa/ui-cutover/dao-heart-law',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'live',
    captureRoutes: buildCaptureRoutes('dao-heart-law'),
  },
  {
    id: 'dao-heart-study',
    humanLabel: 'Dao Heart — Study tab',
    evidenceFolder: 'docs/release/qa/ui-cutover/dao-heart-study',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: false,
    reachability: 'live',
    captureRoutes: buildCaptureRoutes('dao-heart-study'),
    notes: 'Truth-states slot is optional and must be explicitly N/A in README when omitted.',
  },
  {
    id: 'change-heart-law',
    humanLabel: 'Change Heart Law modal',
    evidenceFolder: 'docs/release/qa/ui-cutover/change-heart-law',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'state-gated',
    captureRoutes: buildCaptureRoutes('change-heart-law'),
  },
  {
    id: 'prestige-ritual',
    humanLabel: 'Prestige Reincarnation Ritual modal',
    evidenceFolder: 'docs/release/qa/ui-cutover/prestige-ritual',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'live',
    captureRoutes: buildCaptureRoutes('prestige-ritual'),
  },
  {
    id: 'current-chapter-exhausted',
    humanLabel: 'Current Chapter Exhausted modal',
    evidenceFolder: 'docs/release/qa/ui-cutover/current-chapter-exhausted',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: false,
    reachability: 'state-gated',
    captureRoutes: buildCaptureRoutes('current-chapter-exhausted'),
    notes: 'Truth-states slot is N/A for this surface.',
  },
  {
    id: 'life-summary',
    humanLabel: 'Life Summary modal (current mode)',
    evidenceFolder: 'docs/release/qa/ui-cutover/life-summary',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'state-gated',
    captureRoutes: buildCaptureRoutes('life-summary'),
  },
] as const;

const manifestIdSet = new Set(SECTION_C_EVIDENCE_TARGETS.map((entry) => entry.id));
if (SECTION_C_SURFACE_IDS.some((id) => !manifestIdSet.has(id)) || manifestIdSet.size !== SECTION_C_SURFACE_IDS.length) {
  throw new Error('Section C evidence targets must stay aligned with harness surface ids.');
}
