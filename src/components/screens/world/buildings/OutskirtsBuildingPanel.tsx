import { useMemo } from 'react';
import { useActivityStore } from '../../../../stores/activityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useOutskirtsStore } from '../../../../stores/outskirtsStore';
import { useUIStore } from '../../../../stores/uiStore';
import { resolveModuleRef } from '../worldUtils';
import cultivatorFight from "../../../../assets/onscreen/cultivator_backshots.png"

import "./CombatStyles.scss";

interface OutskirtsBuildingPanelProps {
  cityId: string;
}

export function OutskirtsBuildingPanel({ cityId }: OutskirtsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const enemiesById = useContentStore((state) => state.maps.enemiesById);

  const progressByOutskirtsId = useOutskirtsStore((state) => state.progressByOutskirtsId);
  const shouldSpawnBoss = useOutskirtsStore((state) => state.shouldSpawnBoss);

  const activeActivity = useActivityStore((state) => state.active);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const exitCombat = useCombatStore((state) => state.exitCombat);

  const openCombatPreview = useUIStore((state) => state.openCombatPreview);
  const stopCombatAndClose = useUIStore((state) => state.stopCombatAndClose);

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;
  const outskirtsProgress = outskirtsRefId
    ? progressByOutskirtsId[outskirtsRefId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : null;
  const isOutskirtsActive = activeActivity?.type === 'outskirts' && activeActivity.sourceId === outskirtsRefId;
  const bossName = outskirtsDef ? enemiesById[outskirtsDef.bossId]?.name ?? outskirtsDef.bossId : null;
  const isBossReady = outskirtsDef ? shouldSpawnBoss(outskirtsDef.id, outskirtsDef) : false;

  const handleStartOutskirts = () => {
    if (!city || !outskirtsDef) return;
    openCombatPreview({ type: 'outskirts', cityId, sourceId: outskirtsDef.id });
  };

  const handleStopOutskirts = () => {
    stopCombatAndClose();
    stopActivity();
    if (combatContext.type === 'outskirts') {
      exitCombat();
    }
  };

  if (!outskirtsDef) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Outskirts</div>
          <div className={'worldScreenPlaceholderKey'}>outskirts</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unavailable for this city.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={'worldScreenPlaceholder'}>
      <div className="combat-div">

        <div className="combat-side-panel"></div>
        <div className="combat-main">

          <div className="healthbars-ui">
            <div className="healthbar-wrapper">
              <div className="opponent-name">You</div>
              <div className="opponent-hp">{/*player hp in numbers here*/}</div>
              {/*player hp bar here*/}
            </div>

            <div className="healthbar-wrapper">
              <div className="opponent-name">{/*opponent name here*/}</div>
              <div className="opponent-hp">{/*player hp in numbers here*/}</div>
              {/*opponent hp bar here*/}
            </div>
          </div>

          <div className="images-div"> {/* do not touch anything in this div */}
            <div className="cultivator-image-wrapper">
              <img className="cultivator-image" src={cultivatorFight}></img>
            </div>
            <div className="enemy-image-wrapper">
              <div className="enemy-image"></div>
              <div className="enemy-stats"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
