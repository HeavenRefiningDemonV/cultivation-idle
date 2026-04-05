import { PHASE0_CORE_SURFACE_IDS } from './phase0CoreSurfaceIds.js';

export type Phase0CoreFxMode = 'high' | 'low' | 'reduced';

export interface Phase0CoreEvidenceTarget {
  id: string;
  humanLabel: string;
  evidenceFolder: string;
  narrowWidthRequired: boolean;
  interactionRequired: boolean;
  truthStatesRequired: boolean;
  reachability: 'live' | 'state-gated' | 'forced-only';
  captureRoutes: Record<Phase0CoreFxMode, string>;
  notes?: string;
}

const buildCaptureRoutes = (id: string): Record<Phase0CoreFxMode, string> => ({
  high: `/?uiAudit=phase-0&surface=${id}&fx=high`,
  low: `/?uiAudit=phase-0&surface=${id}&fx=low`,
  reduced: `/?uiAudit=phase-0&surface=${id}&fx=reduced`,
});

export const PHASE0_CORE_EVIDENCE_TARGETS: readonly Phase0CoreEvidenceTarget[] = [
  {
    id: 'path-life-start',
    humanLabel: 'Path / Life Start',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/01-path-life-start',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: false,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('path-life-start'),
    notes: 'Truth states slot is optional here and must be explicitly marked N/A if omitted.',
  },
  {
    id: 'cultivation',
    humanLabel: 'Cultivation',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/02-cultivation',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('cultivation'),
  },
  {
    id: 'status',
    humanLabel: 'Status',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/03-status',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('status'),
  },
  {
    id: 'world',
    humanLabel: 'World',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/04-world',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('world'),
  },
  {
    id: 'manual-pavilion',
    humanLabel: 'Manual Pavilion',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/05-manual-pavilion',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('manual-pavilion'),
  },
  {
    id: 'techniques',
    humanLabel: 'Techniques',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/06-techniques',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('techniques'),
  },
  {
    id: 'apothecary',
    humanLabel: 'Apothecary',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/07-apothecary',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('apothecary'),
  },
  {
    id: 'forge',
    humanLabel: 'Forge',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/08-forge',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('forge'),
  },
  {
    id: 'bounties-expeditions',
    humanLabel: 'Bounties / Expeditions',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/09-bounties-expeditions',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('bounties-expeditions'),
    notes: 'Harness toggles bounties and expeditions module surfaces by slot while retaining the fixed legal filename set.',
  },
  {
    id: 'prestige',
    humanLabel: 'Prestige',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-0-core-screens/10-prestige',
    narrowWidthRequired: false,
    interactionRequired: true,
    truthStatesRequired: true,
    reachability: 'forced-only',
    captureRoutes: buildCaptureRoutes('prestige'),
  },
] as const;

const manifestIdSet = new Set(PHASE0_CORE_EVIDENCE_TARGETS.map((target) => target.id));
if (PHASE0_CORE_SURFACE_IDS.some((id) => !manifestIdSet.has(id)) || manifestIdSet.size !== PHASE0_CORE_SURFACE_IDS.length) {
  throw new Error('Phase 0 core evidence targets must stay aligned with core surface ids.');
}
