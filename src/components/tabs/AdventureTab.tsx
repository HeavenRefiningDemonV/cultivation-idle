import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCombatStore } from '../../stores/combatStore';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useZoneStore } from '../../stores/zoneStore';
import { formatNumber, divide, D } from '../../utils/numbers';
import type { EnemyDefinition } from '../../types';
import { CombatCanvas } from '../combat/CombatCanvas';
import './AdventureTab.scss';

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
  const barClass = variant === 'green' ? 'adventure-tab__hp-fill-green' : 'adventure-tab__hp-fill-red';

  return (
    <div className={'adventure-tab__hp-bar'}>
      <div className={'adventure-tab__hp-labels'}>
        <span className={'adventure-tab__hp-label'}>{label}</span>
        <span className={'adventure-tab__hp-value'}>
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>
      <div className={'adventure-tab__hp-track'}>
        <motion.div
          className={`${'adventure-tab__hp-fill'} ${barClass}`}
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
    <div className={'adventure-tab__combat-log-container'}>
      <div className={'adventure-tab__combat-log-list'}>
        {combatLog.length === 0 ? (
          <div className={'adventure-tab__combat-log-empty'}>Combat log is empty</div>
        ) : (
          combatLog.map((entry, index) => (
            <div
              key={index}
              className={'adventure-tab__combat-log-entry'}
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
      <div className={'adventure-tab__loading'}>
        <div className={'adventure-tab__loading-card'}>
          <div className={'adventure-tab__loading-icon'}>⚔️</div>
          <div className={'adventure-tab__loading-text'}>Loading adventure zones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={'adventure-tab'}>
      {/* LEFT PANEL - Zone Selection */}
      <div className={'adventure-tab__left-column'}>
        <div className={'adventure-tab__panel'}>
          <h2 className={'adventure-tab__panel-title'}>🗺️ Adventure Zones</h2>
          <div className={'adventure-tab__zone-list'}>
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
                  className={`${'adventure-tab__zone-button'} ${isSelected ? 'adventure-tab__zone-selected' : ''} ${
                    unlocked ? '' : 'adventure-tab__zone-locked'
                  }`}
                  whileHover={unlocked ? { scale: 1.02 } : {}}
                >
                  <div className={'adventure-tab__zone-header'}>
                    <div className={'adventure-tab__zone-title-row'}>
                      <div className={'adventure-tab__zone-name'}>{zone.name}</div>
                      {completed && <div className={'adventure-tab__zone-completed'}>✓</div>}
                    </div>
                    <div className={'adventure-tab__zone-level'}>Lv. {zone.levelRange.min}-{zone.levelRange.max}</div>
                  </div>
                  <div className={'adventure-tab__zone-description'}>{zone.description}</div>
                  {unlocked && enemiesDefeated > 0 && (
                    <div className={'adventure-tab__zone-meta'}>
                      Enemies defeated: {enemiesDefeated}
                      {bossAvailable && <span className={'adventure-tab__zone-boss'}>⚡ Boss available!</span>}
                    </div>
                  )}
                  {!unlocked && <div className={'adventure-tab__zone-locked-note'}>🔒 Defeat previous zone boss to unlock</div>}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Combat Area */}
      <div className={'adventure-tab__right-column'}>
        {!inCombat ? (
          // Not in combat - show selection message
          <div className={`${'adventure-tab__panel'} ${'adventure-tab__empty-panel'}`}>
            <div className={'adventure-tab__empty-content'}>
              <div className={'adventure-tab__empty-icon'}>⚔️</div>
              <h2 className={'adventure-tab__empty-title'}>{selectedZoneId ? 'Ready for Combat' : 'Select a Zone'}</h2>
              <p className={'adventure-tab__empty-description'}>
                {selectedZoneId
                  ? 'Click on the zone again to find an enemy'
                  : 'Choose an adventure zone from the list to begin'}
              </p>

              {/* Quick Stats */}
              <div className={'adventure-tab__quick-stats'}>
                <div className={'adventure-tab__quick-stat-card'}>
                  <div className={'adventure-tab__quick-stat-label'}>HP</div>
                  <div className={'adventure-tab__quick-stat-value-green'}>{formatNumber(stats.hp)}</div>
                </div>
                <div className={'adventure-tab__quick-stat-card'}>
                  <div className={'adventure-tab__quick-stat-label'}>ATK</div>
                  <div className={'adventure-tab__quick-stat-value-red'}>{formatNumber(stats.atk)}</div>
                </div>
                <div className={'adventure-tab__quick-stat-card'}>
                  <div className={'adventure-tab__quick-stat-label'}>DEF</div>
                  <div className={'adventure-tab__quick-stat-value-blue'}>{formatNumber(stats.def)}</div>
                </div>
                <div className={'adventure-tab__quick-stat-card'}>
                  <div className={'adventure-tab__quick-stat-label'}>Gold</div>
                  <div className={'adventure-tab__quick-stat-value-gold'}>{formatNumber(gold)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // In combat - show combat interface
          <>
            {/* Combat Canvas */}
            <div className={`${'adventure-tab__panel'} ${'adventure-tab__canvas-panel'}`}>
              <CombatCanvas
                width={800}
                height={400}
                inCombat={inCombat}
                playerHP={D(playerHP).toNumber()}
                enemyHP={D(enemyHP).toNumber()}
              />
            </div>

            {/* Enemy Info */}
            <div className={`${'adventure-tab__panel'} ${'adventure-tab__enemy-panel'}`}>
              <div className={'adventure-tab__enemy-header'}>
                <div>
                  <h2 className={'adventure-tab__enemy-name'}>{currentEnemy?.name || 'Unknown Enemy'}</h2>
                  <div className={'adventure-tab__enemy-level'}>Level {currentEnemy?.level || 1}</div>
                </div>
                <div className={'adventure-tab__enemy-reward'}>
                  <div className={'adventure-tab__enemy-reward-label'}>Gold Reward</div>
                  <div className={'adventure-tab__enemy-reward-value'}>{formatNumber(currentEnemy?.goldReward || '0')}</div>
                </div>
              </div>

              {/* Enemy HP Bar */}
              <HPBar current={enemyHP} max={enemyMaxHP} label="Enemy HP" variant="red" />

              {/* Player HP Bar */}
              <HPBar current={playerHP} max={playerMaxHP} label="Your HP" variant="green" />

              {/* Combat Controls */}
              <div className={'adventure-tab__combat-controls'}>
                <motion.button
                  onClick={handleAttack}
                  className={`${'adventure-tab__action-button'} ${'adventure-tab__primary-action'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⚔️ Attack
                </motion.button>

                <motion.button
                  onClick={handleAutoAttackToggle}
                  className={`${'adventure-tab__action-button'} ${
                    autoAttack ? 'adventure-tab__auto-active' : 'adventure-tab__auto-inactive'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {autoAttack ? '⚡ Auto (ON)' : '⚡ Auto (OFF)'}
                </motion.button>

                <motion.button
                  onClick={handleFlee}
                  className={`${'adventure-tab__action-button'} ${'adventure-tab__secondary-action'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏃 Flee
                </motion.button>
              </div>
            </div>

            {/* Combat Log */}
            <div className={`${'adventure-tab__panel'} ${'adventure-tab__combat-log-panel'}`}>
              <h3 className={'adventure-tab__combat-log-title'}>Combat Log</h3>
              <CombatLog />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
