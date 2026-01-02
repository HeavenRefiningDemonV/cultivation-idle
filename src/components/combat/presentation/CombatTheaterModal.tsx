import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { CombatTheater, type CombatTheaterMode } from '../theater/CombatTheater';
import type { CombatTheaterFocus } from '../theater/ProgressPanel';
import { useUIStore, type CombatPresentationContext } from '../../../stores/uiStore';
import { useContentStore } from '../../../stores/contentStore';
import { useOutskirtsStore } from '../../../stores/outskirtsStore';
import { useTrialStore } from '../../../stores/trialStore';
import { useRuinsStore } from '../../../stores/ruinsStore';
import { useCityStore } from '../../../stores/cityStore';
import { useInventoryStore } from '../../../stores/inventoryStore';
import { useCombatStore } from '../../../stores/combatStore';
import './CombatPresentation.scss';

interface PreviewDetails {
  title: string;
  subtitle?: string;
  lines: string[];
  rewards?: string[];
}

function usePreviewDetails(context: CombatPresentationContext): PreviewDetails {
  const contentMaps = useContentStore(
    useShallow((state) => ({
      outskirtsById: state.maps.outskirtsById,
      trialsById: state.maps.trialsById,
      ruinsById: state.maps.ruinsById,
      enemiesById: state.maps.enemiesById,
      itemsById: state.maps.itemsById,
    })),
  );

  const { progressByOutskirtsId, shouldSpawnBoss } = useOutskirtsStore(
    useShallow((state) => ({
      progressByOutskirtsId: state.progressByOutskirtsId,
      shouldSpawnBoss: state.shouldSpawnBoss,
    })),
  );

  const trialProgressById = useTrialStore((state) => state.progressByTrialId);
  const cityFlagsById = useCityStore((state) => state.cityFlagsById);
  const getItemCount = useInventoryStore((state) => state.getItemCount);

  const { progressByRuinId, activeRun } = useRuinsStore(
    useShallow((state) => ({
      progressByRuinId: state.progressByRuinId,
      activeRun: state.activeRun,
    })),
  );

  return useMemo(() => {
    if (context.type === 'outskirts') {
      const outskirtsDef = context.sourceId ? contentMaps.outskirtsById[context.sourceId] : undefined;
      const progress = outskirtsDef ? progressByOutskirtsId[outskirtsDef.id] : undefined;
      const bossReady = outskirtsDef ? shouldSpawnBoss(outskirtsDef.id, outskirtsDef) : false;
      const nextEnemyName = bossReady
        ? contentMaps.enemiesById[outskirtsDef?.bossId ?? '']?.name ?? outskirtsDef?.bossId ?? 'Boss'
        : 'Mob encounter';

      return {
        title: outskirtsDef?.name ?? 'Outskirts',
        subtitle: bossReady ? 'Boss ready to spawn' : 'Continuous farming loop',
        lines: [
          `Kills since boss: ${progress?.killsSinceBoss ?? 0}`,
          `Next fight: ${bossReady ? 'Boss' : 'Mob'} (${nextEnemyName})`,
          `Total kills: ${progress?.totalKills ?? 0}`,
        ],
      };
    }

    if (context.type === 'trial') {
      const trialDef = context.sourceId ? contentMaps.trialsById[context.sourceId] : undefined;
      const trialProgress = trialDef ? trialProgressById[trialDef.id] : undefined;
      const trialCityId = context.cityId ?? trialDef?.cityId ?? null;
      const cityFlags = trialCityId ? cityFlagsById[trialCityId] : undefined;
      const cleared = Boolean(trialProgress?.cleared || cityFlags?.gateTrialCleared);
      const gateItemName = trialDef?.gateItemId
        ? contentMaps.itemsById[trialDef.gateItemId]?.name ?? trialDef.gateItemId
        : 'None';
      const gateItemOwned = trialDef?.gateItemId ? getItemCount(trialDef.gateItemId) > 0 : true;

      return {
        title: trialDef?.name ?? 'Gate Trial',
        subtitle: cleared ? 'Cleared — repeat for practice' : 'One-on-one gate challenge',
        lines: [
          `Attempts: ${trialProgress?.attempts ?? 0}`,
          `Eligibility: ${cleared ? 'Cleared/locked' : 'Ready to challenge'}`,
          `Required item: ${gateItemName} (${gateItemOwned ? 'Owned' : 'Missing'})`,
        ],
        rewards: trialDef?.rewards ? [`Rewards preview: ${trialDef.rewards}`] : undefined,
      };
    }

    const ruinDef = context.sourceId ? contentMaps.ruinsById[context.sourceId] : undefined;
    const progress = ruinDef ? progressByRuinId[ruinDef.id] : undefined;
    const active = activeRun && ruinDef && activeRun.ruinId === ruinDef.id ? activeRun : null;

    return {
      title: ruinDef?.name ?? 'Ruins Run',
      subtitle: 'Battle through sequential rooms',
      lines: [
        `Rooms: ${ruinDef?.roomCount ?? '—'}`,
        `Runs cleared: ${progress?.totalRuns ?? 0}`,
        `Boss kills: ${progress?.bossKills ?? 0}`,
        active ? `Current room: ${active.roomIndex + 1}/${active.roomCount}` : 'Ready to start a new run',
      ],
    };
  }, [
    activeRun,
    cityFlagsById,
    contentMaps.enemiesById,
    contentMaps.itemsById,
    contentMaps.outskirtsById,
    contentMaps.ruinsById,
    contentMaps.trialsById,
    context.cityId,
    context.sourceId,
    context.type,
    getItemCount,
    progressByOutskirtsId,
    progressByRuinId,
    shouldSpawnBoss,
    trialProgressById,
  ]);
}

function CombatPreviewOverlay({
  details,
  onStart,
  onClose,
}: {
  details: PreviewDetails;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <div className="combat-preview">
      <div className="combat-preview__header">
        <div>
          <div className="combat-preview__title">{details.title}</div>
          {details.subtitle ? <div className="combat-preview__subtitle">{details.subtitle}</div> : null}
        </div>
        <button className="button-standard button-standard--ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <ul className="combat-preview__facts">
        {details.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {details.rewards && details.rewards.length > 0 ? (
        <div className="combat-preview__rewards">
          <div className="combat-preview__rewards-title">Rewards</div>
          <ul>
            {details.rewards.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="combat-preview__actions">
        <button className="button-standard" onClick={onStart}>
          Start
        </button>
      </div>
    </div>
  );
}

export function CombatTheaterModal({
  mode,
  context,
  focus,
}: {
  mode?: CombatTheaterMode;
  context: CombatPresentationContext;
  focus?: CombatTheaterFocus;
}) {
  const closePresentation = useUIStore((state) => state.closeCombatPresentation);
  const startCombat = useUIStore((state) => state.startCombatFromPreview);
  const inCombat = useCombatStore((state) => state.inCombat);

  const previewDetails = usePreviewDetails(context);
  const resolvedMode: CombatTheaterMode = mode ?? (inCombat ? 'active' : 'preview');
  const resolvedFocus: CombatTheaterFocus =
    focus ?? (context.sourceId ? { type: context.type, id: context.sourceId } : { type: null });

  return (
    <div className="combat-presentation-modal">
      <div className="combat-presentation-modal__backdrop" onClick={closePresentation} />
      <div className="combat-presentation-modal__panel">
        <CombatTheater
          mode={resolvedMode}
          onClose={closePresentation}
          focus={resolvedFocus}
          previewOverlay={
            resolvedMode === 'preview' ? (
              <CombatPreviewOverlay details={previewDetails} onStart={startCombat} onClose={closePresentation} />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
