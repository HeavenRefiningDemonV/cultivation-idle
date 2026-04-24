export type OutskirtsPlanningAffordanceId =
  | 'settingsGear'
  | 'startHunt'
  | 'stripPrevious'
  | 'stripNext'
  | 'stripNodeSelect'
  | 'autoRepeatToggle'
  | 'medicinePouch'
  | 'setupLoadout'
  | 'setupAiProfile'
  | 'setupAttackFocus'
  | 'setupEquipment'
  | 'tacticalLoadout'
  | 'tacticalAiProfile'
  | 'tacticalBounty'
  | 'tacticalExpedition'
  | 'rewardsTrackedBounty'
  | 'areaPlaqueSelect';

export type OutskirtsPlanningAffordanceClassification = 'grounded' | 'intentionally-inert';

export const OUTSKIRTS_PLANNING_AFFORDANCE_CLASSIFICATION: Record<
OutskirtsPlanningAffordanceId,
OutskirtsPlanningAffordanceClassification
> = {
  settingsGear: 'grounded',
  startHunt: 'grounded',
  stripPrevious: 'grounded',
  stripNext: 'grounded',
  stripNodeSelect: 'grounded',
  autoRepeatToggle: 'grounded',
  medicinePouch: 'grounded',
  setupLoadout: 'grounded',
  setupAiProfile: 'grounded',
  setupAttackFocus: 'grounded',
  setupEquipment: 'grounded',
  tacticalLoadout: 'grounded',
  tacticalAiProfile: 'grounded',
  tacticalBounty: 'grounded',
  tacticalExpedition: 'grounded',
  rewardsTrackedBounty: 'grounded',
  areaPlaqueSelect: 'intentionally-inert',
};
