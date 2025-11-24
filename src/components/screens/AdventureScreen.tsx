import { useCombatStore } from '../../stores/combatStore';
import { useZoneStore } from '../../stores/zoneStore';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber } from '../../utils/numbers';
import { D } from '../../utils/numbers';
import { TechniquePanel } from '../TechniquePanel';
import { HpBar } from '../ui/Bar';

/**
 * Zone definitions (move to constants later if needed)
 */
const ZONES = [
  {
    id: 'training_forest',
    name: 'Training Forest',
    description: 'A peaceful forest where cultivators begin their journey',
    minRealm: 0,
    goldPerHour: { min: 1000, max: 1500 },
    enemies: ['Wild Boar', 'Forest Wolf', 'Spirit Deer'],
    boss: 'Forest Guardian',
    suggestedStats: { dps: 50, hp: 800 },
  },
  {
    id: 'spirit_cavern',
    name: 'Spirit Cavern',
    description: 'Dark caves filled with crystalline spirits',
    minRealm: 1,
    goldPerHour: { min: 2500, max: 3500 },
    enemies: ['Stone Elemental', 'Crystal Spider', 'Cave Bat'],
    boss: 'Crystal Patriarch',
    suggestedStats: { dps: 200, hp: 3000 },
  },
  {
    id: 'mystic_mountains',
    name: 'Mystic Mountains',
    description: 'Treacherous peaks where the wind whispers secrets',
    minRealm: 2,
    goldPerHour: { min: 5000, max: 7000 },
    enemies: ['Mountain Tiger', 'Sky Hawk', 'Rock Golem'],
    boss: 'Mountain Sovereign',
    suggestedStats: { dps: 500, hp: 8000 },
  },
];

/**
 * Generate an enemy for combat
 */
function generateEnemy(zone: typeof ZONES[0], isBoss: boolean, realm: number) {
  const baseLevel = realm * 10 + (isBoss ? 10 : Math.floor(Math.random() * 5) + 1);
  const levelMult = 1 + baseLevel * 0.1;
  const realmMult = Math.pow(1.5, realm);
  const bossMult = isBoss ? 5 : 1;

  const name = isBoss
    ? zone.boss
    : zone.enemies[Math.floor(Math.random() * zone.enemies.length)];

  const baseHP = 500 * levelMult * realmMult * bossMult;
  const baseAtk = 50 * levelMult * realmMult * bossMult;
  const baseDef = 20 * levelMult * realmMult * bossMult;
  const baseGold = 100 * levelMult * realmMult * bossMult;
  const baseExp = 50 * levelMult * realmMult * bossMult;

  return {
    id: `${name}_${Date.now()}`,
    name: `${name} (Lv ${baseLevel})`,
    level: baseLevel,
    zone: zone.id,
    hp: D(baseHP).toFixed(0),
    atk: D(baseAtk).toFixed(0),
    def: D(baseDef).toFixed(0),
    crit: 5,
    critDmg: 150,
    dodge: 5,
    speed: 1.0,
    goldReward: D(baseGold).toFixed(0),
    expReward: D(baseExp).toFixed(0),
    isBoss,
  };
}

/**
 * Zone Card Component
 */
function ZoneCard({ zone }: { zone: typeof ZONES[0] }) {
  const realm = useGameStore((state) => state.realm);
  const isUnlocked = useZoneStore((state) => state.isZoneUnlocked(zone.id));
  const isBossAvailable = useZoneStore((state) => state.isBossAvailable(zone.id));
  // Select the zoneProgress directly from the store to avoid function call in selector
  const zoneProgress = useZoneStore((state) => state.zoneProgress[zone.id]);
  const enterCombat = useCombatStore((state) => state.enterCombat);

  if (!realm) {
    return null;
  }

  const isLocked = realm.index < zone.minRealm || !isUnlocked;

  const handleFightEnemies = () => {
    const enemy = generateEnemy(zone, false, realm.index);
    enterCombat(zone.id, enemy);
  };

  const handleFightBoss = () => {
    const enemy = generateEnemy(zone, true, realm.index);
    enterCombat(zone.id, enemy);
  };

  return (
    <div
      className={`bg-ink-dark/50 rounded-lg border-2 p-6 backdrop-blur-sm ${
        isLocked ? 'border-slate-700 opacity-50' : 'border-gold-accent/30'
      }`}
    >
      <h3 className="text-xl font-cinzel font-bold text-gold-accent mb-2">
        {zone.name}
      </h3>
      <p className="text-sm text-slate-400 mb-4">{zone.description}</p>

      {isLocked ? (
        <div className="text-red-400 text-sm font-semibold">
          🔒 Requires Realm {zone.minRealm}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-slate-300 space-y-1">
            <div>Min Realm: {zone.minRealm}</div>
            <div>
              Gold/hr: {zone.goldPerHour.min.toLocaleString()} -{' '}
              {zone.goldPerHour.max.toLocaleString()}
            </div>
            <div className="font-semibold text-gold-accent">Boss: {zone.boss}</div>
            <div className="text-xs text-slate-400">
              Suggested: {zone.suggestedStats.dps} DPS • {zone.suggestedStats.hp} HP
            </div>
            <div className="text-xs text-qi-blue">
              Enemies defeated: {zoneProgress?.enemiesDefeated || 0}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFightEnemies}
              className="flex-1 bg-qi-blue hover:bg-qi-glow text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Fight Enemies
            </button>
            <button
              onClick={handleFightBoss}
              disabled={!isBossAvailable}
              className={`flex-1 font-semibold py-2 px-4 rounded transition-colors ${
                isBossAvailable
                  ? 'bg-breakthrough-red hover:bg-breakthrough-pink text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isBossAvailable ? 'Fight Boss' : 'Boss (10 kills needed)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Combat View Component (exported for reuse in dungeons)
 */
export function CombatView() {
  const {
    currentEnemy,
    playerHP,
    playerMaxHP,
    enemyHP,
    enemyMaxHP,
    combatLog,
    autoAttack,
    exitCombat,
    setAutoAttack,
    playerAttack,
  } = useCombatStore();

  const stats = useGameStore((state) => state.stats);
  const showCombatLog = useUIStore((state) => state.settings.showCombatLog);

  if (!currentEnemy) {
    return (
      <div className="text-center text-slate-400 py-12">
        No enemy in combat. Please select a zone to fight.
      </div>
    );
  }

  const enemyHPPercent = enemyMaxHP && Number(enemyMaxHP) > 0
    ? (Number(enemyHP) / Number(enemyMaxHP)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Enemy Display */}
      <div className="bg-ink-dark/50 rounded-lg border-2 border-red-500/50 p-6 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-cinzel font-bold text-red-400 mb-1">
              {currentEnemy.name}
            </h2>
            {currentEnemy.isBoss && (
              <div className="text-yellow-400 text-sm font-semibold animate-pulse">
                ⚔️ BOSS ENEMY ⚔️
              </div>
            )}
          </div>

          {/* Enemy HP Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Enemy HP</span>
              <span className="font-mono text-red-400">
                {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)}
              </span>
            </div>
            <div className="h-8 bg-slate-800 rounded-full overflow-hidden border-2 border-red-500/30">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 flex items-center justify-center"
                style={{ width: `${enemyHPPercent}%` }}
              >
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {enemyHPPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Enemy Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">ATK</div>
              <div className="font-semibold text-white font-mono">
                {formatNumber(currentEnemy.atk)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">DEF</div>
              <div className="font-semibold text-white font-mono">
                {formatNumber(currentEnemy.def)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Level</div>
              <div className="font-semibold text-white font-mono">{currentEnemy.level}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Display */}
      <div className="bg-ink-dark/50 rounded-lg border-2 border-green-500/50 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          <h3 className="text-xl font-cinzel font-bold text-green-400">Your Status</h3>

          {/* Player HP Bar */}
          <HpBar
            label="Your HP"
            current={Number(playerHP) || 0}
            max={Number(playerMaxHP) || 0}
          />

          {/* Player Stats */}
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-slate-400">ATK</div>
              <div className="font-semibold text-white font-mono">
                {stats?.atk ? formatNumber(stats.atk) : '0'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">DEF</div>
              <div className="font-semibold text-white font-mono">
                {stats?.def ? formatNumber(stats.def) : '0'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Crit</div>
              <div className="font-semibold text-white font-mono">{stats?.crit || 0}%</div>
            </div>
            <div>
              <div className="text-slate-400">Dodge</div>
              <div className="font-semibold text-white font-mono">{stats?.dodge || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Combat Controls */}
      <div className="flex gap-3">
        <button
          onClick={playerAttack}
          disabled={autoAttack}
          className="flex-1 bg-qi-blue hover:bg-qi-glow disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          ⚔️ Attack
        </button>
        <button
          onClick={() => setAutoAttack(!autoAttack)}
          className={`flex-1 font-semibold py-3 rounded-lg transition-colors ${
            autoAttack
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          {autoAttack ? '⏸️ Auto (ON)' : '▶️ Auto (OFF)'}
        </button>
        <button
          onClick={exitCombat}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          🏃 Retreat
        </button>
      </div>

      {/* Techniques and Combat Log Grid */}
      <div className={`grid grid-cols-1 ${showCombatLog ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Technique Panel */}
        <TechniquePanel />

        {showCombatLog && (
          <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-4 backdrop-blur-sm">
            <h3 className="text-lg font-cinzel font-bold text-gold-accent mb-3">Combat Log</h3>
            <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-sm">
              {combatLog.length === 0 ? (
                <p className="text-slate-500 italic">No messages yet...</p>
              ) : (
                combatLog.slice(-20).reverse().map((log, idx) => (
                  <div key={`${log.timestamp}-${idx}`} className={log.color || 'text-slate-300'}>
                    {log.text}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Adventure Screen Component
 */
export function AdventureScreen() {
  try {
    const inCombat = useCombatStore((state) => state.inCombat);

    return (
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 50%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)',
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
              {inCombat ? 'Combat' : 'Adventure Zones'}
            </h1>
            <p className="text-slate-400 text-sm">
              {inCombat
                ? 'Defeat your enemy to claim rewards'
                : 'Explore dangerous territories and battle fearsome enemies'}
            </p>
          </div>

          {/* Zone Selection or Combat View */}
          {!inCombat ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ZONES.map((zone) => (
                <ZoneCard key={zone.id} zone={zone} />
              ))}
            </div>
          ) : (
            <CombatView />
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('[AdventureScreen] Error:', error);
    return (
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg p-8">
        <div className="text-center text-red-400">
          <h2 className="text-2xl font-bold mb-2">Error Loading Adventure</h2>
          <p className="text-sm text-slate-400">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
}
