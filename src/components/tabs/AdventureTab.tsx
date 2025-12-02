import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCombatStore } from '../../stores/combatStore';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useZoneStore } from '../../stores/zoneStore';
import { formatNumber, divide, D } from '../../utils/numbers';
import type { EnemyDefinition } from '../../types';
import { CombatCanvas } from '../combat/CombatCanvas';
import styles from './AdventureTab.module.css';

/**
 * Zone definition from JSON
 */
interface Zone {
  id: string;
  name: string;
  description: string;
  levelRange: {
    min: number;
    max: number;
  };
  realmRequirement: {
    index: number;
    substage: number;
  };
  enemyIds: string[];
  locked: boolean;
}

/**
 * HP Bar component
 */
function HPBar({
  current,
  max,
  label,
  variant = 'red'
}: {
  current: string;
  max: string;
  label: string;
  variant?: 'red' | 'green';
}) {
  const percent = Math.min(100, parseFloat(divide(current, max).times(100).toFixed(2)));
  const barClass = variant === 'green' ? styles.hpFillGreen : styles.hpFillRed;

  return (
    <div className={styles.hpBar}>
      <div className={styles.hpLabels}>
        <span className={styles.hpLabel}>{label}</span>
        <span className={styles.hpValue}>
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>
      <div className={styles.hpTrack}>
        <motion.div
          className={`${styles.hpFill} ${barClass}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/**
 * Combat Log component
 */
function CombatLog() {
  const combatLog = useCombatStore((state) => state.combatLog);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLog]);

  return (
    <div className={styles.combatLogContainer}>
      <div className={styles.combatLogList}>
        {combatLog.length === 0 ? (
          <div className={styles.combatLogEmpty}>Combat log is empty</div>
        ) : (
          combatLog.map((entry, index) => (
            <div
              key={index}
              className={styles.combatLogEntry}
              style={{ color: entry.color }}
            >
              {entry.text}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

/**
 * Adventure Tab Component
 */
export function AdventureTab() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [enemies, setEnemies] = useState<Record<string, EnemyDefinition>>({});
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Combat store
  const inCombat = useCombatStore((state) => state.inCombat);
  const currentEnemy = useCombatStore((state) => state.currentEnemy);
  const playerHP = useCombatStore((state) => state.playerHP);
  const playerMaxHP = useCombatStore((state) => state.playerMaxHP);
  const enemyHP = useCombatStore((state) => state.enemyHP);
  const enemyMaxHP = useCombatStore((state) => state.enemyMaxHP);
  const autoAttack = useCombatStore((state) => state.autoAttack);

  const enterCombat = useCombatStore((state) => state.enterCombat);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const playerAttack = useCombatStore((state) => state.playerAttack);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);

  // Game store
  const stats = useGameStore((state) => state.stats);

  // Inventory store
  const gold = useInventoryStore((state) => state.gold);

  // Zone store
  const isZoneUnlocked = useZoneStore((state) => state.isZoneUnlocked);
  const isZoneCompleted = useZoneStore((state) => state.isZoneCompleted);
  const getTotalEnemiesDefeated = useZoneStore((state) => state.getTotalEnemiesDefeated);
  const isBossAvailable = useZoneStore((state) => state.isBossAvailable);
  const enterZone = useZoneStore((state) => state.enterZone);

  // Load zones and enemies data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch zones
        const zonesResponse = await fetch('/config/zones.json');
        const zonesData = await zonesResponse.json();
        setZones(zonesData.zones || []);

        // Fetch enemies
        const enemiesResponse = await fetch('/config/enemies.json');
        const enemiesData = await enemiesResponse.json();

        // Convert enemies array to object keyed by id
        const enemiesMap: Record<string, EnemyDefinition> = {};
        (enemiesData.enemies || []).forEach((enemy: EnemyDefinition) => {
          enemiesMap[enemy.id] = enemy;
        });
        setEnemies(enemiesMap);

        console.log('[AdventureTab] Loaded zones and enemies');
      } catch (error) {
        console.error('[AdventureTab] Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle zone selection and enter combat
  const handleZoneClick = (zone: Zone) => {
    if (!isZoneUnlocked(zone.id)) {
      console.warn('[AdventureTab] Zone is locked');
      return;
    }

    setSelectedZoneId(zone.id);

    // Enter zone
    enterZone(zone.id);

    // Get available enemies from zone (filter out bosses unless available)
    const bossAvailable = isBossAvailable(zone.id);
    const availableEnemyIds = zone.enemyIds.filter((enemyId) => {
      const enemy = enemies[enemyId];
      if (!enemy) return false;

      // Include non-boss enemies, or bosses if they're available
      return !enemy.isBoss || bossAvailable;
    });

    if (availableEnemyIds.length === 0) {
      console.warn('[AdventureTab] No available enemies in zone');
      return;
    }

    const randomEnemyId = availableEnemyIds[Math.floor(Math.random() * availableEnemyIds.length)];
    const enemy = enemies[randomEnemyId];

    if (!enemy) {
      console.warn('[AdventureTab] Enemy not found:', randomEnemyId);
      return;
    }

    // Enter combat
    enterCombat(zone.id, enemy);
  };

  // Handle flee
  const handleFlee = () => {
    exitCombat();
    setSelectedZoneId(null);
  };

  // Handle manual attack
  const handleAttack = () => {
    playerAttack();
  };

  // Handle auto-attack toggle
  const handleAutoAttackToggle = () => {
    setAutoAttack(!autoAttack);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingIcon}>⚔️</div>
          <div className={styles.loadingText}>Loading adventure zones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* LEFT PANEL - Zone Selection */}
      <div className={styles.leftColumn}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>🗺️ Adventure Zones</h2>
          <div className={styles.zoneList}>
            {zones.map((zone) => {
              const unlocked = isZoneUnlocked(zone.id);
              const isSelected = selectedZoneId === zone.id;
              const completed = isZoneCompleted(zone.id);
              const enemiesDefeated = getTotalEnemiesDefeated(zone.id);
              const bossAvailable = isBossAvailable(zone.id);

              return (
                <motion.button
                  key={zone.id}
                  onClick={() => handleZoneClick(zone)}
                  disabled={!unlocked}
                  className={`${styles.zoneButton} ${isSelected ? styles.zoneSelected : ''} ${
                    unlocked ? '' : styles.zoneLocked
                  }`}
                  whileHover={unlocked ? { scale: 1.02 } : {}}
                >
                  <div className={styles.zoneHeader}>
                    <div className={styles.zoneTitleRow}>
                      <div className={styles.zoneName}>{zone.name}</div>
                      {completed && <div className={styles.zoneCompleted}>✓</div>}
                    </div>
                    <div className={styles.zoneLevel}>Lv. {zone.levelRange.min}-{zone.levelRange.max}</div>
                  </div>
                  <div className={styles.zoneDescription}>{zone.description}</div>
                  {unlocked && enemiesDefeated > 0 && (
                    <div className={styles.zoneMeta}>
                      Enemies defeated: {enemiesDefeated}
                      {bossAvailable && <span className={styles.zoneBoss}>⚡ Boss available!</span>}
                    </div>
                  )}
                  {!unlocked && <div className={styles.zoneLockedNote}>🔒 Defeat previous zone boss to unlock</div>}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Combat Area */}
      <div className={styles.rightColumn}>
        {!inCombat ? (
          // Not in combat - show selection message
          <div className={`${styles.panel} ${styles.emptyPanel}`}>
            <div className={styles.emptyContent}>
              <div className={styles.emptyIcon}>⚔️</div>
              <h2 className={styles.emptyTitle}>{selectedZoneId ? 'Ready for Combat' : 'Select a Zone'}</h2>
              <p className={styles.emptyDescription}>
                {selectedZoneId
                  ? 'Click on the zone again to find an enemy'
                  : 'Choose an adventure zone from the list to begin'}
              </p>

              {/* Quick Stats */}
              <div className={styles.quickStats}>
                <div className={styles.quickStatCard}>
                  <div className={styles.quickStatLabel}>HP</div>
                  <div className={styles.quickStatValueGreen}>{formatNumber(stats.hp)}</div>
                </div>
                <div className={styles.quickStatCard}>
                  <div className={styles.quickStatLabel}>ATK</div>
                  <div className={styles.quickStatValueRed}>{formatNumber(stats.atk)}</div>
                </div>
                <div className={styles.quickStatCard}>
                  <div className={styles.quickStatLabel}>DEF</div>
                  <div className={styles.quickStatValueBlue}>{formatNumber(stats.def)}</div>
                </div>
                <div className={styles.quickStatCard}>
                  <div className={styles.quickStatLabel}>Gold</div>
                  <div className={styles.quickStatValueGold}>{formatNumber(gold)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // In combat - show combat interface
          <>
            {/* Combat Canvas */}
            <div className={`${styles.panel} ${styles.canvasPanel}`}>
              <CombatCanvas
                width={800}
                height={400}
                inCombat={inCombat}
                playerHP={D(playerHP).toNumber()}
                enemyHP={D(enemyHP).toNumber()}
              />
            </div>

            {/* Enemy Info */}
            <div className={`${styles.panel} ${styles.enemyPanel}`}>
              <div className={styles.enemyHeader}>
                <div>
                  <h2 className={styles.enemyName}>{currentEnemy?.name || 'Unknown Enemy'}</h2>
                  <div className={styles.enemyLevel}>Level {currentEnemy?.level || 1}</div>
                </div>
                <div className={styles.enemyReward}>
                  <div className={styles.enemyRewardLabel}>Gold Reward</div>
                  <div className={styles.enemyRewardValue}>{formatNumber(currentEnemy?.goldReward || '0')}</div>
                </div>
              </div>

              {/* Enemy HP Bar */}
              <HPBar current={enemyHP} max={enemyMaxHP} label="Enemy HP" variant="red" />

              {/* Player HP Bar */}
              <HPBar current={playerHP} max={playerMaxHP} label="Your HP" variant="green" />

              {/* Combat Controls */}
              <div className={styles.combatControls}>
                <motion.button
                  onClick={handleAttack}
                  className={`${styles.actionButton} ${styles.primaryAction}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⚔️ Attack
                </motion.button>

                <motion.button
                  onClick={handleAutoAttackToggle}
                  className={`${styles.actionButton} ${
                    autoAttack ? styles.autoActive : styles.autoInactive
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {autoAttack ? '⚡ Auto (ON)' : '⚡ Auto (OFF)'}
                </motion.button>

                <motion.button
                  onClick={handleFlee}
                  className={`${styles.actionButton} ${styles.secondaryAction}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏃 Flee
                </motion.button>
              </div>
            </div>

            {/* Combat Log */}
            <div className={`${styles.panel} ${styles.combatLogPanel}`}>
              <h3 className={styles.combatLogTitle}>Combat Log</h3>
              <CombatLog />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
