import type { SpiritRootProgressionDef } from '../../content/types.js';
import {
  buildSpiritRootProgressionSnapshot,
  describeRootHeartFitEffect,
  getSpiritRootShapeSnapshot,
  type RootVfxRow,
} from '../../systems/spiritRoots/index.js';
import type {
  BuildSpiritRootObservationSurfaceInput,
  SpiritRootObservationRow,
  SpiritRootObservationSurfaceV1,
  SpiritRootObservationTab,
  SpiritRootObservationTabId,
} from './spiritRootObservationTypes.js';

const TAB_LABELS: Readonly<Record<SpiritRootObservationTabId, string>> = Object.freeze({
  profile: 'Profile',
  fit: 'Fit',
  effects: 'Effects',
  variants: 'Variants',
  practice_routes: 'Practice Routes',
  history: 'History',
});

const TAB_ORDER = Object.freeze([
  'profile',
  'fit',
  'effects',
  'variants',
  'practice_routes',
  'history',
] as const satisfies readonly SpiritRootObservationTabId[]);

function row(args: SpiritRootObservationRow): SpiritRootObservationRow {
  return args;
}

function toneForFit(tier: string): SpiritRootObservationRow['tone'] {
  if (tier === 'resonant') return 'success';
  if (tier === 'compatible') return 'jade';
  if (tier === 'strained') return 'warning';
  if (tier === 'opposed') return 'danger';
  return 'muted';
}

function rootDisplayName(input: BuildSpiritRootObservationSurfaceInput, rootDef: SpiritRootProgressionDef): string {
  if (input.root) return rootDef.displayName;
  return 'Dormant Spirit Root';
}

function rootDefFor(input: BuildSpiritRootObservationSurfaceInput): SpiritRootProgressionDef {
  const elementId = input.root?.element ?? input.rootDef?.elementId ?? 'wood';
  return input.rootDef ?? {
    elementId,
    displayName: `${elementId.slice(0, 1).toUpperCase()}${elementId.slice(1)} Root`,
    procName: 'Root Pulse',
    description: 'Spirit Root response.',
    purityGrades: [1, 2, 3, 4, 5],
    awakeningStates: ['dormant', 'stirring', 'open', 'radiant', 'transformed'],
    effectId: `${elementId}_root_pulse_v1`,
    procChanceCapPct: 18,
    internalCooldownSec: 10,
    hardLocksMismatchRoutes: false,
  };
}

function profileRows(surface: Pick<SpiritRootObservationSurfaceV1, 'profile' | 'progression' | 'fit'>): SpiritRootObservationRow[] {
  return [
    row({
      id: 'profile-element',
      label: 'Root Element',
      value: surface.profile.displayName,
      detail: `${surface.profile.playstyleLabel}; ${surface.profile.temperamentTags.join(', ')}.`,
      tone: 'jade',
    }),
    row({
      id: 'profile-purity',
      label: 'Purity',
      value: surface.profile.purityLabel,
      detail: 'Purity still affects root strength through the existing prestige root truth.',
      tone: 'info',
    }),
    row({
      id: 'profile-awakening',
      label: 'Awakening',
      value: surface.profile.awakeningLabel,
      detail: `Current proc: ${surface.progression.proc.procName}; cooldown ${surface.progression.proc.cooldownSec}s.`,
      tone: 'gold',
    }),
    row({
      id: 'profile-shape',
      label: 'Shape',
      value: surface.profile.shapeLabel,
      detail: 'Shape modifies expression, but no mismatch route is hard-locked.',
      tone: 'muted',
    }),
  ];
}

function fitRows(surface: Pick<SpiritRootObservationSurfaceV1, 'fit'>): SpiritRootObservationRow[] {
  return [
    row({
      id: 'fit-tier',
      label: 'Current Fit',
      value: surface.fit.label,
      detail: surface.fit.summary,
      tone: toneForFit(surface.fit.tier),
    }),
    row({
      id: 'fit-expression',
      label: 'Expression Cap',
      value: `${surface.fit.effectiveExpression}/${surface.fit.effects.expressionCap}`,
      detail: surface.fit.effectiveExpression < surface.fit.effects.expressionCap
        ? 'Current root expression is below the fit cap.'
        : `Current fit caps expression at ${surface.fit.effects.expressionCap}%.`,
      tone: surface.fit.tier === 'strained' || surface.fit.tier === 'opposed' ? 'warning' : 'info',
    }),
    row({
      id: 'fit-lock',
      label: 'Run Validity',
      value: 'Playable',
      detail: 'No root mismatch creates a hard invalid run.',
      tone: 'success',
    }),
  ];
}

function effectRow(id: string, label: string, value: number, detail: string): SpiritRootObservationRow {
  const penalty = value < 1;
  return row({
    id,
    label,
    value: describeRootHeartFitEffect(value),
    detail: penalty ? `${detail} Fit penalty is active.` : detail,
    tone: penalty ? 'warning' : value > 1 ? 'success' : 'muted',
  });
}

function effectRows(surface: Pick<SpiritRootObservationSurfaceV1, 'fit'>): SpiritRootObservationRow[] {
  return [
    effectRow('effect-cultivation-speed', 'Cultivation Speed', surface.fit.effects.cultivationSpeedMult, 'Affects live Qi speed through GameStore.'),
    effectRow('effect-heart-law-xp', 'Heart Law XP', surface.fit.effects.heartLawXpMult, 'Affects Dao Heart practice XP.'),
    effectRow('effect-root-resonance', 'Root Resonance', surface.fit.effects.rootResonanceGainMult, 'Affects root resonance gain from Dao Heart practices.'),
    row({
      id: 'effect-turbulence',
      label: 'Turbulence',
      value: `${surface.fit.effects.turbulenceDeltaPerMinute >= 0 ? '+' : ''}${surface.fit.effects.turbulenceDeltaPerMinute.toFixed(2)} / min`,
      detail: surface.fit.effects.turbulenceDeltaPerMinute > 0
        ? 'Opposed or strained practice adds turbulence pressure.'
        : 'Fit does not add turbulence pressure.',
      tone: surface.fit.effects.turbulenceDeltaPerMinute > 0 ? 'warning' : 'success',
    }),
    row({
      id: 'effect-awakening-cap',
      label: 'Awakening Cap',
      value: `${surface.fit.effects.expressionCap}%`,
      detail: 'Temporary expression cap feeds awakening and proc snapshot rows.',
      tone: surface.fit.effects.expressionCap < 75 ? 'warning' : 'info',
    }),
  ];
}

function variantRows(
  input: BuildSpiritRootObservationSurfaceInput,
  rootDef: SpiritRootProgressionDef,
  surface: Pick<SpiritRootObservationSurfaceV1, 'fit'>,
): SpiritRootObservationRow[] {
  const unlocked = new Set(input.unlockedVariantIds ?? []);
  const rows = (rootDef.variants ?? []).map((variant) => row({
    id: `variant-${variant.id}`,
    label: variant.displayName,
    value: unlocked.has(variant.id)
      ? `${variant.displayName} unlocked`
      : `${variant.displayName} needs ${variant.requiredRootResonance ?? surface.fit.recoveryRoute?.unlockResonance ?? 0}% resonance`,
    detail: variant.description ?? 'Variant route keeps mismatch recoverable.',
    tone: unlocked.has(variant.id) ? 'success' as const : surface.fit.recoveryRoute?.variantId === variant.id ? 'warning' as const : 'muted' as const,
  }));
  const recoveryRoute = surface.fit.recoveryRoute;
  if (recoveryRoute && !rows.some((entry) => entry.id === `variant-${recoveryRoute.variantId}`)) {
    rows.unshift(row({
      id: `variant-${recoveryRoute.variantId}`,
      label: 'Recovery Variant',
      value: recoveryRoute.unlocked ? `${recoveryRoute.label} unlocked` : `${recoveryRoute.label} at ${recoveryRoute.unlockResonance}% resonance`,
      detail: recoveryRoute.detail,
      tone: recoveryRoute.unlocked ? 'success' : 'warning',
    }));
  }

  if (rows.length > 0) return rows;
  return [
    row({
      id: 'variant-none',
      label: 'Variant Route',
      value: 'None active',
      detail: 'This root currently has no authored conversion variant.',
      tone: 'muted',
    }),
  ];
}

function practiceLabel(id: string): string {
  if (id === 'scripture_copying') return 'Scripture Copying';
  if (id === 'breath_harmonization') return 'Breath Harmonization';
  return id;
}

function practiceRows(surface: Pick<SpiritRootObservationSurfaceV1, 'fit'>): SpiritRootObservationRow[] {
  if (!surface.fit.recoveryRoute) {
    return [
      row({
        id: 'practice-stable',
        label: 'Practice Route',
        value: 'No recovery needed',
        detail: 'Current root fit does not need a conversion route.',
        tone: 'success',
      }),
    ];
  }

  return surface.fit.recoveryRoute.practiceIds.map((practiceId) => row({
    id: `practice-${practiceId}`,
    label: practiceLabel(practiceId),
    value: surface.fit.recoveryRoute?.label ?? null,
    detail: surface.fit.recoveryRoute?.detail ?? 'Practice supports variant conversion.',
    tone: surface.fit.recoveryRoute?.unlocked ? 'success' : 'warning',
  }));
}

function historyRows(input: BuildSpiritRootObservationSurfaceInput): SpiritRootObservationRow[] {
  const history = input.history ?? [];
  if (history.length === 0) {
    return [
      row({
        id: 'history-empty',
        label: 'Recent Changes',
        value: 'None recorded',
        detail: 'No recent Spirit Root fit change has been recorded this life.',
        tone: 'muted',
      }),
    ];
  }
  return history.map((entry) => row({
    id: `history-${entry.id}`,
    label: entry.label,
    value: new Date(entry.at).toISOString(),
    detail: entry.detail,
    tone: 'info',
  }));
}

function vfxRows(rows: readonly RootVfxRow[], tier: string): SpiritRootObservationRow[] {
  return rows.map((entry) => row({
    id: entry.id,
    label: entry.label,
    value: entry.intensity,
    detail: tier === 'opposed' || tier === 'strained'
      ? `${entry.detail} Current fit raises the visual pressure row.`
      : entry.detail,
    tone: entry.intensity === 'volatile' || tier === 'opposed' ? 'warning' : 'jade',
  }));
}

function makeTabs(rowsByTab: Record<SpiritRootObservationTabId, SpiritRootObservationRow[]>): SpiritRootObservationTab[] {
  return TAB_ORDER.map((id) => ({
    id,
    label: TAB_LABELS[id],
    rows: rowsByTab[id],
  }));
}

export function buildSpiritRootObservationSurface(
  input: BuildSpiritRootObservationSurfaceInput,
): SpiritRootObservationSurfaceV1 {
  const rootDef = rootDefFor(input);
  const progression = buildSpiritRootProgressionSnapshot({
    root: input.root,
    rootDef,
    selectedHeartLawId: input.selectedHeartLawId ?? input.heartLaw?.id ?? null,
    heartLawDef: input.heartLaw,
    heartLawLevel: input.heartLawLevel,
    rootResonance: input.currentRootResonance,
    shape: input.shape,
    unlockedVariantIds: input.unlockedVariantIds,
    trainingRatingsById: input.trainingRatingsById,
    daoHeartClarity: input.daoHeartClarity,
    verseMastery: input.verseMastery,
  });
  const shape = getSpiritRootShapeSnapshot(input.shape ?? 'single');
  const activeTab = input.activeTab ?? 'profile';
  const fit = progression.fit;
  const profile = {
    elementId: progression.elementId,
    displayName: rootDisplayName(input, rootDef),
    playstyleLabel: fit.style.playstyleLabel,
    temperamentTags: [...fit.style.temperamentTags],
    purityLabel: input.root ? `${Math.round(input.root.purity)}%` : '0%',
    awakeningLabel: progression.awakening.state,
    shapeLabel: shape.kind,
  };
  const partial = { profile, progression, fit };
  const effects = { rows: effectRows(partial) };
  const variants = { rows: variantRows(input, rootDef, partial) };
  const practiceRoutes = { rows: practiceRows(partial) };
  const history = { rows: historyRows(input) };
  const elementalVfxRows = vfxRows(fit.style.vfxRows, fit.tier);
  const rowsByTab = {
    profile: profileRows(partial),
    fit: fitRows(partial),
    effects: effects.rows,
    variants: variants.rows,
    practice_routes: practiceRoutes.rows,
    history: history.rows,
  } satisfies Record<SpiritRootObservationTabId, SpiritRootObservationRow[]>;

  return {
    version: 'spirit-root-observation-v1',
    owner: 'status',
    activeTab,
    route: {
      openTarget: {
        kind: 'status_observation',
        tab: activeTab,
      },
      returnAnchorId: 'status-ledger-root',
      forbiddenGlobalTabId: 'spiritRoot',
    },
    profile,
    fit,
    progression,
    effects,
    variants,
    practiceRoutes,
    history,
    vfxRows: elementalVfxRows,
    tabs: makeTabs(rowsByTab),
  };
}
