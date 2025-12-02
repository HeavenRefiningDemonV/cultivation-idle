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
    <div className={`${'adventureScreenZoneCard'} ${isLocked ? 'adventureScreenZoneCardLocked' : ''}`}>
      <h3 className={'adventureScreenZoneTitle'}>{zone.name}</h3>
      <p className={'adventureScreenZoneDescription'}>{zone.description}</p>

      {isLocked ? (
        <div className={'adventureScreenZoneBoss'}>🔒 Requires Realm {zone.minRealm}</div>
      ) : (
        <div className={'adventureScreenZoneDetails'}>
          <div>Min Realm: {zone.minRealm}</div>
          <div>
            Gold/hr: {zone.goldPerHour.min.toLocaleString()} - {zone.goldPerHour.max.toLocaleString()}
          </div>
          <div className={'adventureScreenZoneBoss'}>Boss: {zone.boss}</div>
          <div className={'adventureScreenZoneHint'}>
            Suggested: {zone.suggestedStats.dps} DPS • {zone.suggestedStats.hp} HP
          </div>
          <div className={'adventureScreenZoneProgress'}>Enemies defeated: {zoneProgress?.enemiesDefeated || 0}</div>
        </div>
      )}

      {!isLocked && (
        <div className={'adventureScreenZoneButtons'}>
          <button onClick={handleFightEnemies} className={'adventureScreenButton'}>
            Fight Enemies
          </button>
          <button
            onClick={handleFightBoss}
            disabled={!isBossAvailable}
            className={`${'adventureScreenButton'} ${'adventureScreenButtonDanger'} ${!isBossAvailable ? 'adventureScreenButtonDisabled' : ''}`}
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
      <div className={'adventureScreenCombatLogEmpty'}>
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
    <div className={'adventureScreenCombatWrapper'}>
      {/* Enemy Display */}
      <div className={'adventureScreenEnemyCard'}>
        <div className={'adventureScreenCombatWrapper'}>
          <div>
            <h2 className={'adventureScreenEnemyTitle'}>{currentEnemy.name}</h2>
            {currentEnemy.isBoss && <div className={'adventureScreenEnemyBadge'}>⚔️ BOSS ENEMY ⚔️</div>}
          </div>

          {/* Enemy HP Bar */}
          <div className={'adventureScreenBarGroup'}>
            <div className={'adventureScreenBarLabelRow'}>
              <span>Enemy HP</span>
              <span className={'adventureScreenEnemyBadge'}>
                {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)}
              </span>
            </div>
            <div className={'adventureScreenBarContainer'}>
              <div className={'adventureScreenBarFill'} style={{ width: `${enemyHPPercent}%` }}>
                {enemyHPPercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Enemy Stats */}
          <div className={'adventureScreenStatGrid'}>
            <div>
              <div className={'adventureScreenStatLabel'}>ATK</div>
              <div className={'adventureScreenEnemyBadge'}>{formatNumber(currentEnemy.atk)}</div>
            </div>
            <div>
              <div className={'adventureScreenStatLabel'}>DEF</div>
              <div className={'adventureScreenEnemyBadge'}>{formatNumber(currentEnemy.def)}</div>
            </div>
            <div>
              <div className={'adventureScreenStatLabel'}>Level</div>
              <div className={'adventureScreenEnemyBadge'}>{currentEnemy.level}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Display */}
      <div className={'adventureScreenPlayerCard'}>
        <div className={'adventureScreenCombatWrapper'}>
          <h3 className={'adventureScreenPlayerTitle'}>Your Status</h3>

          {/* Player HP Bar */}
          <div className={'adventureScreenBarGroup'}>
            <div className={'adventureScreenBarLabelRow'}>
              <span>Your HP</span>
              <span className={'adventureScreenEnemyBadge'}>
                {formatNumber(playerHP)} / {formatNumber(playerMaxHP)}
              </span>
            </div>
            <div className={'adventureScreenBarContainer'}>
              <div className={`${'adventureScreenBarFill'} ${'adventureScreenBarFillPlayer'}`} style={{ width: `${playerHPPercent}%` }}>
                {playerHPPercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className={'adventureScreenStatGrid'}>
            <div>
              <div className={'adventureScreenStatLabel'}>ATK</div>
              <div className={'adventureScreenPlayerTitle'}>{stats?.atk ? formatNumber(stats.atk) : '0'}</div>
            </div>
            <div>
              <div className={'adventureScreenStatLabel'}>DEF</div>
              <div className={'adventureScreenPlayerTitle'}>{stats?.def ? formatNumber(stats.def) : '0'}</div>
            </div>
            <div>
              <div className={'adventureScreenStatLabel'}>Crit</div>
              <div className={'adventureScreenPlayerTitle'}>{stats?.crit || 0}%</div>
            </div>
            <div>
              <div className={'adventureScreenStatLabel'}>Dodge</div>
              <div className={'adventureScreenPlayerTitle'}>{stats?.dodge || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Combat Controls */}
      <div className={'adventureScreenCombatControls'}>
        <button
          onClick={playerAttack}
          disabled={autoAttack}
          className={`${'adventureScreenControlButton'} ${'adventureScreenButton'} ${autoAttack ? 'adventureScreenControlMuted' : ''}`}
        >
          ⚔️ Attack
        </button>
        <button
          onClick={() => setAutoAttack(!autoAttack)}
          className={`${'adventureScreenControlButton'} ${'adventureScreenControlSecondary'} ${autoAttack ? '' : 'adventureScreenButtonDisabled'}`}
        >
          {autoAttack ? '⏸️ Auto (ON)' : '▶️ Auto (OFF)'}
        </button>
        <button
          onClick={exitCombat}
          className={`${'adventureScreenControlButton'} ${'adventureScreenControlDanger'}`}
        >
          🏃 Retreat
        </button>
      </div>

      {/* Techniques and Combat Log Grid */}
      <div className={'adventureScreenTechniquesGrid'}>
        {/* Technique Panel */}
        <TechniquePanel />

        {showCombatLog && (
          <div className={'adventureScreenCombatLogCard'}>
            <h3 className={'adventureScreenCombatLogTitle'}>Combat Log</h3>
            <div className={'adventureScreenCombatLogBody'}>
              {combatLog.length === 0 ? (
                <p className={'adventureScreenCombatLogEmpty'}>No messages yet...</p>
              ) : (
                combatLog.slice(-20).reverse().map((log, idx) => (
                  <div key={`${log.timestamp}-${idx}`} className={log.color || 'adventureScreenCombatLogDefault'}>
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
      <div className={'adventureScreenRoot'}>
        {/* Background decoration */}
        <div className={'adventureScreenBackground'} />

        {/* Main Content */}
        <div className={'adventureScreenContent'}>
          {/* Header */}
          <div className={'adventureScreenHeader'}>
            <h1 className={'adventureScreenTitle'}>{inCombat ? 'Combat' : 'Adventure Zones'}</h1>
            <p className={'adventureScreenSubtitle'}>
              {inCombat
                ? 'Defeat your enemy to claim rewards'
                : 'Explore dangerous territories and battle fearsome enemies'}
            </p>
          </div>

          {/* Zone Selection or Combat View */}
          {!inCombat ? (
            <div className={'adventureScreenZoneGrid'}>
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
      <div className={'adventureScreenErrorCard'}>
        <div className={'adventureScreenHeader'}>
          <h2 className={'adventureScreenErrorTitle'}>Error Loading Adventure</h2>
          <p className={'adventureScreenErrorMessage'}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
}
