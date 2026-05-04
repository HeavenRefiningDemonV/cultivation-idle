import type {
  GateTrialButtonSurface,
  GateTrialChecklistRowSurface,
  GateTrialExactSurfaceV1,
  GateTrialFactRowSurface,
  GateTrialFixSurface,
  GateTrialReadinessNodeSurface,
  GateTrialSummaryRowSurface,
} from './gateTrialExactTypes.js';

import {
  GATE_TRIAL_EXACT_REGION_ORDER,
  GATE_TRIAL_EXACT_ROOT_TEST_ID,
  GATE_TRIAL_EXACT_SURFACE_VERSION,
  GATE_TRIAL_FIXTURE_COPY,
  GATE_TRIAL_FIXTURE_FAIL_SAFE_ROWS,
  GATE_TRIAL_FIXTURE_MINIMUM_ROWS,
  GATE_TRIAL_FIXTURE_READINESS_NODES,
  GATE_TRIAL_FIXTURE_RECOMMENDED_ROWS,
  GATE_TRIAL_FIXTURE_SUMMARY_ROWS,
  GATE_TRIAL_FIXTURE_TOP_FIXES,
  GATE_TRIAL_TARGET_MOCKUP_ID,
} from './gateTrialExactPresentation.js';

import { GATE_TRIAL_EXACT_ASSETS } from './gateTrialExactAssetRegistry.js';

const FIXTURE_SOURCE = 'fixture' as const;

function fixtureRouteButton(intent: GateTrialButtonSurface['intent'], label: string, ariaLabel: string): GateTrialButtonSurface {
  return {
    visible: true,
    enabled: true,
    label,
    ariaLabel,
    intent,
    tone: 'neutral',
    ornamentVariant: 'small-parchment',
  };
}

function disabledSafetyNetButton(): GateTrialButtonSurface {
  return {
    visible: true,
    enabled: false,
    label: 'Safety Net Locked',
    ariaLabel: 'Safety net locked for this Gate Trial fixture',
    intent: 'buy-safety-net',
    tone: 'locked',
    disabledReason: 'Eligible failures 3 / 5 and reserve 12 Merit · 610 Gold are below the 15 Merit · 800 Gold cost.',
    ornamentVariant: 'locked-stone',
  };
}

function toChecklistRow(row: (typeof GATE_TRIAL_FIXTURE_MINIMUM_ROWS)[number] | (typeof GATE_TRIAL_FIXTURE_RECOMMENDED_ROWS)[number]): GateTrialChecklistRowSurface {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    status: row.status,
    iconKey: row.iconKey,
    source: FIXTURE_SOURCE,
    routeTarget: 'routeTarget' in row ? row.routeTarget : undefined,
  };
}

function toFactRow(row: (typeof GATE_TRIAL_FIXTURE_FAIL_SAFE_ROWS)[number]): GateTrialFactRowSurface {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    iconKey: row.iconKey,
    tone: row.tone,
    source: FIXTURE_SOURCE,
  };
}

function toSummaryRow(row: (typeof GATE_TRIAL_FIXTURE_SUMMARY_ROWS)[number]): GateTrialSummaryRowSurface {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    tone: row.tone,
    source: FIXTURE_SOURCE,
  };
}

function toReadinessNode(row: (typeof GATE_TRIAL_FIXTURE_READINESS_NODES)[number]): GateTrialReadinessNodeSurface {
  return {
    id: row.id,
    label: row.label,
    status: row.status,
    iconKey: row.iconKey,
    medallionVariant: row.medallionVariant,
    ariaLabel: `${row.label}: ${row.status}`,
    source: FIXTURE_SOURCE,
  };
}

export function createGateTrialExactMockupFixture(
  overrides: Partial<GateTrialExactSurfaceV1> = {},
): GateTrialExactSurfaceV1 {
  const topFixes: readonly GateTrialFixSurface[] = [
    {
      id: GATE_TRIAL_FIXTURE_TOP_FIXES[0].id,
      label: GATE_TRIAL_FIXTURE_TOP_FIXES[0].label,
      iconKey: GATE_TRIAL_FIXTURE_TOP_FIXES[0].iconKey,
      routeTarget: GATE_TRIAL_FIXTURE_TOP_FIXES[0].routeTarget,
      button: fixtureRouteButton('route-to-forge', 'Go to Forge', 'Route to forge from Gate Trial fixture'),
      source: FIXTURE_SOURCE,
    },
    {
      id: GATE_TRIAL_FIXTURE_TOP_FIXES[1].id,
      label: GATE_TRIAL_FIXTURE_TOP_FIXES[1].label,
      iconKey: GATE_TRIAL_FIXTURE_TOP_FIXES[1].iconKey,
      routeTarget: GATE_TRIAL_FIXTURE_TOP_FIXES[1].routeTarget,
      button: fixtureRouteButton('route-to-apothecary', 'Go to Apothecary', 'Route to apothecary from Gate Trial fixture'),
      source: FIXTURE_SOURCE,
    },
    {
      id: GATE_TRIAL_FIXTURE_TOP_FIXES[2].id,
      label: GATE_TRIAL_FIXTURE_TOP_FIXES[2].label,
      iconKey: GATE_TRIAL_FIXTURE_TOP_FIXES[2].iconKey,
      routeTarget: GATE_TRIAL_FIXTURE_TOP_FIXES[2].routeTarget,
      button: fixtureRouteButton('route-to-techniques', 'Go to Techniques', 'Route to techniques from Gate Trial fixture'),
      source: FIXTURE_SOURCE,
    },
  ];

  const surface: GateTrialExactSurfaceV1 = {
    meta: {
      surfaceId: 'gate-trial-exact',
      version: GATE_TRIAL_EXACT_SURFACE_VERSION,
      mode: 'fixture',
      source: 'fixture',
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      targetMockupId: GATE_TRIAL_TARGET_MOCKUP_ID,
      activityMode: 'available',
      lifecycleState: 'available',
      resolution: 'none',
      readinessScore: GATE_TRIAL_FIXTURE_COPY.readinessSeal.score,
      rootTestId: GATE_TRIAL_EXACT_ROOT_TEST_ID,
    },
    shell: {
      useScreenOwnedExactPage: true,
      showLegacyCombatShell: false,
      showGateTrialWorldLayout: false,
      showCombatModuleTopLane: false,
      showGateTrialReadinessCard: false,
      showGateTrialAttemptCluster: false,
      showExternalCombatPreview: false,
      suppressExternalCombatPreview: true,
      singleDominantCta: true,
    },
    page: {
      title: GATE_TRIAL_FIXTURE_COPY.pageTitle,
      titleSeal: { visible: true, assetKey: 'redInkSeal', text: null },
      topRightStatus: GATE_TRIAL_FIXTURE_COPY.topRightStatus,
    },
    topRibbon: {
      ariaLabel: 'Gate Trial breakthrough route',
      decorative: true,
      currentGateLabel: 'Foundation Gate',
      activeNodeId: 'foundation-gate',
      nodes: [
        { id: 'qi-condensation-early', label: 'Early Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'qi-condensation-middle', label: 'Middle Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'qi-condensation-late', label: 'Late Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'qi-condensation-peak', label: 'Peak Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'foundation-gate', label: 'Foundation Gate', state: 'current', variant: 'gate-marker', decorative: true },
        { id: 'foundation-early', label: 'Early Foundation', state: 'future', variant: 'muted', decorative: true },
        { id: 'foundation-middle', label: 'Middle Foundation', state: 'future', variant: 'muted', decorative: true },
        { id: 'foundation-late', label: 'Late Foundation', state: 'future', variant: 'muted', decorative: true },
        { id: 'core-gate', label: 'Core Gate', state: 'future', variant: 'muted', decorative: true },
      ],
    },
    tacticalStrip: {
      ariaLabel: 'Gate Trial tactical readout',
      cells: [
        { id: 'hp', label: 'HP', primaryText: '131 / 131', iconKey: 'hp', tone: 'positive', showCaret: false, showNotificationDot: false, showUnderlineBar: true, underlineBarPct: 100, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'gate', label: 'Gate', primaryText: 'Foundation · Lv. 15', iconKey: 'gateMarker', tone: 'ceremonial', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'loadout', label: 'Loadout', primaryText: 'Loadout 1', iconKey: 'loadout', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'aiProfile', label: 'AI Profile', primaryText: 'Balanced', iconKey: 'aiProfile', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'healing', label: 'Healing', primaryText: '12 / 20', iconKey: 'healing', tone: 'positive', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'bounty', label: 'Bounty', primaryText: 'No tracked bounty', iconKey: 'bounty', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'expedition', label: 'Expedition', primaryText: '2 Idle', iconKey: 'expedition', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
      ],
    },
    gateHeader: {
      title: GATE_TRIAL_FIXTURE_COPY.gateHeader.title,
      subtitle: GATE_TRIAL_FIXTURE_COPY.gateHeader.subtitle,
      plaqueVariant: 'black-gold-foundation',
      chips: [
        { id: 'milestone-gate', label: 'Milestone Gate', iconKey: 'gateMarker', tone: 'ceremonial' },
        { id: 'readiness-check', label: 'Readiness Check', iconKey: 'statusCheck', tone: 'positive' },
        { id: 'safety-net-tracked', label: 'Safety Net Tracked', iconKey: 'statusLock', tone: 'neutral' },
      ],
    },
    minimumChecklist: {
      title: 'Minimum Checklist',
      stamp: { visible: true, label: 'Viable', tone: 'positive' },
      rows: GATE_TRIAL_FIXTURE_MINIMUM_ROWS.map(toChecklistRow),
    },
    scenicStage: {
      sceneAssetId: GATE_TRIAL_EXACT_ASSETS.scenic.approvedFoundationGatePlate.key,
      artStatus: 'deferred',
      requiresFinalArtBinding: true,
      environmentDescriptor: 'Deferred Foundation Gate threshold scene: ink-wash mountain valley, monumental temple stairs, centered shrine gate, pale portal bloom, warm torch basins, lower-left cultivator silhouette, mist, and ornate readiness seal placement matching the provided 2048x1152 mockup.',
      readinessSeal: {
        verdict: 'VIABLE',
        scoreLabel: 'Readiness 74 / 100',
        state: 'viable',
        ornamentAssetKey: 'readinessSealOrnament',
        glowAssetKey: 'readinessGlowSoft',
      },
      guardianPlaque: {
        title: 'Gate Guardian · Lv. 15',
        subtitle: 'Foundation Establishment Trial',
        rewardLines: ['Clear Reward: Gate Foundation Pill ×1', 'Used for Foundation Breakthrough'],
        rewardIconKey: GATE_TRIAL_EXACT_ASSETS.icons.foundationPill.key,
        gateItemId: 'gate_foundation_pill',
      },
      visualFlags: {
        usesOldCombatPathScene: false,
        usesOutskirtsScene: false,
        usesRuinsScene: false,
        usesCityGateAsFinalScene: false,
        usesInsideDungeonAsFinalScene: false,
        usesCssAsFinalArt: false,
      },
    },
    recommendedPanel: {
      title: 'Recommended',
      recommendedPrepTitle: 'Recommended Prep',
      prepRows: GATE_TRIAL_FIXTURE_RECOMMENDED_ROWS.map(toChecklistRow),
      failSafeTitle: 'Fail-Safe',
      failSafeRows: GATE_TRIAL_FIXTURE_FAIL_SAFE_ROWS.map(toFactRow),
      safetyNetButton: disabledSafetyNetButton(),
      topFixesTitle: 'Top Fixes',
      topFixes,
    },
    trialSummary: {
      title: 'Trial Summary',
      rows: [
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[0]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[1]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[2]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[3]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[4]),
      ],
    },
    readinessRail: {
      title: 'Foundation Gate Readiness',
      nodes: [
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[0]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[1]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[2]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[3]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[4]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[5]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[6]),
      ],
    },
    primaryAction: {
      visible: true,
      enabled: true,
      label: GATE_TRIAL_FIXTURE_COPY.primaryCta,
      ariaLabel: 'Attempt Foundation Gate',
      intent: 'attempt-gate',
      tone: 'ceremonial',
      singleDominantCta: true,
      ornamentVariant: 'jade-gold',
    },
    debug: {
      regionOrder: GATE_TRIAL_EXACT_REGION_ORDER,
      missingDataFallbacks: [],
      placeholderAssetKeysInUse: [],
      liveSourceNotes: [
        'Fixture surface is store-free and mockup-locked for Gate Trial Exact planning-state visual parity.',
        'Central scenic art is intentionally deferred; final approved Foundation Gate plate must be bound before visual parity can be declared.',
      ],
      fixtureLockedValues: [
        'Gate Trial title',
        'Foundation Gate header',
        'Readiness 74 / 100',
        'Eligible Failures 3 / 5',
        'Safety Net Locked',
        'Attempt Gate',
      ],
      visualContractNotes: [
        'Gate Trial is a ceremonial threshold, not a farm lane or ruins route.',
        'Minimum Checklist remains the left rail; Recommended, Fail-Safe, and Top Fixes remain the right rail.',
        'Safety Net stays locked in this fixture even though the primary Attempt Gate CTA is enabled.',
      ],
    },
  };

  return { ...surface, ...overrides };
}
