import { useMemo } from 'react';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useTechniqueStore } from '../../../stores/techniqueStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { buildGateTrialExactSurfaceFromStores } from './buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from './GateTrialExactScreen.js';
import './GateTrialExactScreen.scss';

export interface GateTrialScreenOwnerProps {
  cityId: string;
  trialId?: string | null;
  forceFixture?: boolean;
}

export function GateTrialScreenOwner(props: GateTrialScreenOwnerProps) {
  const mode = props.forceFixture === false ? 'live' : 'fixture';
  const contentVersion = useContentStore((state) => `${state.isLoaded}:${state.citiesSorted.length}:${Object.keys(state.maps.trialsById).length}`);
  const gameRealmIndex = useGameStore((state) => state.realm.index);
  const gameRealmSubstage = useGameStore((state) => state.realm.substage);
  const qi = useGameStore((state) => state.qi);
  const breakthroughRequirement = useGameStore((state) => state.getBreakthroughRequirement());
  const hp = useGameStore((state) => state.stats.hp);
  const maxHp = useGameStore((state) => state.stats.maxHp);
  const inventorySignature = useInventoryStore((state) => `${state.gold}:${state.spiritStones}:${state.merit}:${Object.keys(state.items).length}`);
  const trialProgressSignature = useTrialStore((state) => JSON.stringify(state.progressByTrialId[props.trialId ?? ''] ?? state.progressByTrialId));
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const selectedAiProfile = useTechniqueStore((state) => state.getSelectedAiProfile());
  const medicineSignature = useMedicinePouchStore((state) => JSON.stringify(state.slots));
  const equipmentSignature = useEquipmentStore((state) => JSON.stringify({
    weapon: state.equippedWeaponId,
    accessory: state.equippedAccessoryId,
    refine: state.refineLevelBySlot,
    temper: state.temperBonusesBySlot,
  }));
  const bountySignature = useBountyStore((state) => JSON.stringify({
    tracked: state.trackedByCityId[props.cityId] ?? null,
    active: state.activeByCityId[props.cityId]?.map((bounty) => [
      bounty.instanceId,
      bounty.progress,
      bounty.target,
      bounty.claimed,
    ]) ?? [],
  }));
  const expeditionSignature = useExpeditionStore((state) => `${state.slots}:${state.active.length}:${state.active.map((run) => `${run.slotIndex}:${run.status}:${run.endsAt}`).join('|')}`);
  const surface = useMemo(
    () => buildGateTrialExactSurfaceFromStores(props.cityId, {
      mode,
      trialId: props.trialId ?? null,
    }),
    [
      props.cityId,
      props.trialId,
      mode,
      contentVersion,
      gameRealmIndex,
      gameRealmSubstage,
      qi,
      breakthroughRequirement,
      hp,
      maxHp,
      inventorySignature,
      trialProgressSignature,
      selectedLoadoutId,
      selectedAiProfile,
      medicineSignature,
      equipmentSignature,
      bountySignature,
      expeditionSignature,
    ],
  );

  return (
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
    >
      <GateTrialExactScreen surface={surface} />
    </div>
  );
}
