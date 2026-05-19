export type GateTrialExactAssetAvailability = 'available-existing' | 'deferred' | 'missing' | 'support-only';
export type GateTrialExactAssetRole =
  | 'final-scenic-plate'
  | 'support-background'
  | 'support-overlay'
  | 'chrome-frame'
  | 'chrome-plaque'
  | 'status-icon'
  | 'reward-icon'
  | 'cta-plate'
  | 'legacy-support-bridge';

export interface GateTrialExactAssetDescriptor {
  key: string;
  role: GateTrialExactAssetRole;
  path: string;
  availability: GateTrialExactAssetAvailability;
  allowedAsFinalScene: boolean;
  note: string;
}

export const GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING = {
  key: 'approvedFoundationGatePlate',
  targetMockupId: 'gate-trial-foundation-gate-readiness-2048x1152',
  approvedRuntimePath: 'src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png',
  approvedSourcePath: 'src/assets/Gate trail screen.png',
  artStatus: 'approved-bound',
  requiresFinalArtBinding: false,
  canClaimStrictVisualParity: true,
  cssClassName: 'gateTrialScenicStage--approvedBound',
  dataApprovedPlateBound: 'true',
  auditStatusLabel: 'approved-bound',
  note: 'Approved Foundation Gate scenic plate is bound from src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png.',
} as const;

export const GATE_TRIAL_EXACT_SCENIC_ART_CONTRACT = {
  foundationGate: {
    status: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.artStatus,
    targetMockupId: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.targetMockupId,
    reservedApprovedSourcePath: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.approvedSourcePath,
    reservedApprovedPlatePath: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.approvedRuntimePath,
    mockupReferenceLabel: 'Provided 2048x1152 Foundation Gate mockup',
    finalVisualAnchors: [
      'ink-wash mountain valley backdrop',
      'monumental stone stairs rising to a temple gate',
      'centered shrine/gate structure with a pale portal bloom',
      'warm torch basins on both sides of the steps',
      'small cultivator silhouette in lower-left foreground',
      'weathered circular stone platform foreground',
      'mist-heavy grayscale brushwork around mountains',
      'ornate jade readiness seal over lower center of scene',
      'guardian reward plaque beneath the seal',
    ],
    forbiddenFinalSubstitutes: [
      'src/assets/background/citystates/city_gate.png',
      'src/assets/background/InsideDungeon.png',
      'src/assets/onscreen/entrygate.png',
      'src/assets/onscreen/gate.png',
      'CSS gradients or generated mist as the final scene',
    ],
  },
} as const;

export const GATE_TRIAL_EXACT_ASSETS = {
  scenic: {
    approvedFoundationGatePlate: {
      key: 'approvedFoundationGatePlate',
      role: 'final-scenic-plate',
      path: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.approvedRuntimePath,
      availability: 'available-existing',
      allowedAsFinalScene: true,
      note: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.note,
    },
    cityGateSupport: {
      key: 'cityGateSupport',
      role: 'support-background',
      path: 'src/assets/background/citystates/city_gate.png',
      availability: 'available-existing',
      allowedAsFinalScene: false,
      note: 'Support-only city gate background; not the final mockup scene.',
    },
    insideDungeonSupport: {
      key: 'insideDungeonSupport',
      role: 'support-background',
      path: 'src/assets/background/InsideDungeon.png',
      availability: 'available-existing',
      allowedAsFinalScene: false,
      note: 'Support-only dungeon backdrop; wrong mood and not final.',
    },
    entryGateOverlay: {
      key: 'entryGateOverlay',
      role: 'support-overlay',
      path: 'src/assets/onscreen/entrygate.png',
      availability: 'available-existing',
      allowedAsFinalScene: false,
      note: 'Support overlay only; cannot replace full scenic plate.',
    },
    gateSymbolOverlay: {
      key: 'gateSymbolOverlay',
      role: 'support-overlay',
      path: 'src/assets/onscreen/gate.png',
      availability: 'available-existing',
      allowedAsFinalScene: false,
      note: 'Support symbol only; cannot replace full scenic plate.',
    },
    cultivatorBackshot: {
      key: 'cultivatorBackshot',
      role: 'support-overlay',
      path: 'src/assets/onscreen/cultivator_backshots.png',
      availability: 'available-existing',
      allowedAsFinalScene: false,
      note: 'Potential lower-left actor support only.',
    },
  },
  chrome: {
    barLong: { key: 'barLong', role: 'chrome-frame', path: 'src/assets/menus/bar_long.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Existing horizontal ornament support.' },
    barShort: { key: 'barShort', role: 'chrome-frame', path: 'src/assets/menus/bar_short.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Existing short ornament support.' },
    blockFancy: { key: 'blockFancy', role: 'chrome-frame', path: 'src/assets/menus/block_fancy.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Existing ornate block support.' },
    scroll: { key: 'scroll', role: 'chrome-frame', path: 'src/assets/menus/scroll.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Existing scroll/parchment support.' },
    generatedScreenPlaque: { key: 'generatedScreenPlaque', role: 'chrome-plaque', path: 'src/assets/Generated assets/ui_plaque_screen_header_long_default_l.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Generated support plaque; later packets may use as visual reference or asset.' },
    generatedRitualButton: { key: 'generatedRitualButton', role: 'cta-plate', path: 'src/assets/Generated assets/button_plate_ritual_primary_default.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Generated ritual button plate support for Attempt Gate CTA.' },
  },
  icons: {
    foundationPill: { key: 'foundationPill', role: 'reward-icon', path: 'src/assets/icons/foundationpill.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Reward icon fallback for Gate Foundation Pill.' },
    weapon: { key: 'weapon', role: 'status-icon', path: 'src/assets/icons/rustysword.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Weapon/top fix icon fallback.' },
    technique: { key: 'technique', role: 'status-icon', path: 'src/assets/icons/book_martial.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Technique/top fix icon fallback.' },
    healing: { key: 'healing', role: 'status-icon', path: 'src/assets/icons/hourglass_progress.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Healing/pouch icon fallback.' },
    taskComplete: { key: 'taskComplete', role: 'status-icon', path: 'src/assets/icons/task_complete.png', availability: 'available-existing', allowedAsFinalScene: false, note: 'Generic completion icon fallback.' },
  },
  legacySupportBridge: {
    currentGateTrialSupportRegistry: {
      key: 'currentGateTrialSupportRegistry',
      role: 'legacy-support-bridge',
      path: 'src/assets/ui/chrome/gate_trial_support/index.ts',
      availability: 'available-existing',
      allowedAsFinalScene: false,
      note: 'Existing support-art registry. Do not modify in G0-A; later packets may bridge exact page assets through it or replace with exact-specific roles.',
    },
  },
} as const;

export const GATE_TRIAL_EXACT_FORBIDDEN_FINAL_SCENE_ASSET_KEYS = [
  'cityGateSupport',
  'insideDungeonSupport',
  'entryGateOverlay',
  'gateSymbolOverlay',
] as const;

export const GATE_TRIAL_EXACT_ICON_KEYS = {
  statusCheck: 'statusCheck',
  statusWarning: 'statusWarning',
  statusLock: 'statusLock',
  gateMarker: 'gateMarker',
  hp: 'hp',
  loadout: 'loadout',
  aiProfile: 'aiProfile',
  healing: 'healing',
  bounty: 'bounty',
  expedition: 'expedition',
  foundationPill: 'foundationPill',
  weapon: 'weapon',
  technique: 'technique',
  failureSeal: 'failureSeal',
  currencySeal: 'currencySeal',
  reserveSeal: 'reserveSeal',
} as const;
