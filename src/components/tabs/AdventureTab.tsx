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
  const barClass = variant === 'green' ? 'adventureTabHpFillGreen' : 'adventureTabHpFillRed';

  return (
    <div className={'adventureTabHpBar'}>
      <div className={'adventureTabHpLabels'}>
        <span className={'adventureTabHpLabel'}>{label}</span>
        <span className={'adventureTabHpValue'}>
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>
      <div className={'adventureTabHpTrack'}>
        <motion.div
          className={`${'adventureTabHpFill'} ${barClass}`}
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
    <div className={'adventureTabCombatLogContainer'}>
      <div className={'adventureTabCombatLogList'}>
        {combatLog.length === 0 ? (
          <div className={'adventureTabCombatLogEmpty'}>Combat log is empty</div>
        ) : (
          combatLog.map((entry, index) => (
            <div
              key={index}
              className={'adventureTabCombatLogEntry'}
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
      <div className={'adventureTabLoading'}>
        <div className={'adventureTabLoadingCard'}>
          <div className={'adventureTabLoadingIcon'}>⚔️</div>
          <div className={'adventureTabLoadingText'}>Loading adventure zones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={'adventureTabRoot'}>
      {/* LEFT PANEL - Zone Selection */}
      <div className={'adventureTabLeftColumn'}>
        <div className={'adventureTabPanel'}>
          <h2 className={'adventureTabPanelTitle'}>🗺️ Adventure Zones</h2>
          <div className={'adventureTabZoneList'}>
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
                  className={`${'buttonStandard'} ${'adventureTabZoneButton'} ${
                    isSelected ? 'adventureTabZoneSelected' : ''
                  } ${
                    unlocked ? '' : 'adventureTabZoneLocked'
                  }`}
                  whileHover={unlocked ? { scale: 1.02 } : {}}
                >
                  <div className={'adventureTabZoneHeader'}>
                    <div className={'adventureTabZoneTitleRow'}>
                      <div className={'adventureTabZoneName'}>{zone.name}</div>
                      {completed && <div className={'adventureTabZoneCompleted'}>✓</div>}
                    </div>
                    <div className={'adventureTabZoneLevel'}>Lv. {zone.levelRange.min}-{zone.levelRange.max}</div>
                  </div>
                  <div className={'adventureTabZoneDescription'}>{zone.description}</div>
                  {unlocked && enemiesDefeated > 0 && (
                    <div className={'adventureTabZoneMeta'}>
                      Enemies defeated: {enemiesDefeated}
                      {bossAvailable && <span className={'adventureTabZoneBoss'}>⚡ Boss available!</span>}
                    </div>
                  )}
                  {!unlocked && <div className={'adventureTabZoneLockedNote'}>🔒 Defeat previous zone boss to unlock</div>}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Combat Area */}
      <div className={'adventureTabRightColumn'}>
        {!inCombat ? (
          // Not in combat - show selection message
          <div className={`${'adventureTabPanel'} ${'adventureTabEmptyPanel'}`}>
            <div className={'adventureTabEmptyContent'}>
              <div className={'adventureTabEmptyIcon'}>⚔️</div>
              <h2 className={'adventureTabEmptyTitle'}>{selectedZoneId ? 'Ready for Combat' : 'Select a Zone'}</h2>
              <p className={'adventureTabEmptyDescription'}>
                {selectedZoneId
                  ? 'Click on the zone again to find an enemy'
                  : 'Choose an adventure zone from the list to begin'}
              </p>

              {/* Quick Stats */}
              <div className={'adventureTabQuickStats'}>
                <div className={'adventureTabQuickStatCard'}>
                  <div className={'adventureTabQuickStatLabel'}>HP</div>
                  <div className={'adventureTabQuickStatValueGreen'}>{formatNumber(stats.hp)}</div>
                </div>
                <div className={'adventureTabQuickStatCard'}>
                  <div className={'adventureTabQuickStatLabel'}>ATK</div>
                  <div className={'adventureTabQuickStatValueRed'}>{formatNumber(stats.atk)}</div>
                </div>
                <div className={'adventureTabQuickStatCard'}>
                  <div className={'adventureTabQuickStatLabel'}>DEF</div>
                  <div className={'adventureTabQuickStatValueBlue'}>{formatNumber(stats.def)}</div>
                </div>
                <div className={'adventureTabQuickStatCard'}>
                  <div className={'adventureTabQuickStatLabel'}>Gold</div>
                  <div className={'adventureTabQuickStatValueGold'}>{formatNumber(gold)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // In combat - show combat interface
          <>
            {/* Combat Canvas */}
            <div className={`${'adventureTabPanel'} ${'adventureTabCanvasPanel'}`}>
              <CombatCanvas
                width={800}
                height={400}
                inCombat={inCombat}
                playerHP={D(playerHP).toNumber()}
                enemyHP={D(enemyHP).toNumber()}
              />
            </div>

            {/* Enemy Info */}
            <div className={`${'adventureTabPanel'} ${'adventureTabEnemyPanel'}`}>
              <div className={'adventureTabEnemyHeader'}>
                <div>
                  <h2 className={'adventureTabEnemyName'}>{currentEnemy?.name || 'Unknown Enemy'}</h2>
                  <div className={'adventureTabEnemyLevel'}>Level {currentEnemy?.level || 1}</div>
                </div>
                <div className={'adventureTabEnemyReward'}>
                  <div className={'adventureTabEnemyRewardLabel'}>Gold Reward</div>
                  <div className={'adventureTabEnemyRewardValue'}>{formatNumber(currentEnemy?.goldReward || '0')}</div>
                </div>
              </div>

              {/* Enemy HP Bar */}
              <HPBar current={enemyHP} max={enemyMaxHP} label="Enemy HP" variant="red" />

              {/* Player HP Bar */}
              <HPBar current={playerHP} max={playerMaxHP} label="Your HP" variant="green" />

              {/* Combat Controls */}
              <div className={'adventureTabCombatControls'}>
                <motion.button
                  onClick={handleAttack}
                  className={`${'buttonStandard'} ${'adventureTabActionButton'} ${'adventureTabPrimaryAction'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⚔️ Attack
                </motion.button>

                <motion.button
                  onClick={handleAutoAttackToggle}
                  className={`${'buttonStandard'} ${'adventureTabActionButton'} ${
                    autoAttack ? 'adventureTabAutoActive' : 'adventureTabAutoInactive'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {autoAttack ? '⚡ Auto (ON)' : '⚡ Auto (OFF)'}
                </motion.button>

                <motion.button
                  onClick={handleFlee}
                  className={`${'buttonStandard'} ${'adventureTabActionButton'} ${'adventureTabSecondaryAction'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏃 Flee
                </motion.button>
              </div>
            </div>

            {/* Combat Log */}
            <div className={`${'adventureTabPanel'} ${'adventureTabCombatLogPanel'}`}>
              <h3 className={'adventureTabCombatLogTitle'}>Combat Log</h3>
              <CombatLog />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
