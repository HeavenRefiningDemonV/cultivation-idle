import { useCombatStore } from '../../stores/combatStore';
import { useZoneStore } from '../../stores/zoneStore';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber } from '../../utils/numbers';
import { D } from '../../utils/numbers';
import { TechniquePanel } from '../TechniquePanel';
import styles from './AdventureScreen.module.css';

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

  const cardClass = `${styles.zoneCard} ${isLocked ? styles.zoneLocked : ''}`;
  const bossButtonClass = `${styles.button} ${
    isBossAvailable ? styles.buttonDanger : styles.buttonDisabled
  }`;

  return (
    <div className={cardClass}>
      <h3 className={styles.zoneTitle}>{zone.name}</h3>
      <p className={styles.zoneDescription}>{zone.description}</p>

      {isLocked ? (
        <div className={styles.lockedNotice}>🔒 Requires Realm {zone.minRealm}</div>
      ) : (
        <div className={styles.zoneMeta}>
          <div>Min Realm: {zone.minRealm}</div>
          <div>
            Gold/hr: {zone.goldPerHour.min.toLocaleString()} - {zone.goldPerHour.max.toLocaleString()}
          </div>
          <div className={styles.zoneMetaStrong}>Boss: {zone.boss}</div>
          <div className={styles.zoneMetaHint}>Enemies defeated: {zoneProgress?.enemiesDefeated || 0}</div>
          <div className={styles.zoneMetaHint}>
            Suggested: {zone.suggestedStats.dps} DPS • {zone.suggestedStats.hp} HP
          </div>
        </div>
      )}

      {!isLocked && (
        <div className={styles.zoneActions}>
          <button onClick={handleFightEnemies} className={`${styles.button} ${styles.buttonPrimary}`}>
            Fight Enemies
          </button>
          <button onClick={handleFightBoss} disabled={!isBossAvailable} className={bossButtonClass}>
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
    return <div className={styles.loadingContent}>No enemy in combat. Please select a zone to fight.</div>;
  }

  const playerHPPercent = playerMaxHP && Number(playerMaxHP) > 0
    ? (Number(playerHP) / Number(playerMaxHP)) * 100
    : 0;
  const enemyHPPercent = enemyMaxHP && Number(enemyMaxHP) > 0
    ? (Number(enemyHP) / Number(enemyMaxHP)) * 100
    : 0;

  const attackButtonClass = `${styles.button} ${autoAttack ? styles.buttonDisabled : styles.buttonPrimary}`;
  const autoButtonClass = `${styles.button} ${autoAttack ? styles.buttonWarning : styles.buttonNeutral}`;
  const retreatButtonClass = `${styles.button} ${styles.buttonDanger}`;

  return (
    <div className={styles.combatSection}>
      {/* Enemy Display */}
      <div className={`${styles.panel} ${styles.panelDanger}`}>
        <div className={styles.panelHeader + ' ' + styles.panelHeaderDanger}>{currentEnemy.name}</div>

        <div className={styles.barLabelRow}>
          <span>Enemy HP</span>
          <span className={styles.statValue}>
            {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)}
          </span>
        </div>
        <div className={styles.barContainer}>
          <div
            className={`${styles.barFill} ${styles.barFillEnemy}`}
            style={{ width: `${enemyHPPercent}%` }}
          >
            {enemyHPPercent.toFixed(1)}%
          </div>
        </div>

        <div className={`${styles.statGrid} ${styles.statGridThree}`}>
          <div>
            <div className={styles.statLabel}>ATK</div>
            <div className={styles.statValue}>{formatNumber(currentEnemy.atk)}</div>
          </div>
          <div>
            <div className={styles.statLabel}>DEF</div>
            <div className={styles.statValue}>{formatNumber(currentEnemy.def)}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Level</div>
            <div className={styles.statValue}>{currentEnemy.level}</div>
          </div>
        </div>
      </div>

      {/* Player Display */}
      <div className={`${styles.panel} ${styles.panelSuccess}`}>
        <div className={styles.panelHeader + ' ' + styles.panelHeaderSuccess}>Your Status</div>

        <div className={styles.barLabelRow}>
          <span>Your HP</span>
          <span className={styles.statValue}>
            {formatNumber(playerHP)} / {formatNumber(playerMaxHP)}
          </span>
        </div>
        <div className={styles.barContainer}>
          <div
            className={`${styles.barFill} ${styles.barFillPlayer}`}
            style={{ width: `${playerHPPercent}%` }}
          >
            {playerHPPercent.toFixed(1)}%
          </div>
        </div>

        <div className={`${styles.statGrid} ${styles.statGridFour}`}>
          <div>
            <div className={styles.statLabel}>ATK</div>
            <div className={styles.statValue}>{stats?.atk ? formatNumber(stats.atk) : '0'}</div>
          </div>
          <div>
            <div className={styles.statLabel}>DEF</div>
            <div className={styles.statValue}>{stats?.def ? formatNumber(stats.def) : '0'}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Crit</div>
            <div className={styles.statValue}>{stats?.crit || 0}%</div>
          </div>
          <div>
            <div className={styles.statLabel}>Dodge</div>
            <div className={styles.statValue}>{stats?.dodge || 0}%</div>
          </div>
        </div>
      </div>

      {/* Combat Controls */}
      <div className={styles.combatControls}>
        <button onClick={playerAttack} disabled={autoAttack} className={attackButtonClass}>
          ⚔️ Attack
        </button>
        <button onClick={() => setAutoAttack(!autoAttack)} className={autoButtonClass}>
          {autoAttack ? '⏸️ Auto (ON)' : '▶️ Auto (OFF)'}
        </button>
        <button onClick={exitCombat} className={retreatButtonClass}>
          🏃 Retreat
        </button>
      </div>

      {/* Techniques and Combat Log Grid */}
      <div className={`${styles.combatLayout} ${showCombatLog ? styles.combatLayoutTwo : ''}`}>
        {/* Technique Panel */}
        <TechniquePanel />

        {showCombatLog && (
          <div className={styles.combatLogPanel}>
            <h3 className={styles.combatLogTitle}>Combat Log</h3>
            <div className={styles.combatLogList}>
              {combatLog.length === 0 ? (
                <p className={styles.combatLogEmpty}>No messages yet...</p>
              ) : (
                combatLog.slice(-20).reverse().map((log, idx) => (
                  <div
                    key={`${log.timestamp}-${idx}`}
                    className={styles.combatLogEntry}
                    style={{ color: log.color || undefined }}
                  >
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
      <div className={styles.root}>
        {/* Background decoration */}
        <div className={styles.background} />

        {/* Main Content */}
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>{inCombat ? 'Combat' : 'Adventure Zones'}</h1>
            <p className={styles.subtitle}>
              {inCombat
                ? 'Defeat your enemy to claim rewards'
                : 'Explore dangerous territories and battle fearsome enemies'}
            </p>
          </div>

          {/* Zone Selection or Combat View */}
          {!inCombat ? (
            <div className={styles.zoneGrid}>
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
      <div className={styles.errorCard}>
        <div className={styles.errorContent}>
          <h2 className={styles.panelHeader + ' ' + styles.panelHeaderDanger}>Error Loading Adventure</h2>
          <p className={styles.errorText}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
}
