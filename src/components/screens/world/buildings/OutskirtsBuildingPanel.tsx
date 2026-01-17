import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../../stores/activityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useOutskirtsStore } from '../../../../stores/outskirtsStore';
import { useUIStore } from '../../../../stores/uiStore';
import { resolveModuleRef } from '../worldUtils';
import cultivatorFight from "../../../../assets/onscreen/cultivator_backshots.png"
import barLong from "../../../../assets/menus/bar_long.png";
import { hpPercent } from '../../../../systems/combat/minibarModel';
import { formatNumber } from '../../../../utils/numbers';

import "./CombatStyles.scss";

interface OutskirtsBuildingPanelProps {
  cityId: string;
}

export function OutskirtsBuildingPanel({ cityId }: OutskirtsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const enemiesById = useContentStore((state) => state.maps.enemiesById);

  const progressByOutskirtsId = useOutskirtsStore((state) => state.progressByOutskirtsId);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const { currentEnemy, playerHP, playerMaxHP, enemyHP, enemyMaxHP } = useCombatStore(
    useShallow((state) => ({
      currentEnemy: state.currentEnemy,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
    })),
  );

  const openCombatPreview = useUIStore((state) => state.openCombatPreview);
  const stopCombatAndClose = useUIStore((state) => state.stopCombatAndClose);

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;
  const outskirtsProgress = outskirtsRefId
    ? progressByOutskirtsId[outskirtsRefId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : null;
  const bossName = outskirtsDef ? enemiesById[outskirtsDef.bossId]?.name ?? outskirtsDef.bossId : null;
  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);
  const playerHpLabel = `${formatNumber(playerHP)} / ${formatNumber(playerMaxHP)} (${playerHpPct.toFixed(1)}%)`;
  const enemyHpLabel = currentEnemy
    ? `${formatNumber(enemyHP)} / ${formatNumber(enemyMaxHP)} (${enemyHpPct.toFixed(1)}%)`
    : 'Waiting for next fight…';

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
              <div className="opponent-hp">{playerHpLabel}</div>
              <div className="combat-hp-bar">
                <img className="combat-hp-bar__shape" src={barLong} alt="" aria-hidden="true" />
                <div className="combat-hp-bar__track">
                  <div className="combat-hp-bar__fill" style={{ width: `${playerHpPct}%` }} />
                </div>
              </div>
            </div>

            <div className="healthbar-wrapper">
              <div className="opponent-name">{currentEnemy?.name ?? bossName ?? 'No active enemy'}</div>
              <div className="opponent-hp">{enemyHpLabel}</div>
              <div className="combat-hp-bar">
                <img className="combat-hp-bar__shape" src={barLong} alt="" aria-hidden="true" />
                <div className="combat-hp-bar__track">
                  <div className="combat-hp-bar__fill" style={{ width: `${enemyHpPct}%` }} />
                </div>
              </div>
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
