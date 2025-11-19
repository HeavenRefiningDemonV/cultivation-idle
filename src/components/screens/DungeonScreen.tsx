import { useState, useEffect } from 'react';
import { useCombatStore } from '../../stores/combatStore';
import { useDungeonStore } from '../../stores/dungeonStore';
import { useGameStore } from '../../stores/gameStore';
import { formatNumber } from '../../utils/numbers';
import { CombatView } from './AdventureScreen';

/**
 * Dungeon definition from config
 */
interface Dungeon {
  id: string;
  name: string;
  tier: number;
  description: string;
  minRealm: number;
  suggestedDPS: number;
  suggestedHP: number;
  boss: {
    id: string;
    name: string;
    hp: number;
    atk: number;
    def: number;
    mechanics: Array<{
      type: 'shield' | 'aura' | 'enrage';
      trigger: { hpPercent: number };
      effect: {
        shieldAmount?: number;
        auraDamagePerSec?: number;
      };
      description: string;
    }>;
  };
  rewards: {
    gold: number;
    exp: number;
    guaranteedDrop: {
      itemId: string;
      name: string;
      firstClearOnly: boolean;
    };
  };
  unlocked: boolean;
}

/**
 * Calculate player readiness for a dungeon
 */
function getReadinessLevel(
  playerDPS: number,
  playerHP: number,
  suggestedDPS: number,
  suggestedHP: number
): { level: 'ready' | 'caution' | 'danger'; color: string; text: string } {
  const dpsRatio = playerDPS / suggestedDPS;
  const hpRatio = playerHP / suggestedHP;
  const avgRatio = (dpsRatio + hpRatio) / 2;

  if (avgRatio >= 1.2) {
    return { level: 'ready', color: 'text-green-400', text: 'READY' };
  } else if (avgRatio >= 0.8) {
    return { level: 'caution', color: 'text-yellow-400', text: 'CAUTION' };
  } else {
    return { level: 'danger', color: 'text-red-400', text: 'DANGER' };
  }
}

/**
 * Boss Preview Modal
 */
function BossPreviewModal({
  dungeon,
  onClose,
  onEnter,
  playerStats,
}: {
  dungeon: Dungeon;
  onClose: () => void;
  onEnter: () => void;
  playerStats: { atk: string; hp: string };
}) {
  const playerDPS = Number(playerStats.atk);
  const playerHP = Number(playerStats.hp);
  const readiness = getReadinessLevel(playerDPS, playerHP, dungeon.suggestedDPS, dungeon.suggestedHP);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-3xl w-full mx-4 bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg border-2 border-gold-accent/50 shadow-2xl">
        {/* Header */}
        <div className="border-b border-gold-accent/30 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-cinzel text-3xl font-bold text-gold-accent mb-2">
                {dungeon.name}
              </h2>
              <p className="text-slate-300 text-sm">{dungeon.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Boss Info */}
          <div className="bg-ink-dark/50 rounded-lg border-2 border-red-500/50 p-6">
            <h3 className="font-cinzel text-2xl font-bold text-red-400 mb-4 text-center">
              {dungeon.boss.name}
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-slate-400">HP</div>
                <div className="text-xl font-bold text-white">{formatNumber(dungeon.boss.hp)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">ATK</div>
                <div className="text-xl font-bold text-white">{formatNumber(dungeon.boss.atk)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">DEF</div>
                <div className="text-xl font-bold text-white">{formatNumber(dungeon.boss.def)}</div>
              </div>
            </div>

            {/* Boss Mechanics */}
            {dungeon.boss.mechanics && dungeon.boss.mechanics.length > 0 && (
              <div>
                <h4 className="font-bold text-gold-accent mb-3">Boss Mechanics:</h4>
                <div className="space-y-2">
                  {dungeon.boss.mechanics.map((mechanic, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/50 rounded p-3 border border-slate-600/50"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-purple-400">{mechanic.description}</span>
                        <span className="text-xs text-slate-400">
                          @ {mechanic.trigger.hpPercent}% HP
                        </span>
                      </div>
                      <div className="text-sm text-slate-300">
                        {mechanic.type === 'shield' &&
                          mechanic.effect.shieldAmount !== undefined &&
                          `Gains ${formatNumber(mechanic.effect.shieldAmount)} shield`}
                        {mechanic.type === 'aura' &&
                          mechanic.effect.auraDamagePerSec !== undefined &&
                          `Deals ${mechanic.effect.auraDamagePerSec} damage per second`}
                        {mechanic.type === 'enrage' && 'Increases attack power'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stat Comparison */}
          <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6">
            <h4 className="font-bold text-gold-accent mb-4">Readiness Check:</h4>

            {/* DPS Comparison */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Attack Power</span>
                <span>
                  <span className="text-white font-mono">{formatNumber(playerDPS)}</span>
                  <span className="text-slate-500"> / {formatNumber(dungeon.suggestedDPS)}</span>
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    playerDPS >= dungeon.suggestedDPS
                      ? 'bg-green-500'
                      : playerDPS >= dungeon.suggestedDPS * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (playerDPS / dungeon.suggestedDPS) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* HP Comparison */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Hit Points</span>
                <span>
                  <span className="text-white font-mono">{formatNumber(playerHP)}</span>
                  <span className="text-slate-500"> / {formatNumber(dungeon.suggestedHP)}</span>
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    playerHP >= dungeon.suggestedHP
                      ? 'bg-green-500'
                      : playerHP >= dungeon.suggestedHP * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (playerHP / dungeon.suggestedHP) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Overall Readiness */}
            <div className="text-center mt-6">
              <div className="text-sm text-slate-400 mb-1">Overall Readiness</div>
              <div className={`text-2xl font-bold ${readiness.color}`}>{readiness.text}</div>
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6">
            <h4 className="font-bold text-gold-accent mb-3">Rewards:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Gold:</span>
                <span className="text-yellow-400 font-bold">
                  {formatNumber(dungeon.rewards.gold)}
                </span>
              </div>
              {dungeon.rewards.guaranteedDrop && (
                <div className="flex justify-between">
                  <span className="text-slate-400">First Clear:</span>
                  <span className="text-purple-400 font-bold">
                    {dungeon.rewards.guaranteedDrop.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gold-accent/30 p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onEnter}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-red-500/50"
          >
            Enter Dungeon
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dungeon Card Component
 */
function DungeonCard({
  dungeon,
  playerStats,
}: {
  dungeon: Dungeon;
  playerStats: { atk: string; hp: string };
}) {
  const [showPreview, setShowPreview] = useState(false);
  const realm = useGameStore((state) => state.realm);
  const startDungeonCombat = useCombatStore((state) => state.startDungeonCombat);
  const isDungeonUnlocked = useDungeonStore((state) => state.isDungeonUnlocked(dungeon.id));
  const isFirstClear = useDungeonStore((state) => state.isFirstClear(dungeon.id));
  const totalClears = useDungeonStore((state) => state.getTotalClears(dungeon.id));

  if (!realm) return null;

  const isLocked = realm.index < dungeon.minRealm || !isDungeonUnlocked;

  const playerDPS = Number(playerStats.atk);
  const playerHP = Number(playerStats.hp);
  const readiness = getReadinessLevel(playerDPS, playerHP, dungeon.suggestedDPS, dungeon.suggestedHP);

  const handleEnterDungeon = () => {
    startDungeonCombat(dungeon.id, dungeon.boss, dungeon);
    setShowPreview(false);
  };

  return (
    <>
      <div
        className={`bg-ink-dark/50 rounded-lg border-2 p-6 backdrop-blur-sm transition-all ${
          isLocked
            ? 'border-slate-700 opacity-50'
            : 'border-gold-accent/30 hover:border-gold-accent/60 hover:shadow-lg hover:shadow-gold-accent/20'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-cinzel font-bold text-gold-accent">{dungeon.name}</h3>
            <div className="text-xs text-slate-500">Tier {dungeon.tier}</div>
          </div>

          {!isLocked && (
            <div className="flex gap-2">
              {isFirstClear && (
                <div className="px-2 py-1 bg-purple-500/20 border border-purple-400/50 rounded text-xs text-purple-300 font-bold">
                  FIRST CLEAR
                </div>
              )}
              {!isFirstClear && (
                <div className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-400">
                  Clears: {totalClears}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-slate-400 mb-4">{dungeon.description}</p>

        {isLocked ? (
          <div className="text-red-400 text-sm font-semibold">
            🔒 Requires Realm {dungeon.minRealm}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Readiness Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Readiness:</span>
              <span className={`text-sm font-bold ${readiness.color}`}>{readiness.text}</span>
            </div>

            {/* Suggested Stats */}
            <div className="text-xs text-slate-400 space-y-1">
              <div>Suggested ATK: {formatNumber(dungeon.suggestedDPS)}</div>
              <div>Suggested HP: {formatNumber(dungeon.suggestedHP)}</div>
            </div>

            {/* Boss Name */}
            <div className="text-sm">
              <span className="text-slate-400">Boss:</span>{' '}
              <span className="font-semibold text-red-400">{dungeon.boss.name}</span>
            </div>

            {/* First Clear Reward */}
            {isFirstClear && dungeon.rewards.guaranteedDrop && (
              <div className="bg-purple-500/10 border border-purple-400/30 rounded p-2">
                <div className="text-xs text-purple-300">
                  ✨ First Clear: <span className="font-bold">{dungeon.rewards.guaranteedDrop.name}</span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => setShowPreview(true)}
              className={`w-full font-semibold py-2 px-4 rounded transition-all ${
                readiness.level === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : readiness.level === 'caution'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Challenge Dungeon
            </button>
          </div>
        )}
      </div>

      {/* Boss Preview Modal */}
      {showPreview && (
        <BossPreviewModal
          dungeon={dungeon}
          onClose={() => setShowPreview(false)}
          onEnter={handleEnterDungeon}
          playerStats={playerStats}
        />
      )}
    </>
  );
}

/**
 * Main Dungeon Screen Component
 */
export function DungeonScreen() {
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = useGameStore((state) => state.stats);
  const inCombat = useCombatStore((state) => state.inCombat);
  const currentDungeon = useCombatStore((state) => state.currentDungeon);

  // Load dungeons from config
  useEffect(() => {
    fetch('/config/dungeons.json')
      .then((res) => res.json())
      .then((data) => {
        setDungeons(data.dungeons || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[DungeonScreen] Error loading dungeons:', err);
        setError('Failed to load dungeons');
        setLoading(false);
      });
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">⚔️</div>
            <div className="text-slate-400">Loading dungeons...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-red-400">
            <h2 className="text-2xl font-bold mb-2">Error Loading Dungeons</h2>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show combat view if in dungeon
  if (inCombat && currentDungeon) {
    const dungeon = dungeons.find((d) => d.id === currentDungeon);
    return (
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
        {/* Background decoration - dungeon themed */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(239, 68, 68, 0.4) 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Dungeon Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-purple-600/20 border border-purple-400/50 rounded-lg px-4 py-2 mb-3">
              <span className="text-purple-300 font-semibold text-sm">🏛️ DUNGEON TRIAL</span>
            </div>
            <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
              {dungeon?.name || 'Dungeon Trial'}
            </h1>
            <p className="text-slate-400 text-sm">
              Defeat <span className="text-red-400 font-semibold">{dungeon?.boss.name}</span> to claim your rewards
            </p>
          </div>

          {/* Combat UI */}
          <div className="max-w-4xl mx-auto">
            <CombatView />
          </div>
        </div>
      </div>
    );
  }

  // Show dungeon selection grid
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 50%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
            Trial Dungeons
          </h1>
          <p className="text-slate-400 text-sm">
            Challenge powerful bosses to obtain breakthrough materials
          </p>
        </div>

        {/* Dungeon Grid */}
        {dungeons.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            No dungeons available
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dungeons.map((dungeon) => (
              <DungeonCard key={dungeon.id} dungeon={dungeon} playerStats={stats} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
