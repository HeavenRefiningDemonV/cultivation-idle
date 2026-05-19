import type { DaoImpressionDefinition } from './types.js';

export const DAO_IMPRESSION_DEFINITIONS: readonly DaoImpressionDefinition[] = Object.freeze([
  {
    impressionId: 'first_boss_pattern',
    sourceKind: 'outskirts_first_boss',
    title: 'First Boss Pattern',
    doctrineFamily: 'breath',
    comprehensionDelta: 10,
    rarityBand: 'clear',
    displaySeal: 'jade',
    memoryEligible: false,
    copy: {
      shortLine: "The route's killing intent clarifies one breath of doctrine.",
      aftermathLine: "First Boss Pattern: the route's killing intent clarifies one breath of doctrine.",
      heartLawLine: 'A boss pattern settles into the Dao Heart.',
    },
  },
  {
    impressionId: 'gate_guardian_pattern',
    sourceKind: 'gate_close_defeat',
    title: 'Gate Guardian Pattern',
    doctrineFamily: 'trial',
    comprehensionDelta: 6,
    rarityBand: 'faint',
    displaySeal: 'shadow',
    memoryEligible: false,
    maxAwardsPerLife: 2,
    cooldownMs: 10 * 60 * 1000,
    copy: {
      shortLine: "The guardian's rhythm lingers in your breath.",
      aftermathLine: "Gate Guardian Pattern: the guardian's rhythm lingers in your breath.",
      heartLawLine: 'A close defeat named one pressure pattern.',
    },
  },
  {
    impressionId: 'threshold_revelation',
    sourceKind: 'gate_clear',
    title: 'Threshold Revelation',
    doctrineFamily: 'trial',
    comprehensionDelta: 15,
    rarityBand: 'threshold',
    displaySeal: 'gold',
    memoryEligible: true,
    maxAwardsPerLife: 1,
    copy: {
      shortLine: 'The opened gate leaves a clean line in the Dao Heart.',
      aftermathLine: 'Threshold Revelation: the opened gate leaves a clean line in the Dao Heart.',
      heartLawLine: 'The gate pattern is now etched into your breath.',
      lifeSummaryLine: 'Threshold Revelation deepened the Dao Heart after a Gate Trial clear.',
    },
  },
  {
    impressionId: 'ruin_echo',
    sourceKind: 'ruins_completion',
    title: 'Ruin Echo',
    doctrineFamily: 'ruin',
    comprehensionDelta: 8,
    rarityBand: 'clear',
    displaySeal: 'ink',
    memoryEligible: true,
    copy: {
      shortLine: 'Old stone pressure teaches the vessel how to settle.',
      aftermathLine: 'Ruin Echo: old stone pressure teaches the vessel how to settle.',
      heartLawLine: 'Ruin pressure leaves a settled vessel memory.',
      lifeSummaryLine: 'Ruin Echo settled the vessel through old stone pressure.',
    },
  },
  {
    impressionId: 'manual_insight',
    sourceKind: 'technique_mastery_milestone',
    title: 'Manual Insight',
    doctrineFamily: 'blade',
    comprehensionDelta: 5,
    rarityBand: 'faint',
    displaySeal: 'vermillion',
    memoryEligible: false,
    runtimeStatus: 'future_stub_only',
    copy: {
      shortLine: 'Repeated forms reveal the doctrine beneath the technique.',
      aftermathLine: 'Manual Insight: repeated forms reveal the doctrine beneath the technique.',
      heartLawLine: 'A future mastery milestone will clarify its doctrine.',
    },
  },
  {
    impressionId: 'breakthrough_resonance',
    sourceKind: 'breakthrough_resonance',
    title: 'Breakthrough Resonance',
    doctrineFamily: 'neutral',
    comprehensionDelta: 8,
    rarityBand: 'deep',
    displaySeal: 'vermillion',
    memoryEligible: true,
    maxAwardsPerLife: 1,
    copy: {
      shortLine: 'The old realm falls away, but its lesson remains.',
      aftermathLine: 'Breakthrough Resonance: the old realm falls away, but its lesson remains.',
      heartLawLine: 'A realm crossing echoes through the Dao Heart.',
      lifeSummaryLine: 'Breakthrough Resonance preserved the lesson of the crossed realm.',
    },
  },
]);

const DEFINITION_BY_ID = new Map(DAO_IMPRESSION_DEFINITIONS.map((definition) => [definition.impressionId, definition]));

export function getDaoImpressionDefinition(impressionId: string): DaoImpressionDefinition | null {
  return DEFINITION_BY_ID.get(impressionId) ?? null;
}
