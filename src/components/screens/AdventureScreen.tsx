import { useCombatStore } from '../../stores/combatStore';
import { useZoneStore } from '../../stores/zoneStore';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber } from '../../utils/numbers';
import { D } from '../../utils/numbers';
import { TechniquePanel } from '../TechniquePanel';
import './AdventureScreen.scss';

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
    <div className={`${'adventure-screen__zone-card'} ${isLocked ? 'adventure-screen__zone-card-locked' : ''}`}>
      <h3 className={'adventure-screen__zone-title'}>{zone.name}</h3>
      <p className={'adventure-screen__zone-description'}>{zone.description}</p>

      {isLocked ? (
        <div className={'adventure-screen__zone-boss'}>🔒 Requires Realm {zone.minRealm}</div>
      ) : (
        <div className={'adventure-screen__zone-details'}>
          <div>Min Realm: {zone.minRealm}</div>
          <div>
            Gold/hr: {zone.goldPerHour.min.toLocaleString()} - {zone.goldPerHour.max.toLocaleString()}
          </div>
          <div className={'adventure-screen__zone-boss'}>Boss: {zone.boss}</div>
          <div className={'adventure-screen__zone-hint'}>
            Suggested: {zone.suggestedStats.dps} DPS • {zone.suggestedStats.hp} HP
          </div>
          <div className={'adventure-screen__zone-progress'}>Enemies defeated: {zoneProgress?.enemiesDefeated || 0}</div>
        </div>
      )}

      {!isLocked && (
        <div className={'adventure-screen__zone-buttons'}>
          <button onClick={handleFightEnemies} className={'adventure-screen__button'}>
            Fight Enemies
          </button>
          <button
            onClick={handleFightBoss}
            disabled={!isBossAvailable}
            className={`${'adventure-screen__button'} ${'adventure-screen__button-danger'} ${!isBossAvailable ? 'adventure-screen__button-disabled' : ''}`}
          >
            {isBossAvailable ? 'Fight Boss' : 'Boss (10 kills needed)'}
          </button>
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
      <div className={'adventure-screen__combat-log-empty'}>
        No enemy in combat. Please select a zone to fight.
      </div>
    );
  }

  const playerHPPercent = playerMaxHP && Number(playerMaxHP) > 0
    ? (Number(playerHP) / Number(playerMaxHP)) * 100
    : 0;
  const enemyHPPercent = enemyMaxHP && Number(enemyMaxHP) > 0
    ? (Number(enemyHP) / Number(enemyMaxHP)) * 100
    : 0;

  return (
    <div className={'adventure-screen__combat-wrapper'}>
      {/* Enemy Display */}
      <div className={'adventure-screen__enemy-card'}>
        <div className={'adventure-screen__combat-wrapper'}>
          <div>
            <h2 className={'adventure-screen__enemy-title'}>{currentEnemy.name}</h2>
            {currentEnemy.isBoss && <div className={'adventure-screen__enemy-badge'}>⚔️ BOSS ENEMY ⚔️</div>}
          </div>

          {/* Enemy HP Bar */}
          <div className={'adventure-screen__bar-group'}>
            <div className={'adventure-screen__bar-label-row'}>
              <span>Enemy HP</span>
              <span className={'adventure-screen__enemy-badge'}>
                {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)}
              </span>
            </div>
            <div className={'adventure-screen__bar-container'}>
              <div className={'adventure-screen__bar-fill'} style={{ width: `${enemyHPPercent}%` }}>
                {enemyHPPercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Enemy Stats */}
          <div className={'adventure-screen__stat-grid'}>
            <div>
              <div className={'adventure-screen__stat-label'}>ATK</div>
              <div className={'adventure-screen__enemy-badge'}>{formatNumber(currentEnemy.atk)}</div>
            </div>
            <div>
              <div className={'adventure-screen__stat-label'}>DEF</div>
              <div className={'adventure-screen__enemy-badge'}>{formatNumber(currentEnemy.def)}</div>
            </div>
            <div>
              <div className={'adventure-screen__stat-label'}>Level</div>
              <div className={'adventure-screen__enemy-badge'}>{currentEnemy.level}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Display */}
      <div className={'adventure-screen__player-card'}>
        <div className={'adventure-screen__combat-wrapper'}>
          <h3 className={'adventure-screen__player-title'}>Your Status</h3>

          {/* Player HP Bar */}
          <div className={'adventure-screen__bar-group'}>
            <div className={'adventure-screen__bar-label-row'}>
              <span>Your HP</span>
              <span className={'adventure-screen__enemy-badge'}>
                {formatNumber(playerHP)} / {formatNumber(playerMaxHP)}
              </span>
            </div>
            <div className={'adventure-screen__bar-container'}>
              <div className={`${'adventure-screen__bar-fill'} ${'adventure-screen__bar-fill-player'}`} style={{ width: `${playerHPPercent}%` }}>
                {playerHPPercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className={'adventure-screen__stat-grid'}>
            <div>
              <div className={'adventure-screen__stat-label'}>ATK</div>
              <div className={'adventure-screen__player-title'}>{stats?.atk ? formatNumber(stats.atk) : '0'}</div>
            </div>
            <div>
              <div className={'adventure-screen__stat-label'}>DEF</div>
              <div className={'adventure-screen__player-title'}>{stats?.def ? formatNumber(stats.def) : '0'}</div>
            </div>
            <div>
              <div className={'adventure-screen__stat-label'}>Crit</div>
              <div className={'adventure-screen__player-title'}>{stats?.crit || 0}%</div>
            </div>
            <div>
              <div className={'adventure-screen__stat-label'}>Dodge</div>
              <div className={'adventure-screen__player-title'}>{stats?.dodge || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Combat Controls */}
      <div className={'adventure-screen__combat-controls'}>
        <button
          onClick={playerAttack}
          disabled={autoAttack}
          className={`${'adventure-screen__control-button'} ${'adventure-screen__button'} ${autoAttack ? 'adventure-screen__control-muted' : ''}`}
        >
          ⚔️ Attack
        </button>
        <button
          onClick={() => setAutoAttack(!autoAttack)}
          className={`${'adventure-screen__control-button'} ${'adventure-screen__control-secondary'} ${autoAttack ? '' : 'adventure-screen__button-disabled'}`}
        >
          {autoAttack ? '⏸️ Auto (ON)' : '▶️ Auto (OFF)'}
        </button>
        <button
          onClick={exitCombat}
          className={`${'adventure-screen__control-button'} ${'adventure-screen__control-danger'}`}
        >
          🏃 Retreat
        </button>
      </div>

      {/* Techniques and Combat Log Grid */}
      <div className={'adventure-screen__techniques-grid'}>
        {/* Technique Panel */}
        <TechniquePanel />

        {showCombatLog && (
          <div className={'adventure-screen__combat-log-card'}>
            <h3 className={'adventure-screen__combat-log-title'}>Combat Log</h3>
            <div className={'adventure-screen__combat-log-body'}>
              {combatLog.length === 0 ? (
                <p className={'adventure-screen__combat-log-empty'}>No messages yet...</p>
              ) : (
                combatLog.slice(-20).reverse().map((log, idx) => (
                  <div key={`${log.timestamp}-${idx}`} className={log.color || 'adventure-screen__combat-log-default'}>
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
      <div className={'adventure-screen'}>
        {/* Background decoration */}
        <div className={'adventure-screen__background'} />

        {/* Main Content */}
        <div className={'adventure-screen__content'}>
          {/* Header */}
          <div className={'adventure-screen__header'}>
            <h1 className={'adventure-screen__title'}>{inCombat ? 'Combat' : 'Adventure Zones'}</h1>
            <p className={'adventure-screen__subtitle'}>
              {inCombat
                ? 'Defeat your enemy to claim rewards'
                : 'Explore dangerous territories and battle fearsome enemies'}
            </p>
          </div>

          {/* Zone Selection or Combat View */}
          {!inCombat ? (
            <div className={'adventure-screen__zone-grid'}>
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
      <div className={'adventure-screen__error-card'}>
        <div className={'adventure-screen__header'}>
          <h2 className={'adventure-screen__error-title'}>Error Loading Adventure</h2>
          <p className={'adventure-screen__error-message'}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
}
