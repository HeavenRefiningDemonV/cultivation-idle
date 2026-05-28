import { useMemo } from 'react';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useTechCollectionStore } from '../../../stores/techCollectionStore.js';
import { useTechniqueStore } from '../../../stores/techniqueStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { buildGateTrialExactSurfaceFromStores } from './buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from './GateTrialExactScreen.js';
import { useGateTrialExactActionController } from './useGateTrialExactActionController.js';
import { routeCombatAftermathTarget } from '../../combatAftermath/index.js';
import { PERF_LABELS, time } from '../../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../../services/performance/perfReact.js';
import './GateTrialExactScreen.scss';
import '../../combatAftermath/CombatAftermathCard.scss';

export interface GateTrialScreenOwnerProps {
  cityId: string;
  trialId?: string | null;
  forceFixture?: boolean;
}

export function GateTrialScreenOwner(props: GateTrialScreenOwnerProps) {
  useRenderCounter(PERF_LABELS.renderGateTrialScreenOwner);
  const mode = props.forceFixture === false ? 'live' : 'fixture';
  const contentVersion = useContentStore((state) => state.contentVersion);
  const realmVersion = useGameStore((state) => state.realmVersion);
  const qiDisplayVersion = useGameStore((state) => state.qiDisplayVersion);
  const statsVersion = useGameStore((state) => state.statsVersion);
  const breakthroughRequirement = useGameStore((state) => state.getBreakthroughRequirement());
  const inventoryVersion = useInventoryStore((state) => state.inventoryVersion);
  const currencyVersion = useInventoryStore((state) => state.currencyVersion);
  const trialProgressVersion = useTrialStore((state) =>
    props.trialId ? state.progressVersionByTrialId[props.trialId] ?? 0 : state.progressVersion,
  );
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const loadoutVersion = useTechniqueStore((state) => state.loadoutVersion);
  const aiProfileVersion = useTechniqueStore((state) => state.aiProfileVersion);
  const slotVersion = useTechniqueStore((state) => state.slotVersion);
  const collectionVersion = useTechCollectionStore((state) => state.collectionVersion);
  const masteryVersion = useTechCollectionStore((state) => state.masteryVersion);
  const pouchVersion = useMedicinePouchStore((state) => state.pouchVersion);
  const equipmentVersion = useEquipmentStore((state) => state.equipmentVersion);
  const bountyVersion = useBountyStore((state) => state.bountyVersionByCityId[props.cityId] ?? 0);
  const expeditionVersion = useExpeditionStore((state) => state.expeditionVersion);
  const activeActivitySignature = useActivityStore((state) => {
    const active = state.active;
    if (!active) return 'none';
    return `${active.type}:${active.payload?.cityId ?? active.cityId ?? ''}:${active.payload?.sourceId ?? active.sourceId ?? ''}:${active.startedAt ?? ''}`;
  });
  const combatSessionVersion = useCombatStore((state) => state.combatSessionVersion);
  const combatViewVersion = useCombatStore((state) => state.combatViewVersion);
  const combatResultVersion = useCombatStore((state) => state.combatResultVersion);
  const surface = useMemo(
    () => time(PERF_LABELS.surfaceGateTrial, () => buildGateTrialExactSurfaceFromStores(props.cityId, {
      mode,
      trialId: props.trialId ?? null,
    })),
    [
      props.cityId,
      props.trialId,
      mode,
      contentVersion,
      realmVersion,
      qiDisplayVersion,
      breakthroughRequirement,
      statsVersion,
      inventoryVersion,
      currencyVersion,
      trialProgressVersion,
      selectedLoadoutId,
      loadoutVersion,
      aiProfileVersion,
      slotVersion,
      collectionVersion,
      masteryVersion,
      pouchVersion,
      equipmentVersion,
      bountyVersion,
      expeditionVersion,
      activeActivitySignature,
      combatSessionVersion,
      combatViewVersion,
      combatResultVersion,
    ],
  );
  const actions = useGateTrialExactActionController({
    cityId: props.cityId,
    trialId: surface.meta.trialId ?? props.trialId ?? null,
    surface,
  });
  const screenActions = surface.meta.mode === 'live' ? actions : {};

  return (
    <PerfProfiler id={PERF_LABELS.renderGateTrialScreenOwner}>
    <div
      className="gateTrialScreenOwner"
      data-testid="gate-trial-screen-owner"
      data-city-id={props.cityId}
      data-trial-id={props.trialId ?? surface.meta.trialId ?? ''}
      data-mode={surface.meta.mode}
      data-source={surface.meta.source}
      data-force-fixture={props.forceFixture === false ? 'false' : 'true'}
      data-activity-mode={surface.meta.activityMode}
      data-lifecycle-state={surface.meta.lifecycleState}
      data-readiness-score={surface.meta.readinessScore}
      data-actions-enabled={surface.meta.mode === 'live' ? 'true' : 'false'}
      data-active-theater={surface.scenicStage.activeTheater?.visible ? 'true' : 'false'}
    >
      <GateTrialExactScreen surface={surface} {...screenActions} onAftermathRoute={routeCombatAftermathTarget} />
    </div>
    </PerfProfiler>
  );
}
