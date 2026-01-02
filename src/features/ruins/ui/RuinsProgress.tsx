import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../stores/activityStore';
import { useCombatStore } from '../../../stores/combatStore';
import { useContentStore } from '../../../stores/contentStore';
import { useRuinsStore } from '../../../stores/ruinsStore';
import type { RuinsRunSummary } from '../../../types';
import { pityProgressPercent } from '../../../services/economy/pity';
import { formatNumber } from '../../../utils/numbers';
import './RuinsProgress.scss';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 90) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}m ${secs}s`;
}

function buildRoomTrack(
  roomCount: number,
  pools: { mobs: string[]; miniBoss?: string[]; finalBoss?: string[] },
  enemiesById: Record<string, { name?: string }>,
): Array<{ label: string; preview: string; type: 'mob' | 'mini' | 'boss'; index: number }> {
  const rooms: Array<{ label: string; preview: string; type: 'mob' | 'mini' | 'boss'; index: number }> = [];
  for (let i = 0; i < roomCount; i += 1) {
    const isFinal = i === roomCount - 1;
    const isMiniBoss = !isFinal && pools.miniBoss && pools.miniBoss.length > 0 && i === roomCount - 2;
    const pool = isFinal ? pools.finalBoss ?? pools.mobs : isMiniBoss ? pools.miniBoss ?? pools.mobs : pools.mobs;
    const previewId = pool?.[0];
    const previewName = previewId ? enemiesById[previewId]?.name ?? previewId : 'Unknown foe';
    rooms.push({
      label: isFinal ? 'Boss' : `Room ${i + 1}`,
      preview: previewName,
      type: isFinal ? 'boss' : isMiniBoss ? 'mini' : 'mob',
      index: i,
    });
  }
  return rooms;
}

function summarizeMaterials(
  drops: RuinsRunSummary['drops'],
  itemsById: Record<string, { name?: string; rarity?: string }>,
) {
  return drops.map((drop, idx) => {
    const name = itemsById[drop.itemId]?.name ?? drop.itemId;
    const rarity = itemsById[drop.itemId]?.rarity ?? drop.rarity ?? 'common';
    return (
      <li key={`${drop.itemId}-${idx}`} className={`ruins-progress__drop ruins-progress__drop--${rarity}`}>
        +{drop.qty} {name}
        {drop.reason ? <span className="ruins-progress__drop-reason"> — {drop.reason}</span> : null}
      </li>
    );
  });
}

export function RuinsProgress({ ruinsId }: { ruinsId?: string }) {
  const activity = useActivityStore((state) => state.active);
  const combatContext = useCombatStore((state) => state.combatContext);

  const { ruinsById, enemiesById, itemsById, economy } = useContentStore(
    useShallow((state) => ({
      ruinsById: state.maps.ruinsById,
      enemiesById: state.maps.enemiesById,
      itemsById: state.maps.itemsById,
      economy: state.economy,
    })),
  );

  const {
    activeRun,
    progressByRuinId,
    autoRestart,
    autoRepeatDefault,
    runHistory,
    lastRunSummary,
    stopRun,
    setAutoRepeat,
    startRun,
  } = useRuinsStore(
    useShallow((state) => ({
      activeRun: state.activeRun,
      progressByRuinId: state.progressByRuinId,
      autoRestart: state.autoRestart,
      autoRepeatDefault: state.autoRepeatDefault,
      runHistory: state.runHistory,
      lastRunSummary: state.lastRunSummary,
      stopRun: state.stopRun,
      setAutoRepeat: state.setAutoRepeat,
      startRun: state.startRun,
    })),
  );

  const ruinId = useMemo(() => {
    if (ruinsId) return ruinsId;
    const activityId = activity?.type === 'ruins' ? activity.sourceId ?? activity.payload?.sourceId : null;
    const combatId = combatContext?.type === 'ruins' ? combatContext.sourceId ?? combatContext.ruinsId : null;
    const fallback = activeRun?.ruinId ?? Object.keys(ruinsById)[0] ?? null;
    return activityId ?? combatId ?? fallback;
  }, [activity, combatContext, activeRun?.ruinId, ruinsById, ruinsId]);

  const ruinDef = ruinId ? ruinsById[ruinId] : undefined;
  const roomCount = ruinDef?.roomCount ?? activeRun?.roomCount ?? 0;
  const roomTrack = useMemo(
    () => buildRoomTrack(roomCount, ruinDef?.roomPools ?? { mobs: [] }, enemiesById),
    [roomCount, ruinDef?.roomPools, enemiesById],
  );

  const currentIndex = activeRun?.roomIndex ?? 0;
  const autoRestartEnabled = autoRestart ?? autoRepeatDefault;
  const runSummary = ruinId && lastRunSummary?.ruinId === ruinId ? lastRunSummary : null;
  const history = useMemo(
    () => runHistory.filter((entry) => (ruinId ? entry.ruinId === ruinId : true)).slice(0, 5),
    [runHistory, ruinId],
  );
  const progress = ruinId ? progressByRuinId[ruinId] : undefined;
  const rareSummary = runSummary?.bossChestRare;

  const pityRule = economy?.tuning?.pityDefaults?.ruinsBossChestRare;
  const pityCap = pityRule?.pityCap ?? 0;
  const baseChance = pityRule?.baseChance ?? 0;
  const bossChestFailures = progress?.bossChestRareFailures ?? 0;
  const showRareProgress = baseChance > 0 && pityCap > 1;
  const pityPercent = showRareProgress ? pityProgressPercent(bossChestFailures, pityCap) * 100 : 0;
  const pityTarget = Math.max(pityCap - 1, 0);

  const handleStart = () => {
    if (!ruinId) return;
    startRun(ruinId);
  };

  const handleStop = () => {
    stopRun();
  };

  return (
    <div className="ruins-progress">
      <div className="ruins-progress__header">
        <div>
          <div className="ruins-progress__title">{ruinDef?.name ?? 'Ruins Run'}</div>
          <div className="ruins-progress__subtitle">
            Rooms: {roomCount} • Runs cleared: {progress?.totalRuns ?? 0}
          </div>
        </div>
        <div className="ruins-progress__controls">
          <button className="button-standard" onClick={handleStart} disabled={!ruinId || Boolean(activeRun)}>
            Start
          </button>
          <button className="button-standard" onClick={handleStop} disabled={!activeRun}>
            Stop
          </button>
          <label className="ruins-progress__toggle">
            <input
              type="checkbox"
              checked={autoRestartEnabled}
              onChange={(e) => setAutoRepeat(e.target.checked)}
            />
            Continue farming ruins
          </label>
        </div>
      </div>

      {showRareProgress ? (
        <div className="ruins-progress__pity">
          <div className="ruins-progress__pity-row">
            <div className="ruins-progress__pity-title">Boss Chest Rare Progress</div>
            <div className="ruins-progress__pity-subtitle">
              Base chance {Math.round((baseChance ?? 0) * 100)}% • Pity cap {pityCap}
            </div>
          </div>
          <div className="ruins-progress__pity-bar">
            <div
              className="ruins-progress__pity-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, pityPercent))}%` }}
            />
          </div>
          <div className="ruins-progress__pity-meta">
            Core shards: {bossChestFailures} / {pityTarget || '—'}
            {pityTarget > 0 && bossChestFailures >= pityTarget ? ' — Guaranteed on next boss chest' : ''}
          </div>
        </div>
      ) : null}

      <div className="ruins-progress__track">
        {roomTrack.map((room) => {
          const status = activeRun
            ? room.index < activeRun.roomIndex
              ? 'done'
              : room.index === activeRun.roomIndex
                ? 'current'
                : 'upcoming'
            : 'upcoming';
          return (
            <div key={room.index} className={`ruins-progress__room ruins-progress__room--${status}`}>
              <div className={`ruins-progress__room-chip ruins-progress__room-chip--${room.type}`}>{room.label}</div>
              <div className="ruins-progress__room-preview">{room.preview}</div>
              <div className="ruins-progress__room-mod">{room.type === 'boss' ? 'Boss modifiers active' : 'Standard foes'}</div>
            </div>
          );
        })}
      </div>

      {runSummary ? (
        <div className="ruins-progress__summary">
          <div className="ruins-progress__summary-title">Run recap</div>
            <div className="ruins-progress__summary-grid">
              <div>
                <div className="ruins-progress__metric">Outcome: {runSummary.victory ? 'Victory' : 'Defeat'}</div>
                <div className="ruins-progress__metric">Duration: {formatDuration(runSummary.durationSec)}</div>
                <div className="ruins-progress__metric">
                  Rooms cleared: {runSummary.roomsCleared} / {runSummary.roomCount}
                </div>
              </div>
              <div>
                <div className="ruins-progress__metric">Gold gained: +{formatNumber(runSummary.goldGained)}</div>
                <div className="ruins-progress__metric">Rare drops: {runSummary.rareDropCount}</div>
                <div className="ruins-progress__metric">Drops: {runSummary.drops.length}</div>
              </div>
            </div>
            {rareSummary ? (
              <div className="ruins-progress__pity-summary">
                Rare bonus:{' '}
                {rareSummary.hit
                  ? `${itemsById['mat_artifact_shard_bundle']?.name ?? 'Artifact Shard Bundle'}${rareSummary.guaranteed ? ' (Guaranteed)' : ''}`
                  : `Missed (${rareSummary.failuresBefore}/${Math.max(rareSummary.pityCap - 1, 0)})`}
              </div>
            ) : null}
            {runSummary.drops.length > 0 ? (
              <ul className="ruins-progress__drops">{summarizeMaterials(runSummary.drops, itemsById)}</ul>
            ) : (
            <div className="ruins-progress__empty">No notable materials this run.</div>
          )}
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="ruins-progress__history">
          <div className="ruins-progress__history-title">Recent runs</div>
          <ul>
            {history.map((entry) => (
              <li key={entry.runId} className="ruins-progress__history-row">
                <span>#{entry.runId}</span>
                <span>{entry.victory ? 'Cleared' : 'Defeated'}</span>
                <span>{formatDuration(entry.durationSec)}</span>
                <span>+{formatNumber(entry.goldGained)} gold</span>
                <span>{entry.rareDropCount} rare</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activeRun ? (
        <div className="ruins-progress__status">
          Current room: {currentIndex + 1} / {roomCount} — Started {formatDuration((Date.now() - activeRun.startedAt) / 1000)}
        </div>
      ) : null}
    </div>
  );
}
