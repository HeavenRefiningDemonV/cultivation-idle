import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../../stores/activityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useOutskirtsStore } from '../../../../stores/outskirtsStore';
import { useUIStore } from '../../../../stores/uiStore';
import { pickEnemyFromPool, resolveModuleRef } from '../worldUtils';
import cultivatorFight from "../../../../assets/onscreen/cultivator_backshots.png"
import { hpPercent } from '../../../../systems/combat/minibarModel';
import { formatNumber } from '../../../../utils/numbers';
import { AI_PROFILE_OPTIONS } from '../../../../systems/combat/aiProfiles';
import { InkCombatShell } from '../../../../ui/combat/InkCombatShell';
import { InkHealthBar } from '../../../../ui/combat/InkHealthBar';

import wildBoar from "../../../../assets/enemies/widboar.png";

import "./CombatStyles.scss";

const SEGMENT_COUNT = 14;
const FLOATING_TEXT_DURATION_MS = 900;

type FloatingHitKind = 'normal' | 'crit' | 'dodge';

type FloatingHit = {
  id: string;
  text: string;
  x: number;
  y: number;
  kind: FloatingHitKind;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function darkenHexColor(color: string, factor: number): string {
  if (!color.startsWith('#')) return color;
  const normalized = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;
  if (normalized.length !== 7) return color;
  const rgb = Number.parseInt(normalized.slice(1), 16);
  if (Number.isNaN(rgb)) return color;
  const clamped = clamp01(factor);
  const r = Math.round(((rgb >> 16) & 0xff) * clamped);
  const g = Math.round(((rgb >> 8) & 0xff) * clamped);
  const b = Math.round((rgb & 0xff) * clamped);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function extractDamageAmount(text: string): string | null {
  const match = text.match(/for ([\d,.]+)/i);
  return match ? match[1] : null;
}

interface OutskirtsBuildingPanelProps {
  cityId: string;
}

export function OutskirtsBuildingPanel({ cityId }: OutskirtsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const enemiesById = useContentStore((state) => state.maps.enemiesById);

  const progressByOutskirtsId = useOutskirtsStore((state) => state.progressByOutskirtsId);
  const activity = useActivityStore((state) => state.active);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const startCombat = useCombatStore((state) => state.startCombat);
  const { currentEnemy, playerHP, playerMaxHP, enemyHP, enemyMaxHP } = useCombatStore(
    useShallow((state) => ({
      currentEnemy: state.currentEnemy,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
    })),
  );

  const stopCombatAndClose = useUIStore((state) => state.stopCombatAndClose);
  const setSettings = useUIStore((state) => state.setSettings);
  const uiSettings = useUIStore(
    useShallow((state) => ({
      profile: state.settings.combatAIProfile,
      preferredTarget: state.settings.preferredTarget,
      autoRetryOnDeath: state.settings.autoRetryOnDeath,
      useConsumablesInCombat: state.settings.useConsumablesInCombat,
    })),
  );
  const combatLog = useCombatStore((state) => state.combatLog);
  const autoContinue = useOutskirtsStore((state) => state.autoContinue);
  const stopAtBoss = useOutskirtsStore((state) => state.stopAtBoss);
  const setAutoContinue = useOutskirtsStore((state) => state.setAutoContinue);
  const setStopAtBoss = useOutskirtsStore((state) => state.setStopAtBoss);
  const getProgress = useOutskirtsStore((state) => state.getProgress);

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
  const playerBarPercent = currentEnemy ? playerHpPct : 100;
  const enemyName = currentEnemy?.name ?? bossName ?? 'No active enemy';
  const visibleLogEntries = combatLog.slice(-6);
  const killsSinceBoss = outskirtsProgress?.killsSinceBoss ?? 0;
  const killsToBoss = outskirtsDef?.killsToBoss ?? 1;
  const progressRatio = clamp01(killsSinceBoss / Math.max(1, killsToBoss));
  const filledSegments = Math.floor(progressRatio * SEGMENT_COUNT);
  const lastLogTimestampRef = useRef(0);
  const combatMainRef = useRef<HTMLDivElement | null>(null);
  const [floatingHits, setFloatingHits] = useState<FloatingHit[]>([]);
  const floatingHitIdRef = useRef(0);
  const floatingHitTimeoutsRef = useRef<Map<string, number>>(new Map());

  const triggerMotion = (target: 'player' | 'enemy', kind: 'attack' | 'dodge') => {
    const container = combatMainRef.current;
    if (!container) return;
    const selector = target === 'player' ? '.cultivator-image-wrapper' : '.enemy-image-wrapper';
    const className = target === 'player'
      ? kind === 'attack'
        ? 'combat-motion--player-attack'
        : 'combat-motion--player-dodge'
      : kind === 'attack'
        ? 'combat-motion--enemy-attack'
        : 'combat-motion--enemy-dodge';
    const element = container.querySelector<HTMLElement>(selector);
    if (!element) return;

    element.classList.remove(
      'combat-motion',
      'combat-motion--player-attack',
      'combat-motion--player-dodge',
      'combat-motion--enemy-attack',
      'combat-motion--enemy-dodge',
    );
    void element.offsetWidth;
    element.classList.add('combat-motion', className);

    const handleAnimationEnd = () => {
      element.classList.remove('combat-motion', className);
      element.removeEventListener('animationend', handleAnimationEnd);
    };
    element.addEventListener('animationend', handleAnimationEnd);
  };

  useEffect(() => {
    if (combatLog.length === 0) {
      lastLogTimestampRef.current = 0;
      return;
    }

    const newEntries = combatLog.filter((entry) => entry.timestamp > lastLogTimestampRef.current);
    if (newEntries.length === 0) return;
    lastLogTimestampRef.current = newEntries[newEntries.length - 1].timestamp;

    for (const entry of newEntries) {
      const text = entry.text;
      const isPlayerAttack = text.includes('You attacked');
      const isPlayerAttackMiss = isPlayerAttack && text.includes('missed');
      const isEnemyAttackMiss = entry.type === 'enemy' && text.includes('attacked but it missed');
      const isEnemyAttack =
        text.includes('attacked you') ||
        text.includes('landed a critical hit') ||
        text.includes('attacked, but your shield absorbed it');
      const isPlayerCrit = entry.type === 'damage' || text.includes('Critical hit!');
      const damageAmount = isPlayerAttack && !isPlayerAttackMiss ? extractDamageAmount(text) : null;

      if (isPlayerAttackMiss) {
        const id = `hit-${floatingHitIdRef.current++}`;
        const newHit: FloatingHit = {
          id,
          text: 'Dodge!',
          x: randomBetween(30, 70),
          y: randomBetween(20, 70),
          kind: 'dodge',
        };
        setFloatingHits((prev) => [...prev, newHit]);
        const timeoutId = window.setTimeout(() => {
          setFloatingHits((prev) => prev.filter((hit) => hit.id !== id));
          floatingHitTimeoutsRef.current.delete(id);
        }, FLOATING_TEXT_DURATION_MS);
        floatingHitTimeoutsRef.current.set(id, timeoutId);
      } else if (damageAmount) {
        const id = `hit-${floatingHitIdRef.current++}`;
        const newHit: FloatingHit = {
          id,
          text: damageAmount,
          x: randomBetween(25, 75),
          y: randomBetween(15, 65),
          kind: isPlayerCrit ? 'crit' : 'normal',
        };
        setFloatingHits((prev) => [...prev, newHit]);
        const timeoutId = window.setTimeout(() => {
          setFloatingHits((prev) => prev.filter((hit) => hit.id !== id));
          floatingHitTimeoutsRef.current.delete(id);
        }, FLOATING_TEXT_DURATION_MS);
        floatingHitTimeoutsRef.current.set(id, timeoutId);
      }

      if (isEnemyAttackMiss) {
        triggerMotion('player', 'dodge');
        continue;
      }

      if (isPlayerAttackMiss) {
        triggerMotion('enemy', 'dodge');
        continue;
      }

      if (isPlayerAttack) {
        triggerMotion('player', 'attack');
        continue;
      }

      if (isEnemyAttack) {
        triggerMotion('enemy', 'attack');
      }
    }
  }, [combatLog]);

  useEffect(() => {
    return () => {
      floatingHitTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      floatingHitTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const container = combatMainRef.current;
    if (!container) return;
    const enemyWrapper = container.querySelector<HTMLElement>('.enemy-image-wrapper');
    if (!enemyWrapper) return;
    if (currentEnemy) {
      enemyWrapper.classList.remove('enemy-image-wrapper--inactive');
    } else {
      enemyWrapper.classList.add('enemy-image-wrapper--inactive');
    }
  }, [currentEnemy]);

  const handleStartOutskirts = () => {
    if (!city || !outskirtsDef) return;
    const progressSnapshot = getProgress(outskirtsDef.id);
    const nextIsBoss = progressSnapshot.killsSinceBoss >= outskirtsDef.killsToBoss;
    const nextEnemyId = nextIsBoss ? outskirtsDef.bossId : pickEnemyFromPool(outskirtsDef.mobPool);
    if (!nextEnemyId) return;
    startActivity('outskirts', { cityId, sourceId: outskirtsDef.id });
    setAutoAttack(true);
    startCombat(nextEnemyId, {
      type: 'outskirts',
      cityId,
      sourceId: outskirtsDef.id,
      cityIndex: outskirtsDef.cityIndex,
      isBoss: nextIsBoss,
    });
  };

  const handleStopOutskirts = () => {
    stopCombatAndClose();
    stopActivity();
    if (combatContext.type === 'outskirts') {
      exitCombat();
    }
  };

  const isOutskirtsActive =
    combatContext.type === 'outskirts' ||
    (activity?.type === 'outskirts' &&
      (activity?.sourceId === outskirtsDef?.id ||
        (activity?.payload as { sourceId?: string } | undefined)?.sourceId === outskirtsDef?.id));

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
      <InkCombatShell
        title="Outskirts Combat"
        subtitle={isOutskirtsActive ? 'Live battle in progress.' : 'Ready to start a new run.'}
        sidebar={
          <>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__actions">
                <button className="button-standard" onClick={handleStartOutskirts} disabled={isOutskirtsActive}>
                  Start
                </button>
                <button
                  className="button-standard button-standard--ghost"
                  onClick={handleStopOutskirts}
                  disabled={!isOutskirtsActive}
                >
                  Stop
                </button>
              </div>
            </div>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Boss Cadence</div>
              <div className="ink-combat-shell__meter">
                <div className="ink-combat-shell__segments">
                  {Array.from({ length: SEGMENT_COUNT }).map((_, idx) => {
                    const filled = idx < filledSegments;
                    return (
                      <div
                        key={idx}
                        className={`ink-combat-shell__segment${filled ? ' ink-combat-shell__segment--filled' : ''}`}
                      />
                    );
                  })}
                </div>
                <div className="ink-combat-shell__meter-text">
                  {killsSinceBoss} / {killsToBoss}
                </div>
              </div>
            </div>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Combat Options</div>
              <div className="ink-combat-shell__controls">
                <label className="ink-combat-shell__control">
                  <span className="ink-combat-shell__control-label">AI Profile</span>
                  <select
                    value={uiSettings.profile}
                    onChange={(e) => setSettings({ combatAIProfile: e.target.value as typeof uiSettings.profile })}
                  >
                    {AI_PROFILE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ink-combat-shell__control">
                  <span className="ink-combat-shell__control-label">Preferred target</span>
                  <select
                    value={uiSettings.preferredTarget}
                    onChange={(e) =>
                      setSettings({ preferredTarget: e.target.value as typeof uiSettings.preferredTarget })
                    }
                  >
                    <option value="trash">Trash</option>
                    <option value="elite">Elite</option>
                    <option value="boss">Boss</option>
                  </select>
                </label>

                <label className="ink-combat-shell__control ink-combat-shell__control--checkbox">
                  <input
                    type="checkbox"
                    checked={uiSettings.useConsumablesInCombat}
                    onChange={(e) => setSettings({ useConsumablesInCombat: e.target.checked })}
                  />
                  <span className="ink-combat-shell__control-label">Auto use items</span>
                </label>

                <label className="ink-combat-shell__control ink-combat-shell__control--checkbox">
                  <input
                    type="checkbox"
                    checked={uiSettings.autoRetryOnDeath}
                    onChange={(e) => setSettings({ autoRetryOnDeath: e.target.checked })}
                  />
                  <span className="ink-combat-shell__control-label">Auto retry</span>
                </label>
              </div>
            </div>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Run Options</div>
              <div className="ink-combat-shell__controls">
                <label className="ink-combat-shell__control ink-combat-shell__control--checkbox">
                  <input
                    type="checkbox"
                    checked={autoContinue}
                    onChange={(e) => setAutoContinue(e.target.checked)}
                  />
                  <span className="ink-combat-shell__control-label">Auto-continue</span>
                </label>
                <label className="ink-combat-shell__control ink-combat-shell__control--checkbox">
                  <input
                    type="checkbox"
                    checked={stopAtBoss}
                    onChange={(e) => setStopAtBoss(e.target.checked)}
                  />
                  <span className="ink-combat-shell__control-label">Stop at boss</span>
                </label>
              </div>
            </div>
            <div className="ink-combat-shell__section ink-combat-shell__section--fill">
              <div className="ink-combat-shell__section-title">Combat Log</div>
              <div className="ink-combat-shell__log">
                {visibleLogEntries.length === 0 ? (
                  <div className="ink-combat-shell__log-empty">Combat log is empty</div>
                ) : (
                  visibleLogEntries.map((entry, index) => (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="ink-combat-shell__log-entry"
                      style={{ color: darkenHexColor(entry.color, 0.7) }}
                    >
                      {entry.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        }
        main={
          <div className="outskirts-combat__stage" ref={combatMainRef}>
            <div className="outskirts-combat__healthbars">
              <InkHealthBar name="You" current={playerHP} max={playerMaxHP} label={playerHpLabel} fillPercent={playerBarPercent} />
              <InkHealthBar
                name={enemyName}
                current={enemyHP}
                max={enemyMaxHP}
                label={enemyHpLabel}
                fillPercent={enemyHpPct}
                inactive={!currentEnemy}
              />
            </div>

            <div className="images-div"> {/* do not touch anything in this div */}
              <div className="cultivator-image-wrapper">
                <img className="cultivator-image" src={cultivatorFight}></img>
              </div>
              <div className="enemy-image-wrapper">
                <img className="enemy-image" src={wildBoar}></img>
                <div className="enemy-stats"></div>
                <div className="enemy-hit-overlay" aria-hidden="true">
                  {floatingHits.map((hit) => (
                    <span
                      key={hit.id}
                      className={`enemy-hit-text enemy-hit-text--${hit.kind}`}
                      style={{ left: `${hit.x}%`, top: `${hit.y}%` }}
                    >
                      {hit.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
