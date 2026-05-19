import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import type { CombatPresentationContext } from '../../../stores/uiStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { hpPercent } from '../../../systems/combat/minibarModel.js';
import './CombatPresentation.scss';

export function CombatDock({ context }: { context: CombatPresentationContext }) {
  const restore = useUIStore((state) => state.restoreCombatFromDock);
  const stop = useUIStore((state) => state.stopCombatAndClose);

  const { currentEnemy, playerHP, playerMaxHP, enemyHP, enemyMaxHP, inCombat } = useCombatStore(
    useShallow((state) => ({
      currentEnemy: state.currentEnemy,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
      inCombat: state.inCombat,
    })),
  );

  const activity = useActivityStore((state) => state.active);

  const { outskirtsById, trialsById, ruinsById } = useContentStore(
    useShallow((state) => ({
      outskirtsById: state.maps.outskirtsById,
      trialsById: state.maps.trialsById,
      ruinsById: state.maps.ruinsById,
    })),
  );

  const areaTitle = useMemo(() => {
    if (context.type === 'outskirts') return outskirtsById[context.sourceId ?? '']?.name ?? 'Outskirts';
    if (context.type === 'trial') return trialsById[context.sourceId ?? '']?.name ?? 'Gate Trial';
    return ruinsById[context.sourceId ?? '']?.name ?? 'Ruins Run';
  }, [context.sourceId, context.type, outskirtsById, ruinsById, trialsById]);

  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);
  const statusLabel = inCombat ? 'Active combat' : 'Awaiting combat loop';

  const activityLabel = activity?.type ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1) : 'Idle';

  return (
    <div className="combat-dock">
      <div className="combat-dock__header">
        <div>
          <div className="combat-dock__title">{areaTitle}</div>
          <div className="combat-dock__subtitle">{activityLabel} • {statusLabel}</div>
        </div>
        <div className="combat-dock__actions">
          <button className="button-standard" onClick={restore}>
            Open
          </button>
          <button className="button-standard button-standard--danger" onClick={stop}>
            Stop
          </button>
        </div>
      </div>

      <div className="combat-dock__bars">
        <div className="combat-dock__bar">
          <div className="combat-dock__bar-label">HP</div>
          <div className="combat-dock__bar-track">
            <div className="combat-dock__bar-fill" style={{ width: `${playerHpPct}%` }} />
          </div>
        </div>
        <div className="combat-dock__bar">
          <div className="combat-dock__bar-label">Enemy</div>
          <div className="combat-dock__bar-track">
            <div className="combat-dock__bar-fill combat-dock__bar-fill--enemy" style={{ width: `${enemyHpPct}%` }} />
          </div>
          <div className="combat-dock__enemy">{currentEnemy?.name ?? '—'}</div>
        </div>
      </div>
    </div>
  );
}
