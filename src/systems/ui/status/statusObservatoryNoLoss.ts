import type { StatusLedgerSurfaceV1 } from './statusLedgerTypes.js';
import type {
  StatusObservatoryNoLossFamily,
  StatusObservatoryNoLossFamilySurface,
  StatusObservatoryNoLossSurface,
} from './statusObservatoryTypes.js';

export const STATUS_OBSERVATORY_NO_LOSS_DEFS = [
  ['hero', 'ledger.hero', 'lifeDecree', 'lifeDecree.hero'],
  ['metrics', 'ledger.metrics', 'vitalsRibbon', 'vitalsRibbon.metrics'],
  ['currentState', 'ledger.currentState', 'meridianVessel', 'meridianVessel.organs + focusLens + shared causes'],
  ['spiritRootObservation', 'ledger.spiritRootObservation', 'rootLawInstrument', 'drawers.spiritRootObservation'],
  ['milestone', 'ledger.milestone', 'lifeDecree + bottleneckCanopy', 'lifeDecree.milestone'],
  ['cultivationBase', 'ledger.cultivationBase', 'meridianVessel cultivation organ', 'drawers.calculation'],
  ['missionRequirements', 'ledger.missionRequirements', 'bottleneckCanopy.talismanSlips', 'drawers.missionRequirements'],
  ['bestImprovements', 'ledger.bestImprovements', 'bottleneckCanopy.routeCharms', 'bottleneckCanopy.bestImprovements'],
  ['safetyNet', 'ledger.safetyNet', 'bottleneckCanopy.safetySeal', 'bottleneckCanopy.safetyNet'],
  ['identityDoctrine', 'ledger.identityDoctrine', 'rootLawInstrument', 'rootLawInstrument.identityDoctrine'],
  ['currentWork', 'ledger.currentWork', 'workWheel', 'workWheel.spokes'],
  ['buildPreparation', 'ledger.buildPreparation', 'buildPreparation.scales + reserveJars', 'buildPreparation.rows'],
  ['recentChanges', 'ledger.recentChanges', 'ledgerRail', 'drawers.recentChanges'],
  ['details', 'ledger.details', 'ledgerRail', 'drawers.calculation'],
  ['namedStats', 'ledger.namedStats', 'statConstellation.nodes', 'drawers.selectedStatLens'],
] as const satisfies readonly (readonly [StatusObservatoryNoLossFamily, string, string, string])[];

function actionCountForFamily(ledger: StatusLedgerSurfaceV1, family: StatusObservatoryNoLossFamily): number {
  switch (family) {
    case 'hero':
      return ledger.hero.primaryAction ? 1 : 0;
    case 'spiritRootObservation':
      return ledger.hero.spiritRoot.observationAction ? 1 : 0;
    case 'missionRequirements':
      return ledger.missionRequirements.rows.filter((row) => row.action).length;
    case 'bestImprovements':
      return ledger.bestImprovements.rows.length + (ledger.bestImprovements.primary ? 1 : 0);
    case 'safetyNet':
      return ledger.safetyNet.action ? 1 : 0;
    case 'currentState':
      return 1 + ledger.currentState.nextBottleneck.secondary.length;
    case 'namedStats':
      return ledger.namedStats.allStats.filter((stat) => stat.routeAction).length;
    default:
      return 0;
  }
}

function rowCountForFamily(ledger: StatusLedgerSurfaceV1, family: StatusObservatoryNoLossFamily): number {
  switch (family) {
    case 'hero':
      return 1;
    case 'metrics':
      return ledger.metrics.length;
    case 'currentState':
      return Object.keys(ledger.currentState.blocks).length
        + ledger.currentState.sharedCauseRows.length
        + ledger.currentState.buffDebuffRows.length
        + ledger.currentState.nextBottleneck.detailRows.length;
    case 'spiritRootObservation':
      return ledger.spiritRootObservation.tabs.reduce((sum, tab) => sum + tab.rows.length, 0);
    case 'milestone':
      return ledger.milestone.rows.length + ledger.milestone.nodes.length;
    case 'cultivationBase':
      return ledger.cultivationBase.rows.length;
    case 'missionRequirements':
      return ledger.missionRequirements.rows.length;
    case 'bestImprovements':
      return ledger.bestImprovements.rows.length;
    case 'safetyNet':
      return ledger.safetyNet.rows.length;
    case 'identityDoctrine':
      return ledger.identityDoctrine.rows.length;
    case 'currentWork':
      return ledger.currentWork.rows.length + ledger.currentWork.activityTiles.length;
    case 'buildPreparation':
      return ledger.buildPreparation.buildRows.length + ledger.buildPreparation.reserveRows.length;
    case 'recentChanges':
      return ledger.recentChanges.rows.length;
    case 'details':
      return ledger.details.rows.length;
    case 'namedStats':
      return ledger.namedStats.allStats.length;
  }
}

function isRepresented(ledger: StatusLedgerSurfaceV1, family: StatusObservatoryNoLossFamily): boolean {
  switch (family) {
    case 'metrics':
      return Array.isArray(ledger.metrics);
    case 'missionRequirements':
      return Array.isArray(ledger.missionRequirements.rows) || Boolean(ledger.missionRequirements.emptyState);
    case 'bestImprovements':
      return Array.isArray(ledger.bestImprovements.rows) || Boolean(ledger.bestImprovements.emptyState);
    case 'recentChanges':
      return Array.isArray(ledger.recentChanges.rows) || Boolean(ledger.recentChanges.emptyState);
    case 'namedStats':
      return Array.isArray(ledger.namedStats.allStats);
    default:
      return Boolean(ledger[family as keyof StatusLedgerSurfaceV1]);
  }
}

export function buildStatusObservatoryNoLoss(ledger: StatusLedgerSurfaceV1): StatusObservatoryNoLossSurface {
  const families = STATUS_OBSERVATORY_NO_LOSS_DEFS.map(
    ([family, sourcePath, defaultHome, exactHome]): StatusObservatoryNoLossFamilySurface => ({
      family,
      sourcePath,
      defaultHome,
      exactHome,
      represented: isRepresented(ledger, family),
      rowCount: rowCountForFamily(ledger, family),
      actionCount: actionCountForFamily(ledger, family),
    }),
  );
  const missingFamilies = families
    .filter((family) => !family.represented)
    .map((family) => family.family);

  return {
    allRepresented: missingFamilies.length === 0,
    missingFamilies,
    families,
  };
}
