import { PHASE6_COMBAT_SURFACE_IDS } from './phase6CombatSurfaceIds.js';

export type Phase6CombatFxMode = 'high' | 'low' | 'reduced';

export interface Phase6CombatEvidenceTarget {
  id: string;
  humanLabel: string;
  evidenceFolder: string;
  interactionRequired: boolean;
  truthStatesRequired: boolean;
  captureRoutes: Record<Phase6CombatFxMode, string>;
  slotNotes: Record<'01-base.png' | '02-interaction.png' | '03-truth-states.png', string>;
}

const buildCaptureRoutes = (id: string): Record<Phase6CombatFxMode, string> => ({
  high: `/?uiAudit=phase-6-combat&surface=${id}&fx=high`,
  low: `/?uiAudit=phase-6-combat&surface=${id}&fx=low`,
  reduced: `/?uiAudit=phase-6-combat&surface=${id}&fx=reduced`,
});

export const PHASE6_COMBAT_EVIDENCE_TARGETS: readonly Phase6CombatEvidenceTarget[] = [
  {
    id: 'outskirts',
    humanLabel: 'Outskirts',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts',
    interactionRequired: true,
    truthStatesRequired: true,
    captureRoutes: buildCaptureRoutes('outskirts'),
    slotNotes: {
      '01-base.png': 'idle / non-combat / default open-from-world state',
      '02-interaction.png': 'active outskirts combat mid-fight, with HP bars and current enemy visible',
      '03-truth-states.png': 'reward/role/RunCompass/CTA/tracked-bounty/AI-hint truth capture',
    },
  },
  {
    id: 'ruins',
    humanLabel: 'Ruins',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins',
    interactionRequired: true,
    truthStatesRequired: true,
    captureRoutes: buildCaptureRoutes('ruins'),
    slotNotes: {
      '01-base.png': 'idle / default open-from-world state',
      '02-interaction.png': 'active/in-progress ruins run state',
      '03-truth-states.png': 'room count / guaranteed anchor / lead materials / pity / auto-repeat truth capture',
    },
  },
  {
    id: 'gate-trial',
    humanLabel: 'Gate Trial',
    evidenceFolder: 'docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial',
    interactionRequired: true,
    truthStatesRequired: true,
    captureRoutes: buildCaptureRoutes('gate-trial'),
    slotNotes: {
      '01-base.png': 'default available/idle gate state',
      '02-interaction.png': 'post-failure state with diagnosis/top fixes/fail-safe progress visible',
      '03-truth-states.png': 'readiness/checklists/fail-safe/CTA truth capture',
    },
  },
] as const;

const manifestIdSet = new Set(PHASE6_COMBAT_EVIDENCE_TARGETS.map((entry) => entry.id));
if (PHASE6_COMBAT_SURFACE_IDS.some((id) => !manifestIdSet.has(id)) || manifestIdSet.size !== PHASE6_COMBAT_SURFACE_IDS.length) {
  throw new Error('Phase 6 combat evidence targets must stay aligned with harness surface ids.');
}
