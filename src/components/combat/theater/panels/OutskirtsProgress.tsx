import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveActivity } from '../../../../types/activity';
import { useActivityStore } from '../../../../stores/activityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useOutskirtsStore } from '../../../../stores/outskirtsStore';
import { ZONE_REALM_REQUIREMENTS } from '../../../../stores/zoneStore';
import type { CombatEvent, EnemyMechanic } from '../../../../types';
import './OutskirtsProgress.scss';

const HEADLINE_MECHANICS: Record<string, { title: string; description: string }> = {
  training_forest: {
    title: 'Calm Qi',
    description: 'Longer duels with steadier incoming damage.',
  },
  spirit_cavern: {
    title: 'Resonance',
    description: 'Periodic shockwaves ripple through the battlefield.',
  },
};

const SEGMENT_COUNT = 20;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function pickEnemyFromPool(pool: { enemyId: string; weight: number }[]): string | null {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  if (totalWeight <= 0) return pool[0]?.enemyId ?? null;

  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight ?? 0;
    if (roll <= 0) return entry.enemyId;
  }

  return pool[pool.length - 1]?.enemyId ?? null;
}

function summarizeMechanics(mechanics: EnemyMechanic[] | undefined): string[] {
  if (!Array.isArray(mechanics)) return [];
  return mechanics
    .map((m) => (typeof m?.description === 'string' ? m.description : m?.type || null))
    .filter((text): text is string => Boolean(text))
    .slice(0, 2);
}

export function OutskirtsProgress() {
  const activity = useActivityStore((state) => state.active);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const startCombat = useCombatStore((state) => state.startCombat);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const combatContext = useCombatStore((state) => state.combatContext);
  const currentEnemy = useCombatStore((state) => state.currentEnemy);
  const enemyMechanics = useCombatStore((state) => state.enemyMechanics);
  const combatEvents = useCombatStore((state) => state.events);
  const isBoss = useCombatStore((state) => state.isBoss);
  const inCombat = useCombatStore((state) => state.inCombat);

  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const progressByOutskirtsId = useOutskirtsStore((state) => state.progressByOutskirtsId);
  const autoContinue = useOutskirtsStore((state) => state.autoContinue);
  const stopAtBoss = useOutskirtsStore((state) => state.stopAtBoss);
  const setAutoContinue = useOutskirtsStore((state) => state.setAutoContinue);
  const setStopAtBoss = useOutskirtsStore((state) => state.setStopAtBoss);
  const getProgress = useOutskirtsStore((state) => state.getProgress);

  const activeOutskirtsId = useMemo(() => {
    const active = activity as ActiveActivity | null;
    if (active?.type === 'outskirts') {
      const payloadSourceId = (active.payload as { sourceId?: string } | undefined)?.sourceId;
      return active.sourceId ?? payloadSourceId ?? null;
    }
    if (combatContext?.type === 'outskirts') {
      return combatContext.sourceId ?? null;
    }
    return null;
  }, [activity, combatContext]);

  const fallbackOutskirtsId = useMemo(() => Object.keys(outskirtsById)[0] ?? null, [outskirtsById]);
  const outskirtsId = activeOutskirtsId ?? fallbackOutskirtsId;
  const outskirtsDef = outskirtsId ? outskirtsById[outskirtsId] : undefined;

  const progress = outskirtsId ? progressByOutskirtsId[outskirtsId] : undefined;

  const killsSinceBoss = progress?.killsSinceBoss ?? 0;
  const killsToBoss = outskirtsDef?.killsToBoss ?? 1;
  const progressRatio = clamp01(killsSinceBoss / Math.max(1, killsToBoss));
  const filledSegments = Math.floor(progressRatio * SEGMENT_COUNT);

  const [showSegmentBanner, setShowSegmentBanner] = useState(false);
  const previousSegmentsRef = useRef(filledSegments);

  useEffect(() => {
    if (filledSegments > previousSegmentsRef.current) {
      setShowSegmentBanner(true);
      const timer = setTimeout(() => setShowSegmentBanner(false), 1200);
      previousSegmentsRef.current = filledSegments;
      return () => clearTimeout(timer);
    }
    previousSegmentsRef.current = filledSegments;
    return undefined;
  }, [filledSegments]);

  const bossHighlights = useMemo(() => {
    const reversed = [...combatEvents].reverse();
    let lastSpawn: CombatEvent | null = null;
    let lastDefeat: CombatEvent | null = null;

    for (const event of reversed) {
      if (!lastDefeat && event.type === 'BOSS_DEFEATED') lastDefeat = event;
      if (!lastSpawn && event.type === 'BOSS_SPAWN') lastSpawn = event;
      if (lastSpawn && lastDefeat) break;
    }

    const windowStart = lastDefeat?.at ?? lastSpawn?.at ?? 0;
    const lootEvents = reversed
      .filter((event) => event.type === 'LOOT_DROP' && event.at >= windowStart)
      .slice(0, 5)
      .reverse();

    return { lastSpawn, lastDefeat, lootEvents };
  }, [combatEvents]);

  const [bossIntro, setBossIntro] = useState<{
    id: string;
    enemyName: string;
    mechanics: string[];
  } | null>(null);

  useEffect(() => {
    const latestSpawn = bossHighlights.lastSpawn;
    if (latestSpawn && latestSpawn.id !== bossIntro?.id) {
      const mechanics = summarizeMechanics(enemyMechanics ?? []);
      setBossIntro({
        id: latestSpawn.id,
        enemyName: latestSpawn.enemyName ?? latestSpawn.enemyId,
        mechanics,
      });
    }
  }, [bossHighlights.lastSpawn, bossIntro?.id, enemyMechanics]);

  useEffect(() => {
    if (!bossIntro) return undefined;
    const timer = setTimeout(() => setBossIntro(null), 2000);
    return () => clearTimeout(timer);
  }, [bossIntro]);

  const [chestOpen, setChestOpen] = useState(false);

  useEffect(() => {
    setChestOpen(false);
  }, [bossHighlights.lastDefeat?.id]);

  const bossActive = Boolean(isBoss || currentEnemy?.isBoss || bossHighlights.lastSpawn);

  const headline = outskirtsDef ? HEADLINE_MECHANICS[outskirtsDef.id] : undefined;
  const realmRequirement = outskirtsId ? ZONE_REALM_REQUIREMENTS[outskirtsId] : undefined;

  const lootLines = useMemo(() => {
    return bossHighlights.lootEvents.map((event) => {
      const itemName = itemsById[event.itemId]?.name ?? event.itemId;
      const rarity = itemsById[event.itemId]?.rarity ?? event.rarity;
      return `${event.qty}× ${itemName} (${rarity})${event.reason ? ` — ${event.reason}` : ''}`;
    });
  }, [bossHighlights.lootEvents, itemsById]);

  const handleStart = () => {
    if (!outskirtsDef) return;
    const progressSnapshot = getProgress(outskirtsDef.id);
    const nextIsBoss = progressSnapshot.killsSinceBoss >= outskirtsDef.killsToBoss;
    const nextEnemyId = nextIsBoss ? outskirtsDef.bossId : pickEnemyFromPool(outskirtsDef.mobPool);
    if (!nextEnemyId) return;

    startActivity('outskirts', { cityId: outskirtsDef.cityId, sourceId: outskirtsDef.id });
    setAutoAttack(true);

    startCombat(nextEnemyId, {
      type: 'outskirts',
      cityId: outskirtsDef.cityId,
      sourceId: outskirtsDef.id,
      cityIndex: outskirtsDef.cityIndex,
      isBoss: nextIsBoss,
    });
  };

  const handleStop = () => {
    stopActivity('outskirts-progress-stop');
    if (useCombatStore.getState().combatContext.type === 'outskirts') {
      exitCombat();
    }
  };

  if (!outskirtsDef) {
    return <div className="outskirts-progress">No outskirts configuration loaded.</div>;
  }

  return (
    <div className={`outskirts-progress ${bossActive ? 'outskirts-progress--boss' : ''}`}>
      <div className="outskirts-progress__header">
        <div>
          <div className="outskirts-progress__title">{outskirtsDef.name ?? outskirtsDef.id}</div>
          <div className="outskirts-progress__subtitle">
            {realmRequirement !== undefined ? `Recommended realm: ${realmRequirement + 1}` : 'Exploration run'}
          </div>
          {headline && (
            <div className="outskirts-progress__headline">
              <span className="outskirts-progress__headline-title">{headline.title}</span>
              <span className="outskirts-progress__headline-desc">{headline.description}</span>
            </div>
          )}
        </div>
        <div className="outskirts-progress__controls">
          <button className="button-standard" onClick={handleStart} disabled={!outskirtsDef}>
            Start
          </button>
          <button className="button-standard" onClick={handleStop}>
            Stop
          </button>
          <label className="outskirts-progress__toggle">
            <input
              type="checkbox"
              checked={autoContinue}
              onChange={(e) => setAutoContinue(e.target.checked)}
            />
            Auto-continue
          </label>
          <label className="outskirts-progress__toggle">
            <input
              type="checkbox"
              checked={stopAtBoss}
              onChange={(e) => setStopAtBoss(e.target.checked)}
            />
            Stop at boss
          </label>
        </div>
      </div>

      <div className="outskirts-progress__meter">
        <div className="outskirts-progress__meter-label">Boss cadence</div>
        <div className="outskirts-progress__segments">
          {Array.from({ length: SEGMENT_COUNT }).map((_, idx) => {
            const filled = idx < filledSegments;
            return (
              <div
                key={idx}
                className={`outskirts-progress__segment ${filled ? 'outskirts-progress__segment--filled' : ''}`}
              />
            );
          })}
        </div>
        <div className="outskirts-progress__meter-text">
          {killsSinceBoss} / {killsToBoss} kills to boss
        </div>
        {showSegmentBanner && <div className="outskirts-progress__surge">Beast Qi surges…</div>}
      </div>

      {bossIntro && (
        <div className="outskirts-progress__boss-intro">
          <div className="outskirts-progress__boss-intro-title">{bossIntro.enemyName}</div>
          {bossIntro.mechanics.length > 0 && (
            <ul className="outskirts-progress__boss-mechanics">
              {bossIntro.mechanics.map((line, idx) => (
                <li key={`${bossIntro.id}-${idx}`}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {bossHighlights.lastDefeat && (
        <div className="outskirts-progress__boss-chest">
          <div className="outskirts-progress__boss-chest-title">Boss Chest</div>
          {!chestOpen ? (
            <button className="button-standard" onClick={() => setChestOpen(true)}>
              Open
            </button>
          ) : (
            <div className="outskirts-progress__loot-list">
              {lootLines.length > 0 ? (
                lootLines.map((line, idx) => <div key={`${idx}-${line}`}>{line}</div>)
              ) : (
                <div className="outskirts-progress__loot-empty">Recent drops will appear here.</div>
              )}
            </div>
          )}
        </div>
      )}

      {inCombat && bossActive && currentEnemy && (
        <div className="outskirts-progress__boss-emphasis">{currentEnemy.name} is on the field!</div>
      )}
    </div>
  );
}
